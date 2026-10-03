import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { toStoryCard } from "../utils/blogCard";

export const PAGE_SIZE = 6;

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
 
  const [reloadKey, setReloadKey] = useState(0);

  const [trending, setTrending] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  const requestId = useRef(0);

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

  useEffect(() => {
    load(1, false);
  }, [load, reloadKey]);

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