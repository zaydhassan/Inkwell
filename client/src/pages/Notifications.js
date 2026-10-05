import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Box } from "@mui/material";
import axios from "axios";
import toast from "react-hot-toast";
import { InkBackdrop, InkGhostButton } from "../components/ink";
import {
  ActivityHero,
  ActivityFilters,
  ActivityFeed,
  ActivitySidebar,
  FeedSkeleton,
  SidebarSkeleton,
  FeedError,
  FeedEmpty,
  FilterEmpty,
  FILTERS,
  meta,
  matchesFilter,
  summarise,
} from "../components/notifications";
import { useAuth } from "../context/AuthContext";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markReadOne,
} from "../redux/store";
import "./Notifications.css";

/* ─────────────────────────────────────────────────────────────────────
   InkWell — Activity Center (the Notifications page).

   This is a presentation layer over the notification API that already
   exists. No endpoint was added, changed or removed; the list, the unread
   count, the single mark-read and the mark-all-read all call the same
   routes the page used before, and the list itself is read from the SHARED
   redux notifications slice rather than a second local copy — so reading an
   item here also drops the navbar bell's badge in the same tick.

   REAL DATA OR NO DATA, applied strictly:
     • The feed renders exactly what the API returned. Where the server
       leaves `text` empty (likes/comments/replies carry none) the sentence
       is assembled from the populated actor + blog the API already sends —
       never from a canned string.
     • The summary strip is built by format.summarise() and only contains
       countable figures (exact unread total, per-kind counts over the
       loaded notifications). No zero-padding, no invented metrics.
     • The rail's streak / published / saved / points each come from a real
       endpoint and are DROPPED when that endpoint fails or says nothing.
     • `mention` does not exist in this backend's type enum, so there is no
       Mentions filter and no Mentions metric — see format.TYPES.
     • There are no notification preferences to read or write anywhere in
       the API, so there is no preferences card.
     • Empty and error states carry no placeholder notifications at all.
   ───────────────────────────────────────────────────────────────────── */

// The API caps `limit` at 50 (utils/pagination MAX_LIMIT). Fetching the max
// on the first page means the per-kind counts in the summary strip are exact
// for any account with up to 50 notifications, and `hasMore` tells us when
// they are not.
const PAGE_SIZE = 50;

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);

const Notifications = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();

  const list = useSelector((s) => s.notifications.list);
  const unreadCount = useSelector((s) => s.notifications.unreadCount);
  const page = useSelector((s) => s.notifications.page);
  const hasMore = useSelector((s) => s.notifications.hasMore);
  const status = useSelector((s) => s.notifications.status);

  const [filter, setFilter] = useState("all");
  const [failed, setFailed] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [marking, setMarking] = useState(false);
  const [stats, setStats] = useState({ streak: null, published: null, saved: null, points: null, ready: false });

  const load = useCallback(
    async (p) => {
      const res = await dispatch(fetchNotifications({ page: p, limit: PAGE_SIZE }));
      setFailed(fetchNotifications.rejected.match(res));
    },
    [dispatch]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  // The badge count is the server's own total — kept in sync with the bell.
  useEffect(() => {
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  /* The rail's figures. Three independent requests, each tolerated
     separately: a metric whose request failed stays `null` and its row is
     simply not rendered (see ActivitySidebar). Nothing here is derived from
     the notifications list, so the rail cannot echo the feed back at the
     reader as if it were a profile stat. */
  useEffect(() => {
    if (!user?._id) {
      setStats((s) => ({ ...s, ready: true }));
      return undefined;
    }
    let alive = true;
    Promise.allSettled([
      axios.get("/api/v1/writing/stats"),
      axios.get(`/api/v1/blog/user-blog/${user._id}`),
      axios.get("/api/v1/bookmarks/ids"),
    ]).then(([w, b, k]) => {
      if (!alive) return;
      const blogs = b.status === "fulfilled" ? b.value?.data?.userBlog?.blogs : null;
      setStats({
        streak: w.status === "fulfilled" ? num(w.value?.data?.currentStreak) : null,
        // The endpoint returns every one of the user's blogs; "published" is
        // the subset the rest of the app treats as public.
        published: Array.isArray(blogs) ? blogs.filter((x) => x.status === "Published").length : null,
        saved:
          k.status === "fulfilled" && Array.isArray(k.value?.data?.ids)
            ? k.value.data.ids.length
            : null,
        points: num(user.points),
        ready: true,
      });
    });
    return () => {
      alive = false;
    };
  }, [user?._id, user?.points]);

  /* Per-segment counts are counts of the loaded feed — the same population
     the segment filters — so a segment's number always matches what
     selecting it shows. (The hero's Unread tile is the server's exact
     total instead, which is the figure the bell badge also shows.) */
  const counts = useMemo(() => {
    const c = {};
    for (const f of FILTERS) c[f.id] = 0;
    for (const n of list) for (const f of FILTERS) if (matchesFilter(n, f.id)) c[f.id] += 1;
    return c;
  }, [list]);

  const visible = useMemo(() => list.filter((n) => matchesFilter(n, filter)), [list, filter]);
  const tiles = useMemo(() => summarise(list, unreadCount), [list, unreadCount]);
  // `list` is newest-first, so the first milestone is the most recent one.
  const milestone = useMemo(() => list.find((n) => meta(n.type).kind === "milestone") || null, [list]);

  const handleOpen = useCallback(
    (n, dest) => {
      if (!n.read) {
        // Optimistic: the row's dot clears and the bell's count drops now.
        dispatch(markReadOne(n._id));
        // Persist behind it. A failure is not fatal — the next unread-count
        // poll reconciles the badge against the server's truth.
        axios.patch(`/api/v1/notifications/${n._id}/read`).catch(() => {});
      }
      if (dest) navigate(dest);
    },
    [dispatch, navigate]
  );

  const handleMarkAll = async () => {
    setMarking(true);
    const res = await dispatch(markAllNotificationsRead());
    setMarking(false);
    if (markAllNotificationsRead.rejected.match(res)) {
      toast.error("Couldn't mark notifications as read.");
    } else {
      toast.success("All notifications marked as read.");
    }
  };

  const handleMore = async () => {
    setLoadingMore(true);
    await load(page + 1);
    setLoadingMore(false);
  };

  const loading = status === "loading" && list.length === 0;
  const hasAny = list.length > 0;
  // "No notifications at all" and "no unread" are different screens: the
  // first replaces the feed, the second keeps it and just says so.
  const nothingAtAll = !loading && !failed && !hasAny;
  const activeFilter = FILTERS.find((f) => f.id === filter);

  return (
    <Box className="ink ink-notifications" component="main">
      {/* The same 54px grid / grain / drifting glow the other editorial
          pages mount, so this reads as one of them rather than as a list. */}
      <InkBackdrop hero drift />

      <div className="ink-nt-wrap">
        <ActivityHero tiles={tiles} loading={loading} />

        {!nothingAtAll && (
          <ActivityFilters
            filter={filter}
            onChange={setFilter}
            counts={counts}
            unreadCount={unreadCount}
            hasAny={hasAny}
            onMarkAll={handleMarkAll}
            marking={marking}
          />
        )}

        <div className="ink-nt-layout">
          <div className="ink-nt-col-main">
            {failed ? (
              <FeedError onRetry={() => load(1)} />
            ) : loading ? (
              <FeedSkeleton rows={4} />
            ) : nothingAtAll ? (
              <FeedEmpty />
            ) : visible.length === 0 ? (
              <FilterEmpty filter={filter} labels={activeFilter?.label} />
            ) : (
              <>
                <ActivityFeed items={visible} filter={filter} onOpen={handleOpen} />
                {hasMore && (
                  <div className="ink-nt-more">
                    <InkGhostButton onClick={handleMore} disabled={loadingMore}>
                      {loadingMore ? "Loading…" : "Load more activity"}
                    </InkGhostButton>
                  </div>
                )}
              </>
            )}
          </div>

          <aside className="ink-nt-rail">
            {stats.ready ? (
              <ActivitySidebar stats={stats} milestone={milestone} unreadCount={unreadCount} />
            ) : (
              <SidebarSkeleton />
            )}
          </aside>
        </div>
      </div>
    </Box>
  );
};

export default Notifications;
