import React from "react";
import { Box } from "@mui/material";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import { InkGhostButton, InkHighlight, InkSectionHead } from "../ink";
import { StoryGrid, StoryGridSkeleton } from "./StoryGrid";

/* ─────────────────────────────────────────────────────────────────────
   InkWell Explore — Latest Stories.

   The remainder of the result set, continuing past the three stories Featured
   already showed — the two sections never repeat a story, so the reader is not
   asked to scan the same card twice.

   "Load more" asks the server for the next page (`?page=`) rather than the
   page holding the whole catalog in memory. The footer says what is left
   ("6 more") so the button is a known quantity, and once the list is exhausted
   it turns into a plain end-of-list line — no dead button.
   ───────────────────────────────────────────────────────────────────── */

const LatestStories = ({
  posts = [],
  loading = false,
  loadingMore = false,
  hasMore = false,
  remaining = 0,
  onLoadMore,
  bookmarkedIds,
  onToggleBookmark,
}) => {
  // When the whole result set fit in the Featured row there is no "latest" to
  // continue with, so the section is not rendered at all rather than left as a
  // heading over an empty column.
  if (!loading && posts.length === 0) return null;

  return (
    <section className="ink-explore-section" aria-label="Latest stories">
      <header className="ink-explore-section-head">
        <InkSectionHead
          eyebrow="Latest"
          title={
            <>
              Fresh from the <InkHighlight>desk.</InkHighlight>
            </>
          }
          subtitle="The newest stories first — keep going for more."
        />
      </header>

      {loading ? (
        <StoryGridSkeleton count={3} />
      ) : (
        <>
          <StoryGrid posts={posts} bookmarkedIds={bookmarkedIds} onToggleBookmark={onToggleBookmark} />

          <Box className="ink-explore-more">
            {hasMore ? (
              <InkGhostButton
                onClick={onLoadMore}
                disabled={loadingMore}
                endIcon={<ExpandMoreRounded sx={{ fontSize: 20 }} />}
              >
                {loadingMore ? "Loading…" : remaining > 0 ? `Load ${remaining} more` : "Load more"}
              </InkGhostButton>
            ) : (
              <p className="ink-explore-tail">You&apos;ve reached the end of the feed.</p>
            )}
          </Box>
        </>
      )}
    </section>
  );
};

export default LatestStories;
