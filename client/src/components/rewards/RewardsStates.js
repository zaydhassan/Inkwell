import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { EASE, InkPrimaryButton, Reveal } from "../ink";

/* ─────────────────────────────────────────────────────────────────────
   The Rewards page's three non-happy states.

   Loading and error both keep the page's real geometry — the balance card,
   two reward rows, the earning strip — so the section does not jump when
   the data lands. The error card prints the message the brief specifies and
   nothing else: whatever the API said (a status code, a stack, a network
   string) stays out of the UI, and `onRetry` re-runs the same fetch rather
   than inventing a fallback list.
   ───────────────────────────────────────────────────────────────────── */

/* A shimmering placeholder block. `w`/`h` are CSS lengths. */
const Bar = ({ w = "100%", h = 14, className = "" }) => (
  <span className={`ink-rw-skel ${className}`.trim()} style={{ width: w, height: h }} aria-hidden="true" />
);

/* Shown while `GET /api/v1/rewards` is in flight. Mirrors the real layout so
   nothing shifts when the rows arrive. The balance card is deliberately not
   part of this — the page always renders the real `PointsSummary` (which
   carries its own figure skeleton), because points come from the session and
   not from this request. */
export const RewardsSkeleton = () => {
  return (
    <div className="ink-rw-skel-wrap" aria-busy="true" aria-live="polite">
      <span className="ink-rw-sr-only">Loading rewards…</span>

      {/* Two reward rows. */}
      {[0, 1].map((i) => (
        <div className="ink-rw-row ink-rw-row-skel" key={i}>
          <span className="ink-rw-skel ink-rw-skel-tile" aria-hidden="true" />
          <div className="ink-rw-row-body">
            <Bar w={`${46 - i * 8}%`} h={20} />
            <Bar w={`${78 - i * 10}%`} h={12} />
            <Bar w="92px" h={12} />
          </div>
          <div className="ink-rw-row-action">
            <Bar w="168px" h={48} className="ink-rw-skel-btn" />
          </div>
        </div>
      ))}

      {/* Earning strip. */}
      <div className="ink-rw-skel-earn">
        {[0, 1, 2, 3].map((i) => (
          <div className="ink-rw-earn-item" key={i}>
            <span className="ink-rw-skel ink-rw-skel-dot" aria-hidden="true" />
            <Bar w="112px" h={13} />
            <Bar w="72px" h={11} />
          </div>
        ))}
      </div>
    </div>
  );
};

/* Shown when the reward fetch fails. Nothing from the thrown error is
   rendered — a retry is the only useful affordance. */
export const RewardsError = ({ onRetry }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="ink-rw-error"
      role="alert"
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <span className="ink-rw-error-glyph" aria-hidden="true">
        <svg width="46" height="46" viewBox="0 0 48 48" focusable="false">
          <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,106,0,0.34)" strokeWidth="1.6" />
          <circle cx="24" cy="24" r="20" fill="rgba(255,106,0,0.06)" />
          <path d="M24 13.5v14" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
          <circle cx="24" cy="34" r="2.1" fill="#F59E0B" />
        </svg>
      </span>

      <h2 className="ink-rw-error-title">Unable to load rewards.</h2>
      <p className="ink-rw-error-text">
        This is usually temporary — your points are safe and nothing has been spent.
      </p>

      {onRetry ? (
        <InkPrimaryButton onClick={onRetry} startIcon={<RefreshRoundedIcon />}>
          Try again
        </InkPrimaryButton>
      ) : null}
    </motion.div>
  );
};

/* The catalog answered, and it is empty. A real state — not an error, and
   not something to pad with made-up rewards. */
export const RewardsEmpty = () => (
  <Reveal>
    <div className="ink-rw-empty">
      <h2 className="ink-rw-empty-title">No rewards available yet</h2>
      <p className="ink-rw-empty-text">
        New perks are added as the program grows. Keep earning — your points carry over.
      </p>
    </div>
  </Reveal>
);
