import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Box, Typography } from "@mui/material";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import StyleOutlinedIcon from "@mui/icons-material/StyleOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import InkBackdrop from "../components/ink/InkBackdrop";
import InkStatsBand from "../components/ink/InkStatsBand";
import { InkEyebrow, InkHeading, InkHighlight } from "../components/ink/InkSectionHead";
import { InkPrimaryButton } from "../components/ink/InkButton";
import { Reveal } from "../components/ink/InkReveal";
import {
  ReadingScene,
  HistoryCard,
  HistoryFilters,
  StreakCard,
  TopicsCard,
  ActivityCard,
  HeroSkeleton,
  RailSkeleton,
  GridSkeleton,
  EmptyState,
  NoMatchState,
  ErrorState,
  RailNote,
  readingStreak,
} from "../components/reading";
import "../pages/ReadingHistory.css";

/* ─────────────────────────────────────────────────────────────────────
   Reading History — "your personal reading journey".

   Three real requests, no more:

     GET /api/v1/reading-history           paged, searched, filtered, sorted
     GET /api/v1/reading-history/summary    whole-history aggregates (rail)
     GET /api/v1/bookmarks/ids              the reader's saved ids (once)

   The list and the summary are deliberately two calls: the grid must
   paginate, while the streak / topics / heatmap must NOT be derived from
   a single page of it. Splitting them is what keeps every figure on the
   rail honest no matter how long the history is.

   Nothing here is invented. Every number comes back from those endpoints
   or is derived arithmetically from them in `components/reading/insights`.
   The per-article "N min read" is not a claim about the reader: it is the
   same 200-wpm estimate of the article's own body that the reader page
   shows, computed on the identical `description` field, and omitted when
   there is no body to measure.
   ───────────────────────────────────────────────────────────────────── */

const PAGE_SIZE = 9;
const BOOKMARK_COUNT_ICON = "🔖";

const ReadingHistory = () => {
  const user = useSelector((state) => state.auth.user);
  const isLogin = useSelector((state) => state.auth.isLogin);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // The reader, from wherever it is currently known. Same fallback the rest
  // of the app uses, so a hard reload with a warm localStorage still works.
  const currentUser = useMemo(
    () => user || JSON.parse(localStorage.getItem("user") || "{}"),
    [user]
  );
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

  /* ── Rail state ─────────────────────────────────────────────────── */
  const [summary, setSummary] = useState(null);
  const [summaryState, setSummaryState] = useState("loading"); // loading | ready | error

  /* ── Bookmarks (real ids from the existing endpoint, not a parallel store) ── */
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [busyIds, setBusyIds] = useState([]);

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
        const { data } = await axios.get("/api/v1/reading-history", { params });
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

  const fetchSummary = useCallback(async () => {
    if (!authed) return;
    setSummaryState("loading");
    try {
      const { data } = await axios.get("/api/v1/reading-history/summary");
      setSummary(data.summary || null);
      setSummaryState("ready");
    } catch {
      setSummary(null);
      setSummaryState("error");
    }
  }, [authed]);

  useEffect(() => {
    fetchList(1, false);
  }, [fetchList]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Saved ids, fetched once per load — the same call and contract as Explore
  // and the blog detail page, so bookmarks stay one source of truth.
  useEffect(() => {
    if (!authed) {
      setBookmarkedIds([]);
      return undefined;
    }
    let cancelled = false;
    axios
      .get("/api/v1/bookmarks/ids")
      .then(({ data }) => {
        if (!cancelled && data.success) setBookmarkedIds(data.ids || []);
      })
      .catch(() => {
        /* Non-critical: cards simply render as un-bookmarked. */
      });
    return () => {
      cancelled = true;
    };
  }, [authed]);

  const toggleBookmark = useCallback(
    async (blogId) => {
      if (!authed) {
        toast("Log in to save articles.", { icon: "🔒" });
        navigate(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      const flip = (list) =>
        list.includes(blogId) ? list.filter((id) => id !== blogId) : [...list, blogId];

      setBookmarkedIds(flip); // optimistic
      setBusyIds((prev) => [...prev, blogId]);
      try {
        const { data } = await axios.post("/api/v1/bookmarks/toggle", { blog: blogId });
        if (data.success) {
          setBookmarkedIds((prev) => {
            const on = prev.includes(blogId);
            if (data.bookmarked === on) return prev;
            return flip(prev);
          });
          toast.success(data.bookmarked ? "Saved to your list." : "Removed from your list.");
        }
      } catch {
        setBookmarkedIds(flip); // revert
        toast.error("Couldn't update bookmark.");
      } finally {
        setBusyIds((prev) => prev.filter((id) => id !== blogId));
      }
    },
    [authed, navigate, pathname]
  );

  const resetFilters = useCallback(() => {
    setTab("all");
    setTopic("");
    setWriter("");
    setQuery("");
    setApplied("");
  }, []);

  /* ── Derived, all from real summary figures ─────────────────────── */
  const streak = useMemo(
    () => readingStreak(summary?.days || [], Date.now()),
    [summary]
  );

  // Four stats, each one a figure the server actually aggregated. All four
  // are always real numbers, so the band never pads itself out.
  const stats = useMemo(() => {
    if (!summary || summary.articles === 0) return [];
    return [
      { icon: <MenuBookOutlinedIcon />, value: summary.articles, label: "Articles read" },
      { icon: <LocalFireDepartmentIcon />, value: streak.current, label: "Reading streak" },
      { icon: <StyleOutlinedIcon />, value: (summary.topics || []).length, label: "Topics explored" },
      { icon: <EditOutlinedIcon />, value: summary.writerCount || 0, label: "Writers read" },
    ];
  }, [summary, streak.current]);

  const filtering = tab !== "all" || Boolean(applied);
  const showStats = stats.length > 0;

  /* ── Not signed in ──────────────────────────────────────────────── */
  if (!authed) {
    return (
      <Box className="ink ink-reading">
        <InkBackdrop hero drift />
        <Box className="ink-rh-wrap">
          <Box className="ink-rh-state-card">
            <Typography component="h1" className="ink-rh-state-title">
              Sign in to see your reading history.
            </Typography>
            <Typography className="ink-rh-state-text">
              Your history lives on your account, so we can show you what you’ve read and how far
              you got.
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
    <Box className="ink ink-reading">
      <InkBackdrop hero drift />

      <Box className="ink-rh-wrap">
        {/* ── Split hero ─────────────────────────────────────────────── */}
        {status === "loading" && !blogs.length ? (
          <HeroSkeleton />
        ) : (
          <Reveal className="ink-rh-hero" y={18}>
            <Box className="ink-rh-hero-copy">
              <InkEyebrow>Pick up where you left off</InkEyebrow>
              <InkHeading component="h1" size="hero" sx={{ mt: 2.5 }}>
                Reading <InkHighlight>History</InkHighlight>
              </InkHeading>
              <Typography className="ink-rh-hero-sub">
                Articles you’ve read, insights you’ve gathered, and ideas worth revisiting.
              </Typography>
            </Box>
            <Box className="ink-rh-hero-art">
              <Box className="ink-plate ink-rh-plate">
                <ReadingScene />
              </Box>
            </Box>
          </Reveal>
        )}

        {/* ── Compact stats row ──────────────────────────────────────── */}
        {showStats && (
          <Reveal y={16} className="ink-rh-statsband">
            <InkStatsBand stats={stats} />
          </Reveal>
        )}

        {/* ── Controls ───────────────────────────────────────────────── */}
        {/* The label names the region the controls act on, so the tab row
            reads as "the history's controls" rather than as a second
            navigation bar. */}
        <Typography className="ink-rh-secthead" component="h2">
          Reading history
        </Typography>

        <Box className="ink-rh-filterbar">
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
          />
        </Box>

        {/* ── 72 / 28 split ──────────────────────────────────────────── */}
        <Box className="ink-rh-split">
          <Box className="ink-rh-main">
            <Box className="ink-rh-resultline">
              {status !== "loading" && (
                <Typography component="p" className="ink-rh-resultcount">
                  {total === 0
                    ? "No articles"
                    : `${total} article${total === 1 ? "" : "s"}`}
                  {filtering ? " in this view" : " read"}
                </Typography>
              )}
            </Box>

            {status === "error" ? (
              <ErrorState onRetry={() => fetchList(1, false)} />
            ) : status === "loading" && !blogs.length ? (
              <Box className="ink-rh-grid">
                <GridSkeleton count={6} />
              </Box>
            ) : blogs.length === 0 ? (
              filtering ? (
                <NoMatchState
                  filtered={tab !== "all"}
                  onReset={resetFilters}
                />
              ) : (
                <EmptyState />
              )
            ) : (
              <>
                <Box className="ink-rh-grid">
                  {blogs.map((blog, i) => (
                    // Each card is its own `Reveal`, so the grid rises in a
                    // short stagger. The delay is capped: a long history
                    // should not turn into a slow procession.
                    <Reveal
                      key={blog._id}
                      className="ink-rh-cell"
                      y={18}
                      amount={0.1}
                      delay={Math.min(i, 5) * 0.06}
                    >
                      <HistoryCard
                        blog={blog}
                        bookmarked={bookmarkedIds.includes(blog._id)}
                        busy={busyIds.includes(blog._id)}
                        onToggleBookmark={toggleBookmark}
                      />
                    </Reveal>
                  ))}
                </Box>

                {hasMore && (
                  <Box className="ink-rh-more">
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
          <Box component="aside" className="ink-rh-rail" aria-label="Your reading journey">
            <Typography className="ink-rh-railhead">Your reading journey</Typography>
            {summaryState === "loading" ? (
              <RailSkeleton />
            ) : summaryState === "error" ? (
              <RailNote />
            ) : summary && summary.articles > 0 ? (
              <>
                <Reveal className="ink-rh-railcell" y={16} delay={0.05}>
                  <StreakCard summary={summary} />
                </Reveal>
                <Reveal className="ink-rh-railcell" y={16} delay={0.13}>
                  <TopicsCard topics={summary.topics || []} />
                </Reveal>
                <Reveal className="ink-rh-railcell" y={16} delay={0.21}>
                  <ActivityCard heat={summary.heat || []} />
                </Reveal>
              </>
            ) : (
              <RailNote />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ReadingHistory;
