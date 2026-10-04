import React, { useMemo } from "react";
import { Box } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import InkStoryCard from "./ink/InkStoryCard";
import SkeletonBlogCard from "./SkeletonBlogCard";
import { InkGhostButton, InkSectionHead, InkHighlight } from "./ink";
import { toStoryCard } from "../utils/blogCard";

/* ─────────────────────────────────────────────────────────────────────
   InkWell — "Fresh Ink" story grid (Home only).

   Three states, in priority order: loading skeletons → error + retry →
   the real feed, and an honest empty state when the feed has no posts.

   There used to be a fourth: a frontend-only set of demo stories with
   fabricated like/comment counts, shown when the feed was empty. It is
   gone. InkWell does not render an engagement figure it cannot back with
   real data, so an empty platform says so rather than dressing itself in
   invented numbers. The card below renders counts only when the listing
   endpoints supply genuinely counted ones.
   ───────────────────────────────────────────────────────────────────── */

const POST_COUNT = 6;

const CommunitySection = ({
  blogs = [],
  loading = false,
  error = false,
  onRetry,
  bookmarkedIds = [],
  onToggleBookmark,
}) => {
  const hasBlogs = blogs.length > 0;
  const cards = useMemo(() => blogs.map((b) => toStoryCard(b)), [blogs]);

  const renderGrid = (items, key) => (
    <motion.div
      key={key}
      className="ink-stories-grid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {items.map((card, i) => (
        <InkStoryCard
          key={card.id}
          post={card}
          index={i}
          bookmarked={bookmarkedIds.includes(card.id)}
          onToggleBookmark={onToggleBookmark}
        />
      ))}
    </motion.div>
  );

  const renderSkeletons = (key) => (
    <motion.div
      key={key}
      className="ink-stories-grid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {Array.from({ length: POST_COUNT }).map((_, i) => (
        <SkeletonBlogCard key={i} ink />
      ))}
    </motion.div>
  );

  return (
    <Box component="section" className="ink-stories" aria-label="Featured stories">
      <div className="ink-home-section">
        <div className="ink-stories-head">
          <InkSectionHead
            eyebrow="Fresh Ink"
            title={
              <>
                Stories worth <InkHighlight>your time.</InkHighlight>
              </>
            }
            subtitle="The latest from the InkWell community."
          />

          {!loading && !error && hasBlogs && (
            <Link to="/explore" className="ink-stories-viewall">
              View all
              <ArrowForwardRounded sx={{ fontSize: 17 }} />
            </Link>
          )}
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            renderSkeletons("skeletons")
          ) : error ? (
            <motion.div
              key="error"
              className="ink-stories-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p style={{ marginBottom: "1.25rem", color: "var(--ink-text-2)" }}>
                We couldn&apos;t load the latest stories. Please try again.
              </p>
              <InkGhostButton onClick={onRetry}>Retry</InkGhostButton>
            </motion.div>
          ) : hasBlogs ? (
            renderGrid(cards, "real")
          ) : (
            <motion.div
              key="empty"
              className="ink-stories-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p style={{ marginBottom: "1.25rem", color: "var(--ink-text-2)" }}>
                No stories have been published yet. Be the first — your words will appear here.
              </p>
              <InkGhostButton onClick={onRetry}>Refresh</InkGhostButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Box>
  );
};

export default CommunitySection;
