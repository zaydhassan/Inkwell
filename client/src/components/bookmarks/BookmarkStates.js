import React from "react";
import { Link } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { InkPrimaryButton } from "../ink/InkButton";

/* ─────────────────────────────────────────────────────────────────────
   Bookmarks — the four non-happy paths.

   Skeletons mirror the real layout (hero, filter bar, cards, rail) so the
   page doesn't reflow when data lands. The empty and no-match states are
   kept separate on purpose: "you haven't saved anything yet" is a
   different problem from "nothing matches this filter", and offering a
   "browse stories" link to someone who simply mistyped a search would be
   the wrong answer.

   The copy is this page's own — a reading history is something that
   happened to you, a reading list is something you chose, and the wording
   should not be interchangeable between them.
   ───────────────────────────────────────────────────────────────────── */

/* One shimmering block. The shimmer is disabled under
   prefers-reduced-motion in Bookmarks.css. */
const Shimmer = ({ h = 16, w = "100%", r = 8, sx }) => (
  <Box className="ink-bm-shimmer" sx={{ height: h, width: w, borderRadius: r, ...sx }} />
);

export const HeroSkeleton = () => (
  <Box className="ink-bm-hero is-loading" aria-hidden="true">
    <Box className="ink-bm-hero-copy">
      <Shimmer h={14} w={200} />
      <Shimmer h={54} w="78%" r={12} sx={{ mt: 2.5 }} />
      <Shimmer h={16} w="90%" sx={{ mt: 3 }} />
      <Shimmer h={16} w="62%" sx={{ mt: 1.25 }} />
    </Box>
    <Box className="ink-bm-hero-art">
      {/* Mirrors the real plate's box so nothing shifts when the
          illustration lands — same 430px cap and same 24px radius. */}
      <Shimmer h={340} w="100%" r={24} sx={{ maxWidth: 430 }} />
    </Box>
  </Box>
);

export const CardSkeleton = () => (
  <Box className="ink-bm-card is-skeleton" aria-hidden="true">
    <Shimmer h={0} r={0} sx={{ aspectRatio: "16 / 9", width: "100%" }} />
    <Box sx={{ p: 2.5 }}>
      <Shimmer h={20} w={130} r={999} />
      <Shimmer h={20} w="92%" sx={{ mt: 2 }} />
      <Shimmer h={20} w="70%" sx={{ mt: 1 }} />
      <Shimmer h={13} w="100%" sx={{ mt: 2 }} />
      <Shimmer h={13} w="84%" sx={{ mt: 1 }} />
      <Shimmer h={26} w="58%" sx={{ mt: 3 }} />
      <Shimmer h={40} w="100%" r={999} sx={{ mt: 2 }} />
    </Box>
  </Box>
);

export const RailSkeleton = () => (
  <Box aria-hidden="true">
    {[176, 206, 224].map((h, i) => (
      // eslint-disable-next-line react/no-array-index-key
      <Shimmer key={i} h={h} r={22} sx={{ mb: 2.5 }} />
    ))}
  </Box>
);

export const GridSkeleton = ({ count = 6 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      // eslint-disable-next-line react/no-array-index-key
      <CardSkeleton key={i} />
    ))}
  </>
);

const StatePanel = ({ icon: Icon, title, body, children }) => (
  <Box className="ink-bm-state" role="status">
    <Box className="ink-bm-state-icon" aria-hidden="true">
      <Icon />
    </Box>
    <Typography component="h2" className="ink-bm-state-title">
      {title}
    </Typography>
    <Typography className="ink-bm-state-text">{body}</Typography>
    {children}
  </Box>
);

/* Nothing saved at all — the reader has never bookmarked a story. */
export const EmptyState = () => (
  <StatePanel
    icon={BookmarkBorderIcon}
    title="Your reading list is empty."
    body="Tap the bookmark on any story to keep it here — a shelf of your own, ready whenever you have a spare moment."
  >
    <InkPrimaryButton as={Link} to="/blogs" sx={{ mt: 3 }}>
      Explore stories <span aria-hidden="true">→</span>
    </InkPrimaryButton>
  </StatePanel>
);

/* Saved articles exist, but nothing matched what is currently applied. */
export const NoMatchState = ({ onReset, filtered }) => (
  <StatePanel
    icon={SearchOffIcon}
    title={filtered ? "Nothing saved under this view." : "No saved articles match that search."}
    body={
      filtered
        ? "There's nothing in your library under this filter yet. Try another tab, or clear it to see everything you've saved."
        : "Try a different word, or clear the search to see your full reading list."
    }
  >
    <InkPrimaryButton onClick={onReset} sx={{ mt: 3 }}>
      {filtered ? "Clear filter" : "Clear search"}
    </InkPrimaryButton>
  </StatePanel>
);

export const ErrorState = ({ onRetry }) => (
  <StatePanel
    icon={ErrorOutlineIcon}
    title="Couldn't load your reading list."
    body="Something went wrong on the way to the server. Your saved articles are safe — this is only the fetch that failed."
  >
    <InkPrimaryButton onClick={onRetry} sx={{ mt: 3 }}>
      Try again
    </InkPrimaryButton>
  </StatePanel>
);

/* The rail's own small failure, so a summary outage doesn't take the list
   down with it. */
export const RailNote = () => (
  <Box className="ink-bm-railnote">
    <Typography className="ink-bm-railnote-title">Your library stats aren’t available right now.</Typography>
    <Typography className="ink-bm-railnote-text">
      The articles you’ve saved are still listed here — only the summary failed to load.
    </Typography>
  </Box>
);
