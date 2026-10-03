import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { toStoryCard } from "../utils/blogCard";

/* ─────────────────────────────────────────────────────────────────────
   The Explore feed.

   Owns everything the Explore page needs from the backend: the paginated,
   searchable, categorised story list plus the trending rail. The page keeps
   only presentation state, so the loading/empty/error rules live in one place
   instead of being re-derived at each render.

   Two things it deliberately does NOT do:
     • It never fetches the whole catalog. Search and category are both sent to
       the server (`?q=`, `/category/:name`), and the grid pages in with
       `?page=` — the old page pulled every blog up front and filtered in
       memory, which stops working the moment the list is paginated.
     • It never invents a figure. Cards are built by the shared `toStoryCard`
       mapper, which only sets `likes`/`comments` when the endpoint actually
       aggregated them.
   ───────────────────────────────────────────────────────────────────── */

// Cards per page. The grid is 2-up on desktop, so 6 fills three clean rows and
// keeps "Load more" meaning a small, quick increment.
export const PAGE_SIZE = 6;

// Long enough that a normal typing burst produces one request, short enough
// that the grid feels like it is following along.
const DEBOUNCE_MS = 350;

const listEndpoint = (category) =>
  category
    ? `/api/v1/blog/category/${encodeURIComponent(category)}`
    : "/api/v1/blog/all-blog";

const useExploreFeed = ({ category = "" } = {}) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const [blogs, setBlogs] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  // Bumped by "Try again" to re-run the first-page effect without touching the
  // query or the category.
  const [reloadKey, setReloadKey] = useState(0);

  const [trending, setTrending] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  // Monotonic id so a slow response from a superseded request (a stale query,
  // or the previous category) can be dropped instead of overwriting the grid.
  const requestId = useRef(0);

  /* Typing → one request. */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(
    async (pageToLoad, append) => {
      const id = requestId.current + 1;
      requestId.current = id;

      if (append) setLoadingMore(true);
      else {
        setLoading(true);
        setError(false);
      }

      try {
        const params = { page: pageToLoad, limit: PAGE_SIZE };
        if (debouncedQuery) params.q = debouncedQuery;

        const { data } = await axios.get(listEndpoint(category), { params });
        if (id !== requestId.current) return;

        const cards = (data.blogs || []).map((b) => toStoryCard(b));
        setBlogs((prev) => (append ? [...prev, ...cards] : cards));
        setHasMore(Boolean(data.hasMore));
        setTotal(typeof data.total === "number" ? data.total : cards.length);
        setPage(pageToLoad);
        setError(false);
      } catch {
        // The raw backend message is never surfaced — the page shows its own
        // copy. A failed "load more" leaves the stories already on screen
        // alone rather than blanking the grid.
        if (id !== requestId.current) return;
        if (!append) {
          setBlogs([]);
          setError(true);
        }
        setHasMore(false);
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [category, debouncedQuery]
  );

  /* New search or new category → back to page 1. */
  useEffect(() => {
    load(1, false);
  }, [load, reloadKey]);

  /* Trending is independent of the filters — it is "what the community is
     reading", not "what matches your search" — so it is fetched once per page
     load and never re-run by the debounce. Failure is silent: the card simply
     renders nothing rather than an error, since it is a secondary rail. */
  useEffect(() => {
    let alive = true;
    axios
      .get("/api/v1/blog/trending")
      .then(({ data }) => {
        if (alive) setTrending(data.success ? data.trending || [] : []);
      })
      .catch(() => {
        if (alive) setTrending([]);
      })
      .finally(() => {
        if (alive) setTrendingLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    load(page + 1, true);
  }, [load, loadingMore, hasMore, page]);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  // Filtering is active when either control is narrowing the list — the empty
  // state phrases itself differently for "nothing here yet" vs "nothing
  // matched", so the page needs to know.
  const isFiltered = Boolean(debouncedQuery) || Boolean(category);

  return {
    query,
    setQuery,
    debouncedQuery,
    blogs,
    page,
    total,
    hasMore,
    loading,
    loadingMore,
    error,
    retry,
    loadMore,
    trending,
    trendingLoading,
    isFiltered,
  };
};

export default useExploreFeed;
