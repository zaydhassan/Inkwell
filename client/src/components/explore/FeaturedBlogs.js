import React from "react";
import { Link } from "react-router-dom";
import { InkHighlight, InkSectionHead } from "../ink";
import { StoryGrid, StoryGridSkeleton } from "./StoryGrid";

/* ─────────────────────────────────────────────────────────────────────
   InkWell Explore — Featured Blogs.

   The head of the current result set: the three stories the server ranked
   first for whatever the reader is looking at (newest first across the
   catalog, or within the active category, or the best matches for their
   search). Deliberately the *same* query as Latest Stories below it — Featured
   is the top of the list, not a second, unrelated list, so switching a filter
   never leaves a stale "featured" row contradicting the grid under it.
   ───────────────────────────────────────────────────────────────────── */

const FeaturedBlogs = ({
  posts = [],
  loading = false,
  total = 0,
  category = "",
  query = "",
  bookmarkedIds,
  onToggleBookmark,
}) => {
  // With a filter active, "hand-picked" would be a lie — these are simply the
  // top of the current result set — so the head says what the reader is
  // actually looking at.
  const term = query.trim();
  const scope = category
    ? `Stories in ${category}.`
    : term
      ? `Stories matching “${term}”.`
      : null;

  return (
    <section className="ink-explore-section" aria-label="Featured stories">
      <header className="ink-explore-section-head">
        <InkSectionHead
          eyebrow={scope ? "Results" : "Featured"}
          title={
            scope ? (
              <>
                {scope.slice(0, scope.lastIndexOf(" ") + 1)}
                <InkHighlight>{scope.slice(scope.lastIndexOf(" ") + 1)}</InkHighlight>
              </>
            ) : (
              <>
                Hand-picked stories from our <InkHighlight>community.</InkHighlight>
              </>
            )
          }
        />
        {/* The size of the whole result set for the active filters — the server's
            count, not the number of cards rendered. It is also the fastest way
            for a reader to see that a search matched less than they expected. */}
        {!loading && total > 0 && (
          <span className="ink-explore-count">
            {total} {total === 1 ? "story" : "stories"}
          </span>
        )}
      </header>

      {loading ? (
        <StoryGridSkeleton count={3} />
      ) : (
        <StoryGrid posts={posts} bookmarkedIds={bookmarkedIds} onToggleBookmark={onToggleBookmark} />
      )}

      {/* A short result set leaves two empty tracks in a three-column grid. This
          turns that hole into a way out rather than a void — and it is true to
          the count, so it never claims more than the library holds. */}
      {!loading && posts.length > 0 && posts.length < 3 && (
        <p className="ink-explore-note">
          {total === 1 ? "Only one story here so far." : `Only ${total} stories here so far.`}{" "}
          <Link to="/explore" className="ink-explore-note-link">
            Browse the whole library →
          </Link>
        </p>
      )}
    </section>
  );
};

export default FeaturedBlogs;
