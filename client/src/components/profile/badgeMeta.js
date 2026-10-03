import { AutoStories, WorkspacePremium, Diamond } from "@mui/icons-material";

/* ─────────────────────────────────────────────────────────────────────
   Badge metadata for the Profile achievements shelf.

   ⚠️ SOURCE OF TRUTH: `server/utils/points.js` → `BADGE_THRESHOLDS`. The
   server derives a writer's badges by filtering that array against their
   points, so this file may not invent a badge or disagree about a threshold
   without the server changing first. If a threshold moves there, move it here
   in the same change.

   Because badges are a pure function of points, earned-vs-locked is
   deterministic — no extra request, no name-mapping guess. That is also why
   the shelf always renders all three tiles: a locked badge reads as a goal,
   whereas a missing one reads as a broken page.

   `Icon` is a component reference. This module never renders it; the shelf
   does, so keep the file free of layout concerns.
   ───────────────────────────────────────────────────────────────────── */

export const BADGE_META = [
  {
    name: "Engaged Reader",
    min: 500,
    Icon: AutoStories,
    blurb: "Reading widely and responding across the community.",
  },
  {
    name: "Top Contributor",
    min: 1000,
    Icon: WorkspacePremium,
    blurb: "A regular, dependable voice in the conversation.",
  },
  {
    name: "Elite Writer",
    min: 5000,
    Icon: Diamond,
    blurb: "A body of published work that consistently lands.",
  },
];

/* Render order, fixed here rather than taken from the API — the shelf must
   not reshuffle because a badge array came back in a different order.
   Ascending `min`, which `nextBadge` below relies on. */
export const BADGE_ORDER = BADGE_META.map((b) => b.name);

/* Earned state for one badge, decided exactly as the server decides it
   (points >= min). `pointsLeft` drives the locked tile's "N pts to go" and is
   0 once earned, so it is safe to render unconditionally. */
export const badgeState = (name, badges, points = 0) => {
  const meta = BADGE_META.find((b) => b.name === name);
  const earned = Array.isArray(badges) && badges.includes(name);
  const min = meta?.min ?? 0;
  return {
    name,
    min,
    earned,
    pointsLeft: earned ? 0 : Math.max(0, min - (Number(points) || 0)),
  };
};

/* How many of the three are earned — the shelf's eyebrow ("2 OF 3 EARNED")
   counts against BADGE_ORDER rather than the API array, so an unexpected or
   duplicate name can't push the count past 3. */
export const earnedCount = (badges) =>
  BADGE_ORDER.filter((name) => Array.isArray(badges) && badges.includes(name)).length;

/* The cheapest badge still unearned — the hero's way out of a dead end. The
   level ladder tops out at 3000 ("Master Storyteller") while Elite Writer
   sits at 5000, so a max-level writer can still have a badge to chase; the
   hero shows this instead of a bare "max level". Null once all are earned. */
export const nextBadge = (points = 0) =>
  BADGE_META.find((b) => (Number(points) || 0) < b.min) || null;
