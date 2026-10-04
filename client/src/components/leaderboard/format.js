/* Number formatting shared by the leaderboard boards.

   Two rules:
     • Counts are abbreviated only on screen — the exact figure is always
       carried in the element's `title`, so nothing is lost.
     • Nothing here invents or rounds a figure that was not supplied. A
       missing metric is `undefined` and the caller omits the cell; it never
       becomes a 0 the database did not report. */

const abbreviate = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
};

// Returns null for anything that is not a real number, so callers can drop
// the cell rather than print a placeholder.
export const formatCount = (value) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return abbreviate(value);
};

// The exact value for a `title` tooltip. Empty string when there is nothing
// real to show.
export const exactCount = (value) =>
  typeof value === "number" && Number.isFinite(value) ? value.toLocaleString() : "";
