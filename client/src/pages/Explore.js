import React, { useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import { toastBookmarked } from "../utils/toasts";
import { InkBackdrop } from "../components/ink";
import ExploreHero from "../components/explore/ExploreHero";
import BlogSearch from "../components/explore/BlogSearch";
import CategoryFilters from "../components/explore/CategoryFilters";
import FeaturedBlogs from "../components/explore/FeaturedBlogs";
import LatestStories from "../components/explore/LatestStories";
import CategorySidebar from "../components/explore/CategorySidebar";
import TrendingBlogs from "../components/explore/TrendingBlogs";
import NewsletterCard from "../components/explore/NewsletterCard";
import { ExploreEmpty, ExploreError } from "../components/explore/ExploreStates";
import useExploreFeed from "../hooks/useExploreFeed";
import "./Explore.css";

/* ─────────────────────────────────────────────────────────────────────
   InkWell — Explore.

   The catalog: one query, filtered by search and category, presented as a
   featured row plus a paginated latest list, with a browse/trending/newsletter
   rail beside it.

   Data flow, end to end:
     /api/v1/blog/all-blog | /category/:name  →  useExploreFeed  →
     utils/blogCard.toStoryCard  →  InkStoryCard
   Nothing in this file maps a raw API document itself, so a post looks the
   same here as it does on Home, and the two can't drift.

   Featured is the first three stories of the result set and Latest continues
   from the fourth, so no story is shown twice and both sections always agree
   with the active filters.

   The page mounts under `.ink`, which is what pins it to the always-dark
   editorial canvas regardless of the app's light/dark theme (see
   styles/inkwell.css — the tokens live on `.ink`, not on `:root`).
   ───────────────────────────────────────────────────────────────────── */

// How many stories the Featured row leads with. Three fills the row.
const FEATURED_COUNT = 3;

const Explore = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isLogin = useSelector((state) => state.auth.isLogin);
  const user = useSelector((state) => state.auth.user);

  // Category comes from the route (/category/:name), so pills, sidebar links,
  // the URL and the grid are all one source of truth.
  const category = useMemo(() => {
    if (!pathname.startsWith("/category/")) return "";
    const raw = pathname.split("/").filter(Boolean).pop() || "";
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, [pathname]);

  const feed = useExploreFeed({ category });
  const {
    query,
    setQuery,
    blogs,
    total,
    hasMore,
    loading,
    loadingMore,
    error,
    retry,
    loadMore,
    trending,
    trendingLoading,
  } = feed;

  // Saved-post ids, fetched once per page load rather than per card.
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");
    if (!isLogin || !currentUser?._id) {
      setBookmarkedIds([]);
      return undefined;
    }
    axios
      .get("/api/v1/bookmarks/ids")
      .then(({ data }) => {
        if (!cancelled && data.success) setBookmarkedIds(data.ids || []);
      })
      .catch(() => {
        // Non-critical: the grid simply renders as un-bookmarked.
      });
    return () => {
      cancelled = true;
    };
  }, [isLogin, user]);

  // Real bookmark toggle — optimistic flip, revert on failure, anonymous
  // readers sent to sign in and returned here afterwards. Same contract as
  // Home and the blog detail page.
  const handleToggleBookmark = async (blogId) => {
    const currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");
    if (!isLogin || !currentUser?._id) {
      toast("Log in to save articles.", { icon: "🔒" });
      navigate(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    setBookmarkedIds((prev) =>
      prev.includes(blogId) ? prev.filter((id) => id !== blogId) : [...prev, blogId]
    );
    try {
      const { data } = await axios.post("/api/v1/bookmarks/toggle", { blog: blogId });
      if (data.success) {
        setBookmarkedIds((prev) =>
          data.bookmarked
            ? prev.includes(blogId)
              ? prev
              : [...prev, blogId]
            : prev.filter((id) => id !== blogId)
        );
        toastBookmarked(data.bookmarked);
      }
    } catch {
      setBookmarkedIds((prev) =>
        prev.includes(blogId) ? prev.filter((id) => id !== blogId) : [...prev, blogId]
      );
      toast.error("Couldn't update bookmark.");
    }
  };

  const featured = blogs.slice(0, FEATURED_COUNT);
  const latest = blogs.slice(FEATURED_COUNT);
  const remaining = Math.max(0, total - blogs.length);

  // "No stories here yet" and "nothing matched" are different nothings — see
  // ExploreStates.
  const isFiltered = Boolean(query.trim()) || Boolean(category);
  const clearFilters = () => {
    setQuery("");
    if (category) navigate("/explore");
  };

  return (
    <Box className="ink ink-explore" component="main">
      <InkBackdrop drift />

      <div className="ink-explore-wrap">
        <ExploreHero />

        <div className="ink-explore-controls">
          <BlogSearch
            value={query}
            onChange={setQuery}
            resultCount={total}
            loading={loading}
            scopeLabel={category ? `in ${category}` : ""}
          />
          <CategoryFilters active={category} />
        </div>

        <div className="ink-explore-layout">
          <div className="ink-explore-main">
            {error ? (
              <ExploreError onRetry={retry} />
            ) : !loading && blogs.length === 0 ? (
              <ExploreEmpty
                isFiltered={isFiltered}
                query={query.trim()}
                onClearFilters={clearFilters}
              />
            ) : (
              <>
                <FeaturedBlogs
                  posts={featured}
                  loading={loading}
                  total={total}
                  category={category}
                  query={query}
                  bookmarkedIds={bookmarkedIds}
                  onToggleBookmark={handleToggleBookmark}
                />
                <LatestStories
                  posts={latest}
                  loading={loading}
                  loadingMore={loadingMore}
                  hasMore={hasMore}
                  remaining={remaining}
                  onLoadMore={loadMore}
                  bookmarkedIds={bookmarkedIds}
                  onToggleBookmark={handleToggleBookmark}
                />
              </>
            )}
          </div>

          <aside className="ink-explore-aside" aria-label="Browse and trending">
            <CategorySidebar active={category} />
            <TrendingBlogs items={trending} loading={trendingLoading} />
            <NewsletterCard />
          </aside>
        </div>
      </div>
    </Box>
  );
};

export default Explore;
