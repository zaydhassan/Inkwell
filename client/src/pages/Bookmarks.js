import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Box, Typography } from "@mui/material";

import InkBackdrop from "../components/ink/InkBackdrop";
import { InkEyebrow, InkHeading, InkHighlight } from "../components/ink/InkSectionHead";
import { InkPrimaryButton } from "../components/ink/InkButton";
import { Reveal } from "../components/ink/InkReveal";
import { HistoryFilters } from "../components/reading";
import {
  BookmarksScene,
  BookmarkCard,
  StatsCard,
  TopicsCard,
  RecentCard,
  HeroSkeleton,
  RailSkeleton,
  GridSkeleton,
  EmptyState,
  NoMatchState,
  ErrorState,
  RailNote,
} from "../components/bookmarks";
import "./Bookmarks.css";

/* ─────────────────────────────────────────────────────────────────────
   Bookmarks — "your personal reading library".

   Two real requests, no more:

     GET /api/v1/bookmarks           paged, searched, filtered, sorted
     GET /api/v1/bookmarks/summary   whole-collection aggregates (rail)
     POST /api/v1/bookmarks/toggle   the existing toggle, unchanged

   The list and the summary are deliberately two calls: the grid must
   paginate, while the stats / topics / recently-bookmarked must NOT be
   derived from a single page of it. Splitting them is what keeps every
   figure on the rail honest — which is also why the rail's request never
   carries the grid's `q`, `filter` or `topic`: those narrow the LIST, not
   the library.

   A third call the sibling page makes is absent here on purpose. Reading
   History needs GET /bookmarks/ids to know which of its cards are saved;
   on this page the listed articles ARE the saved ones, so there is nothing
   to ask.

   Nothing here is invented. Every number comes back from those endpoints
   or is derived arithmetically from them in components/reading/insights.
   The per-article "N min read" is not a claim about the reader: it is the
   same 200-wpm estimate of the article's own body that the reader page
   shows, computed on the identical `description` field, and omitted when
   there is no body to measure.
   ───────────────────────────────────────────────────────────────────── */

const PAGE_SIZE = 9;

/* The four tabs, each one a real subset rather than a re-listing of "All":

     All     everything saved
     Unread  saved and never read into — the server excludes any blog the
             reader has a view row with progress > 0 on, which is exactly
             the definition Reading History's own "Articles" tab uses
     Topics  drill into a real category
     Writers drill into a real author

   Sorts are limited to orderings this endpoint can genuinely apply:
   `recent` and `oldest` order by when the reader SAVED the article (a
   field on the bookmark row), and `title` is an A–Z pass over the matched
   blogs. Nothing here is decorative. */
const TABS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "topic", label: "Topics" },
  { key: "writer", label: "Writers" },
];

const SORTS = [
  { key: "recent", label: "Most recent" },
  { key: "oldest", label: "Oldest first" },
  { key: "title", label: "Title A–Z" },
];

const Bookmarks = () => {
  const user = useSelector((state) => state.auth.user);
  const isLogin = useSelector((state) => state.auth.isLogin);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // The reader, from wherever it is currently known. Same fallback the rest
  // of the app uses, so a hard reload with a warm localStorage still works.
  const currentUser = useMemo(() => {
    if (user) return user;
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, [user]);
  const authed = Boolean(isLogin && currentUser?._id);

  /* ── List state ─────────────────────────────────────────────────── */
  const [tab, setTab] = useState("all");
  const [topic, setTopic] = useState("");
  const [writer, setWriter] = useState("");
  const [sort, setSort] = useState("recent");
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState(""); // debounced query

  const [page, setPage] = useState(1);
  const [blogs, setBlogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [loadingMore, setLoadingMore] = useState(false);
  const [busyIds, setBusyIds] = useState([]);

  /* ── Rail state ─────────────────────────────────────────────────── */
  const [summary, setSummary] = useState(null);
  const [summaryState, setSummaryState] = useState("loading"); // loading | ready | error

  // Debounce the search so a fast typist doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setApplied(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  // Any change to what is being asked for returns to page one — otherwise
  // page 3 of a newly-filtered list would open on an empty grid.
  useEffect(() => {
    setPage(1);
  }, [tab, topic, writer, sort, applied]);

  const fetchList = useCallback(
    async (targetPage, append) => {
      if (!authed) return;
      if (append) setLoadingMore(true);
      else setStatus("loading");

      const params = { page: targetPage, limit: PAGE_SIZE, sort };
      if (applied) params.q = applied;
      if (tab !== "all") params.filter = tab;
      if (tab === "topic" && topic) params.topic = topic;
      if (tab === "writer" && writer) params.writer = writer;

      try {
        const { data } = await axios.get("/api/v1/bookmarks", { params });
        const rows = (data.blogs || []).map((blog) => ({
          ...blog,
          tags: Array.isArray(blog.tags) ? blog.tags : [],
        }));
        setBlogs((prev) => (append ? [...prev, ...rows] : rows));
        setTotal(data.total ?? rows.length);
        setHasMore(Boolean(data.hasMore));
        setPage(targetPage);
        setStatus("ready");
      } catch {
        if (!append) {
          setBlogs([]);
          setTotal(0);
          setStatus("error");
        }
        setHasMore(false);
      } finally {
        if (append) setLoadingMore(false);
      }
    },
    [applied, authed, sort, tab, topic, writer]
  );

  // `silent` re-reads the rail without flashing its skeleton — used after a
  // removal, where the stats must catch up but the cards should stay put.
  // A silent failure deliberately leaves the previous figures on screen
  // rather than blanking good data over one dropped request.
  const fetchSummary = useCallback(
    async (silent = false) => {
      if (!authed) return;
      if (!silent) setSummaryState("loading");
      try {
        const { data } = await axios.get("/api/v1/bookmarks/summary");
        setSummary(data.summary || null);
        setSummaryState("ready");
      } catch {
        if (!silent) {
          setSummary(null);
          setSummaryState("error");
        }
      }
    },
    [authed]
  );

  useEffect(() => {
    fetchList(1, false);
  }, [fetchList]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  /* ── Removing a bookmark ────────────────────────────────────────── */
  /* On this page un-saving takes the card OUT of the list — the article no
     longer belongs in "your library". The row leaves optimistically, the
     count drops with it, and both are put back if the server refuses. The
     rail is then re-read, because its stats and its "recently bookmarked"
     list were both describing a collection that just changed. */
  const removeBookmark = useCallback(
    async (blogId) => {
      if (!authed) {
        toast("Log in to change your reading list.", { icon: "🔒" });
        navigate(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      const before = blogs;
      const beforeTotal = total;
      const removing = before.some((b) => b._id === blogId);

      if (removing) {
        setBlogs(before.filter((b) => b._id !== blogId));
        setTotal((t) => Math.max(0, t - 1));
      }
      setBusyIds((prev) => [...prev, blogId]);

      const restore = () => {
        setBlogs(before);
        setTotal(beforeTotal);
      };

      try {
        const { data } = await axios.post("/api/v1/bookmarks/toggle", { blog: blogId });
        if (data.success && data.bookmarked === false) {
          toast.success("Removed from your reading list.");
          fetchSummary(true);
          // The grid just emptied but the library has more in it — go back
          // to page one and refill, rather than leave a false empty state.
          if (removing && before.length === 1) fetchList(1, false);
        } else {
          restore();
          toast.error("Couldn't update bookmark.");
        }
      } catch {
        restore();
        toast.error("Couldn't update bookmark.");
      } finally {
        setBusyIds((prev) => prev.filter((id) => id !== blogId));
      }
    },
    [authed, blogs, total, fetchList, fetchSummary, navigate, pathname]
  );

  const resetFilters = useCallback(() => {
    setTab("all");
    setTopic("");
    setWriter("");
    setQuery("");
    setApplied("");
  }, []);

  const filtering = tab !== "all" || Boolean(applied);
  const railHasSaves = Boolean(summary && summary.savedCount > 0);
  // An empty library has nothing to put on the rail, and the rail's own
  // failure is reported while the summary is still in flight — so the rail
  // is shown until the summary says, truthfully, that there is nothing in it.
  const showRail = summaryState !== "ready" || railHasSaves;

  /* ── Not signed in ──────────────────────────────────────────────── */
  if (!authed) {
    return (
      <Box className="ink ink-bm">
        <InkBackdrop hero drift />
        <Box className="ink-bm-wrap">
          <Box className="ink-bm-state-card">
            <Typography component="h1" className="ink-bm-state-title">
              Sign in to see your reading list.
            </Typography>
            <Typography className="ink-bm-state-text">
              Your bookmarks live on your account, so we can show you everything you’ve saved —
              on any device.
            </Typography>
            <InkPrimaryButton
              as={Link}
              to={`/login?redirect=${encodeURIComponent(pathname)}`}
              sx={{ mt: 3 }}
            >
              Log in
            </InkPrimaryButton>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="ink ink-bm">
      <InkBackdrop hero drift />

      <Box className="ink-bm-wrap">
        {/* ── Split hero ─────────────────────────────────────────────── */}
        {status === "loading" && !blogs.length ? (
          <HeroSkeleton />
        ) : (
          <Reveal className="ink-bm-hero" y={18}>
            <Box className="ink-bm-hero-copy">
              <InkEyebrow>Saved for later</InkEyebrow>
              <InkHeading component="h1" size="hero" sx={{ mt: 2.5 }}>
                Your <InkHighlight>Bookmarks</InkHighlight>
              </InkHeading>
              <Typography className="ink-bm-hero-sub">
                Everything you’ve set aside, gathered in one place — search it, sort it, and pick up
                where you meant to.
              </Typography>
            </Box>
            <Box className="ink-bm-hero-art">
              <Box className="ink-plate ink-bm-plate">
                <BookmarksScene />
              </Box>
            </Box>
          </Reveal>
        )}

        {/* ── Controls ───────────────────────────────────────────────── */}
        {/* The label names the region the controls act on, so the tab row
            reads as "the list's controls" rather than a second navigation. */}
        <Typography className="ink-bm-secthead" component="h2">
          Saved articles
        </Typography>

        <Box className="ink-bm-filterbar">
          <HistoryFilters
            tab={tab}
            onTab={(next) => {
              setTab(next);
              setTopic("");
              setWriter("");
            }}
            query={query}
            onQuery={setQuery}
            sort={sort}
            onSort={setSort}
            topics={summary?.topics || []}
            writers={summary?.writers || []}
            topic={topic}
            writer={writer}
            onPick={(value) => (tab === "topic" ? setTopic(value) : setWriter(value))}
            tabs={TABS}
            sorts={SORTS}
            placeholder="Search your reading list..."
            searchLabel="Search your reading list"
            filterLabel="Filter your reading list"
            emptyDrill="they appear once you’ve saved something"
          />
        </Box>

        {/* ── 72 / 28 split ──────────────────────────────────────────── */}
        <Box className={`ink-bm-split${showRail ? "" : " is-solo"}`}>
          <Box className="ink-bm-main">
            <Box className="ink-bm-resultline">
              {status !== "loading" && (
                <Typography component="p" className="ink-bm-resultcount">
                  {total === 0 ? "No articles" : `${total} article${total === 1 ? "" : "s"}`}
                  {filtering ? " in this view" : " saved"}
                </Typography>
              )}
            </Box>

            {status === "error" ? (
              <ErrorState onRetry={() => fetchList(1, false)} />
            ) : status === "loading" && !blogs.length ? (
              <Box className="ink-bm-grid">
                <GridSkeleton count={6} />
              </Box>
            ) : blogs.length === 0 ? (
              filtering ? (
                <NoMatchState filtered={tab !== "all"} onReset={resetFilters} />
              ) : (
                <EmptyState />
              )
            ) : (
              <>
                <Box className="ink-bm-grid">
                  {blogs.map((blog, i) => (
                    // Each card is its own `Reveal`, so the grid rises in a
                    // short stagger. The delay is capped: a long library
                    // should not turn into a slow procession.
                    <Reveal
                      key={blog._id}
                      className="ink-bm-cell"
                      y={18}
                      amount={0.1}
                      delay={Math.min(i, 5) * 0.06}
                    >
                      <BookmarkCard
                        blog={blog}
                        busy={busyIds.includes(blog._id)}
                        onRemove={removeBookmark}
                      />
                    </Reveal>
                  ))}
                </Box>

                {hasMore && (
                  <Box className="ink-bm-more">
                    <InkPrimaryButton
                      onClick={() => fetchList(page + 1, true)}
                      disabled={loadingMore}
                      size="large"
                    >
                      {loadingMore ? "Loading…" : "Load more articles"}
                    </InkPrimaryButton>
                  </Box>
                )}
              </>
            )}
          </Box>

          {/* ── Right rail ───────────────────────────────────────────── */}
          {showRail && (
            <Box component="aside" className="ink-bm-rail" aria-label="Your library">
              <Typography className="ink-bm-railhead">Your library</Typography>
              {summaryState === "loading" ? (
                <RailSkeleton />
              ) : summaryState === "error" ? (
                <RailNote />
              ) : (
                <>
                  <Reveal className="ink-bm-railcell" y={16} delay={0.05}>
                    <StatsCard summary={summary} />
                  </Reveal>
                  <Reveal className="ink-bm-railcell" y={16} delay={0.13}>
                    <TopicsCard topics={summary.topics || []} hasSaves />
                  </Reveal>
                  <Reveal className="ink-bm-railcell" y={16} delay={0.21}>
                    <RecentCard recent={summary.recent || []} />
                  </Reveal>
                </>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Bookmarks;
