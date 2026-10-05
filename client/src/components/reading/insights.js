/* ─────────────────────────────────────────────────────────────────────
   Reading History — pure derivations.

   Everything the page shows beyond the raw article list — the streak, the
   30-day heatmap, the topic bars, the "read on" labels — is shaped here
   from the server's `summary` payload. The server does the aggregation
   over the reader's WHOLE history (see getReadingHistorySummary); this
   module only turns those figures into something renderable.

   Nothing in this file invents a number. Every function either passes real
   data through or derives from it arithmetically, and each returns an
   empty/degenerate result — never a plausible-looking placeholder — when
   there is no data to work from.

   Days are UTC throughout, matching the server aggregation and the
   writing-streak ledger, so "today" means the same thing in both streaks.
   ───────────────────────────────────────────────────────────────────── */

export const DAY_MS = 86400000;

const pad = (n) => String(n).padStart(2, "0");

/* A UTC "YYYY-MM-DD" key — the exact format the server groups by. */
export const dayKey = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

/* The key for the day `offset` days away from `now` (negative = past). */
export const dayKeyFrom = (now, offset) =>
  dayKey(new Date(new Date(now).getTime() + offset * DAY_MS));

const msOf = (key) => new Date(`${key}T00:00:00.000Z`).getTime();

/* ── Reading streak ───────────────────────────────────────────────────
   `days` is the ascending list of UTC days on which the reader read
   something (first open OR a return visit), as the server returns them.

   The current run counts back from today; when today is still unread it
   counts back from yesterday instead, because a day can only break a
   streak once it has actually passed. Longest is the longest run anywhere
   in the history. Both are derived, never estimated. */
export const readingStreak = (days = [], now = Date.now()) => {
  const set = new Set(days);
  const today = dayKeyFrom(now, 0);
  const yesterday = dayKeyFrom(now, -1);

  let longest = 0;
  let run = 0;
  let prev = null;
  for (const day of days) {
    run = prev && Number.isFinite(msOf(prev)) && msOf(day) - msOf(prev) === DAY_MS ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = day;
  }

  let current = 0;
  if (set.has(today) || set.has(yesterday)) {
    let cursor = set.has(today) ? 0 : -1;
    while (set.has(dayKeyFrom(now, cursor))) {
      current += 1;
      cursor -= 1;
    }
  }

  return { current, longest, readToday: set.has(today), daysRead: set.size };
};

/* ── 30-day activity heatmap ──────────────────────────────────────────
   `heat` is [{ day, count }] from the server. Returns a flat cell list
   padded to whole weeks (Sunday-first) so the CSS grid reads as weeks:
   leading nulls align the first day under its weekday, and trailing nulls
   square off the last row.

   `level` is 0–4 for the shade ramp, scaled against the busiest day in
   the window — so the ramp always uses its full range no matter how much
   or how little the reader reads. */
export const heatmapCells = (heat = [], now = Date.now(), span = 30) => {
  const counts = new Map(heat.map((h) => [h.day, h.count]));
  const startMs = new Date(now).getTime() - (span - 1) * DAY_MS;

  const cells = [];
  const lead = new Date(startMs).getUTCDay(); // 0 = Sunday
  for (let i = 0; i < lead; i += 1) cells.push(null);
  for (let i = 0; i < span; i += 1) {
    const key = dayKeyFrom(now, -(span - 1) + i);
    cells.push({ key, ms: startMs + i * DAY_MS, count: counts.get(key) || 0 });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const max = Math.max(1, ...cells.filter(Boolean).map((c) => c.count));
  return cells.map((c) => (c ? { ...c, level: heatLevel(c.count, max) } : null));
};

const heatLevel = (count, max) => {
  if (!count) return 0;
  if (max <= 1) return 4;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
};

/* Total reads inside the heatmap window — a real figure for the card's
   subline, summed from the same counts the grid draws. */
export const heatTotal = (heat = []) => heat.reduce((sum, h) => sum + (h.count || 0), 0);

/* ── Topics / writers ─────────────────────────────────────────────────
   Ranks the server's real counts and gives each a 0–100 bar width
   relative to the top entry, so the leader always fills the rail. */
export const ranked = (list = [], take = 5) => {
  const top = list.slice(0, take);
  const max = Math.max(1, ...top.map((t) => t.count));
  return top.map((t) => ({ ...t, pct: Math.round((t.count / max) * 100) }));
};

/* ── Per-article presentation ─────────────────────────────────────────
   Turns the stored furthest-point-reached into the card's footer state.
   A stored 0 is a real state — "opened but never scrolled into the body"
   — and is deliberately NOT drawn as a 0% bar; it reads as a plain
   "Read" action instead, which is what actually happened. */
export const progressState = (progress) => {
  const pct = Math.max(0, Math.min(100, Math.round(Number(progress) || 0)));
  if (pct >= 100) return { pct, state: "finished", label: "Finished", cta: "Read again" };
  if (pct > 0) return { pct, state: "reading", label: `${pct}% read`, cta: "Continue reading" };
  return { pct: 0, state: "unread", label: "", cta: "Read" };
};

/* "Today" / "Yesterday" / "4 days ago" / "Sep 12" — a recency reading for
   a date the reader actually has, so a card never says "0 days ago". */
export const relativeDay = (value, now = Date.now()) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  const then = new Date(d);
  then.setUTCHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - then.getTime()) / DAY_MS);

  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 28) {
    const weeks = Math.floor(diff / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

/* A stable absolute date, for the streak card's "reading since" line. */
export const absoluteDay = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

/* The heatmap cell label, spelled out for the tooltip and aria-label —
   shade is never the only signal for how much was read. */
export const heatLabel = (cell, now = Date.now()) => {
  if (!cell) return "";
  const when =
    cell.key === dayKeyFrom(now, 0)
      ? "Today"
      : cell.key === dayKeyFrom(now, -1)
      ? "Yesterday"
      : new Date(cell.ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (!cell.count) return `${when} — nothing read`;
  return `${when} — ${cell.count} article${cell.count === 1 ? "" : "s"}`;
};
