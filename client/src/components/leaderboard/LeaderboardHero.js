import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import PodiumVisual from "./PodiumVisual";

/* ─────────────────────────────────────────────────────────────────────
   The leaderboard's hero: the pitch on the left, the trophy stage on the
   right, and the two controls that drive the board underneath.

   The filters are real buttons in a labelled group with `aria-pressed`,
   not a MUI Tabs strip: there is no tabpanel here (the whole page below
   re-renders), so "tab" semantics would be a lie, while a grouped set of
   toggle buttons is exactly what this is and stays keyboard-operable and
   announced correctly.

   Both controls keep the behaviour the page already had — Writers/Readers
   switches the rendered list without a refetch, the time filter refetches
   the window from the API.
   ───────────────────────────────────────────────────────────────────── */

const PERIODS = [
  { key: "all", label: "All Time" },
  { key: "month", label: "This Month" },
  { key: "week", label: "This Week" },
];

const GROUPS = [
  { key: "writers", label: "Writers" },
  { key: "readers", label: "Readers" },
];

const Segmented = ({ label, options, value, onChange, alt = false }) => (
  <div
    className={`ink-lb-seg${alt ? " ink-lb-seg--alt" : ""}`}
    role="group"
    aria-label={label}
  >
    {options.map((option) => (
      <button
        key={option.key}
        type="button"
        className="ink-lb-seg-btn"
        aria-pressed={value === option.key}
        onClick={() => onChange(option.key)}
      >
        {option.label}
      </button>
    ))}
  </div>
);

const LeaderboardHero = ({
  period,
  onPeriodChange,
  group,
  onGroupChange,
  rows = [],
  loading = false,
  failed = false,
}) => {
  const reduce = useReducedMotion();

  return (
    <section className="ink-lb-hero" aria-labelledby="ink-lb-title">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="ink-lb-eyebrow">
          <span aria-hidden="true">🏆</span> Community standouts
        </span>

        <h1 className="ink-lb-title" id="ink-lb-title">
          The InkWell <span className="ink-lb-hl">Leaderboard</span>
        </h1>

        <p className="ink-lb-lede">
          Celebrating the creators and readers who make InkWell thrive — all-time, or the last 30 / 7
          days.
        </p>

        <div className="ink-lb-controls">
          <Segmented label="Time range" options={PERIODS} value={period} onChange={onPeriodChange} />
          <Segmented label="Board" options={GROUPS} value={group} onChange={onGroupChange} alt />
        </div>
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      >
        {/* A failed load must not leave a podium of invented people standing
            under the trophy — it drops to the decorative circles instead. */}
        <PodiumVisual rows={failed ? [] : rows} loading={loading && !failed} />
      </motion.div>
    </section>
  );
};

export default LeaderboardHero;
