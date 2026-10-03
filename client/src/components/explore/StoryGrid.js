import React from "react";
import { motion } from "framer-motion";
import InkStoryCard from "../ink/InkStoryCard";
import SkeletonBlogCard from "../SkeletonBlogCard";

/* ─────────────────────────────────────────────────────────────────────
   InkWell Explore — the story grid.

   One grid for both the Featured row and the Latest list, so the two are the
   same object at different sizes rather than two grids that drift. Cards are
   the shared `InkStoryCard`; the skeleton is the existing `SkeletonBlogCard`
   in its `ink` mode, which draws from the dark tokens instead of flashing a
   white panel mid-load.

   `mediaSx` is handed to the skeleton so its cover box matches the height the
   grid gives the real cards — without it the placeholder is visibly shorter
   than the card that replaces it, and the whole column jumps on load.
   ───────────────────────────────────────────────────────────────────── */

// Matches `.ink-explore-grid .ink-story-media` in Explore.css.
const SKELETON_MEDIA_SX = { height: "clamp(196px, 16vw, 220px)", aspectRatio: "auto" };

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

export const StoryGrid = ({ posts = [], bookmarkedIds = [], onToggleBookmark, className = "" }) => (
  <motion.div
    className={`ink-explore-grid ${className}`.trim()}
    variants={gridVariants}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.05 }}
  >
    {posts.map((post, i) => (
      <InkStoryCard
        key={post.id}
        post={post}
        index={i}
        bookmarked={bookmarkedIds.includes(post.id)}
        onToggleBookmark={onToggleBookmark}
      />
    ))}
  </motion.div>
);

export const StoryGridSkeleton = ({ count = 3 }) => (
  <div className="ink-explore-grid" aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonBlogCard key={i} ink mediaSx={SKELETON_MEDIA_SX} />
    ))}
  </div>
);

export default StoryGrid;
