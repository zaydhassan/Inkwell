import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Box } from "@mui/material";
import { CountUp, EASE } from "../ink";

/* ─────────────────────────────────────────────────────────────────────
   "Your Points" — the balance card under the hero.

   Every figure is real: `points` and `level` are the signed-in user's own
   values, the same ones the Navbar and Profile read, and the same ones a
   redemption rewrites. Nothing here is a placeholder, and signed-out
   visitors are told to sign in rather than shown an invented balance.

   The count-up runs once, on the first render that has a real balance. After
   a redemption the figure updates in place — re-animating from zero every
   time the number changed would make a spend look like a reset, so the
   animated figure is swapped for the plain one the moment the value moves.
   ───────────────────────────────────────────────────────────────────── */

/* A coin with a spark, matching the illustration's gold-on-dark language. */
const CoinGlyph = () => (
  <svg width="34" height="34" viewBox="0 0 40 40" role="presentation" focusable="false">
    <defs>
      <linearGradient id="rw-coin" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stopColor="#FFE3B0" />
        <stop offset="46%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B4740C" />
      </linearGradient>
    </defs>
    <circle cx="20" cy="20" r="15" fill="url(#rw-coin)" />
    <circle cx="20" cy="20" r="15" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.4" />
    <circle cx="20" cy="20" r="10.5" fill="none" stroke="rgba(120,70,5,0.45)" strokeWidth="1.6" />
    <path
      d="M20 12.5l1.9 5.3 5.3 1.9-5.3 1.9-1.9 5.3-1.9-5.3-5.3-1.9 5.3-1.9z"
      fill="#FFF3D6"
      opacity="0.9"
    />
  </svg>
);

const PointsSummary = ({ points = null, level = null, signedIn = false, loading = false }) => {
  const reduce = useReducedMotion();
  // The first real balance of the session — see the note above.
  const firstBalance = useRef(null);
  if (firstBalance.current === null && typeof points === "number") {
    firstBalance.current = points;
  }
  const animateFigure = typeof points === "number" && points === firstBalance.current;

  return (
    <motion.section
      className="ink-rw-points"
      aria-label="Your points"
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
    >
      <div className="ink-rw-points-main">
        <Box className="ink-rw-points-icon" aria-hidden="true">
          <CoinGlyph />
        </Box>

        <div className="ink-rw-points-figure">
          <span className="ink-rw-points-label">
            Your Points
            {level ? <span className="ink-rw-points-level">{level}</span> : null}
          </span>

          {loading ? (
            <span className="ink-rw-skel ink-rw-skel-figure" />
          ) : signedIn && typeof points === "number" ? (
            <span className="ink-rw-points-value">
              {animateFigure ? <CountUp to={points} started duration={1.4} /> : points}
              <span className="ink-rw-points-unit">pts</span>
            </span>
          ) : (
            <span className="ink-rw-points-signedout">
              <Link to="/login?redirect=%2Frewards">Sign in to see your points</Link>
            </span>
          )}
        </div>
      </div>

      <div className="ink-rw-points-note">
        {signedIn ? (
          <>
            <span className="ink-rw-points-note-title">Keep participating</span>
            <p className="ink-rw-points-note-text">
              Write, read, and engage to earn more points and unlock better rewards.
            </p>
          </>
        ) : (
          <>
            <span className="ink-rw-points-note-title">Start earning</span>
            <p className="ink-rw-points-note-text">
              Writing, reading and joining in all earn points toward the rewards below.
            </p>
          </>
        )}
      </div>
    </motion.section>
  );
};

export default PointsSummary;
