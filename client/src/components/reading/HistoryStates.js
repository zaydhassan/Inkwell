import React from "react";
import { Box, Typography } from "@mui/material";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { InkPrimaryButton } from "../ink/InkButton";
import { Link } from "react-router-dom";

/* ─────────────────────────────────────────────────────────────────────
   Reading History — the four non-happy paths.

   Skeletons mirror the real layout (hero, stats, filter bar, cards, rail)
   so the page doesn't reflow when data lands. The empty and no-match
   states are kept separate on purpose: "you haven't read anything yet" is
   a different problem from "nothing matches this filter", and offering a
   "browse articles" link to someone who simply mistyped a search would be
   the wrong answer.
   ───────────────────────────────────────────────────────────────────── */

/* One shimmering block. The shimmer is disabled under
   prefers-reduced-motion in ReadingHistory.css. */
const Shimmer = ({ h = 16, w = "100%", r = 8, sx }) => (
  <Box className="ink-rh-shimmer" sx={{ height: h, width: w, borderRadius: r, ...sx }} />
);

export const HeroSkeleton = () => (
  <Box className="ink-rh-hero is-loading" aria-hidden="true">
    <Box className="ink-rh-hero-copy">
      <Shimmer h={14} w={190} />
      <Shimmer h={54} w="78%" r={12} sx={{ mt: 2.5 }} />
      <Shimmer h={16} w="90%" sx={{ mt: 3 }} />
      <Shimmer h={16} w="62%" sx={{ mt: 1.25 }} />
    </Box>
    <Box className="ink-rh-hero-art">
      <Shimmer h={260} r={26} />
    </Box>
  </Box>
);

export const CardSkeleton = () => (
  <Box className="ink-rh-card is-skeleton" aria-hidden="true">
    <Shimmer h={0} r={0} sx={{ aspectRatio: "16 / 9", width: "100%" }} />
    <Box sx={{ p: 2.5 }}>
      <Shimmer h={20} w={120} r={999} />
      <Shimmer h={20} w="92%" sx={{ mt: 2 }} />
      <Shimmer h={20} w="70%" sx={{ mt: 1 }} />
      <Shimmer h={13} w="100%" sx={{ mt: 2 }} />
      <Shimmer h={13} w="84%" sx={{ mt: 1 }} />
      <Shimmer h={30} w="60%" r={999} sx={{ mt: 3 }} />
    </Box>
  </Box>
);

export const RailSkeleton = () => (
  <Box aria-hidden="true">
    {[168, 210, 186].map((h, i) => (
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
  <Box className="ink-rh-state" role="status">
    <Box className="ink-rh-state-icon" aria-hidden="true">
      <Icon />
    </Box>
    <Typography component="h2" className="ink-rh-state-title">
      {title}
    </Typography>
    <Typography className="ink-rh-state-text">{body}</Typography>
    {children}
  </Box>
);

/* No history at all — the reader has never opened an article. */
export const EmptyState = () => (
  <StatePanel
    icon={MenuBookOutlinedIcon}
    title="Your reading journey starts here."
    body="Every article you open is saved to your history, with how far you got — so you can always pick up where you left off."
  >
    <InkPrimaryButton as={Link} to="/blogs" sx={{ mt: 3 }}>
      Browse articles
    </InkPrimaryButton>
  </StatePanel>
);

/* History exists, but nothing matched what is currently applied. */
export const NoMatchState = ({ onReset, filtered }) => (
  <StatePanel
    icon={SearchOffIcon}
    title={filtered ? "Nothing in this view." : "No articles match that search."}
    body={
      filtered
        ? "There's nothing in your history under this filter yet. Try another tab, or clear it to see everything you've read."
        : "Try a different word, or clear the search to see your full history."
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
    title="Couldn't load your reading history."
    body="Something went wrong on the way to the server. Your history is safe — this is only the fetch that failed."
  >
    <InkPrimaryButton onClick={onRetry} sx={{ mt: 3 }}>
      Try again
    </InkPrimaryButton>
  </StatePanel>
);

/* The rail's own small failure, so a summary outage doesn't take the list
   down with it. */
export const RailNote = () => (
  <Box className="ink-rh-railnote">
    <Typography className="ink-rh-railnote-title">Your journey isn’t available right now.</Typography>
    <Typography className="ink-rh-railnote-text">
      The articles you’ve read are still listed here — only the stats failed to load.
    </Typography>
  </Box>
);
