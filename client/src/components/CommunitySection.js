import React, { useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import InkStoryCard from "./ink/InkStoryCard";
import SkeletonBlogCard from "./SkeletonBlogCard";
import { InkGhostButton, InkSectionHead, InkHighlight } from "./ink";
import generatePlaceholderPosts from "../data/placeholderPosts";
import { initialsOf, toStoryCard } from "../utils/blogCard";

/* ─────────────────────────────────────────────────────────────────────
   InkWell — "Fresh Ink" story grid (Home only).

   Four states, in priority order: loading skeletons → error + retry →
   the real feed → frontend-only demo stories when the feed is genuinely
   empty. The demo stories are generated in the browser and are never
   persisted; when real posts exist they replace the demo set entirely.

   The old build had TWO card components (real vs placeholder) that had
   drifted apart visually. Both states now render the same `InkStoryCard`,
   which is also what enforces the data-honesty rule: reading time, likes
   and comments only ever appear on a card flagged `isDemo`.
   ───────────────────────────────────────────────────────────────────── */

const POST_COUNT = 6;

/* Demo post → card props. These figures are fabricated by design (see
   data/placeholderPosts.js) and are only ever rendered on `isDemo` cards.
   Real posts go through the shared `toStoryCard` mapper, so Home and Explore
   render an identical card for the same post. */
const toDemoCard = (post) => ({
  id: post.id,
  title: post.title,
  excerpt: post.description,
  image: post.image,
  category: post.category,
  author: post.author,
  initials: initialsOf(post.author),
  avatarGradient: post.avatarGradient,
  date: post.date,
  readingTime: post.readingTime,
  likes: post.likes,
  comments: post.comments,
  trending: post.trending,
  isDemo: true,
});

const CommunitySection = ({
  blogs = [],
  loading = false,
  error = false,
  onRetry,
  bookmarkedIds = [],
  onToggleBookmark,
}) => {
  // Randomize the demo set once per mount.
  const placeholders = useMemo(() => generatePlaceholderPosts(POST_COUNT), []);

  // When the feed loads empty, hold skeletons for ~1s then crossfade into
  // the demo stories, so the grid reads as "loading", not "broken".
  const [showPlaceholders, setShowPlaceholders] = useState(false);

  useEffect(() => {
    if (loading || blogs.length > 0 || error) {
      setShowPlaceholders(false);
      return undefined;
    }
    const t = setTimeout(() => setShowPlaceholders(true), 1000);
    return () => clearTimeout(t);
  }, [loading, blogs.length, error]);

  const hasBlogs = blogs.length > 0;
  const cards = useMemo(() => blogs.map((b) => toStoryCard(b)), [blogs]);
  const demoCards = useMemo(() => placeholders.map(toDemoCard), [placeholders]);

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
            subtitle="Hand-picked stories from the InkWell community."
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
          ) : showPlaceholders ? (
            renderGrid(demoCards, "demo")
          ) : (
            renderSkeletons("empty-skeletons")
          )}
        </AnimatePresence>
      </div>
    </Box>
  );
};

export default CommunitySection;
