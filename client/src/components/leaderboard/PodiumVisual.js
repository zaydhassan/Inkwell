import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import UserAvatar from "../UserAvatar";

/* ─────────────────────────────────────────────────────────────────────
   The hero's trophy stage.

   Composition: soft ambient glow → two curved orange light trails → a gold
   trophy → three podium plinths (2 · 1 · 3, the winner's block taller).

   Data honesty:
     • The trophy, the trails and the glow are pure decoration — vector
       shapes drawn here, no image file and no invented content.
     • The three plinths carry the REAL top three of whichever board is
       active, straight from the leaderboard API.
     • With no data (a brand-new platform, or a load failure) the plinths
       fall back to abstract dashed circles. They are never populated with
       made-up people.

   The whole stage is marked decorative for assistive tech: the board table
   below lists the same people, with real numbers and row semantics, and
   duplicating every name here would only make that harder to navigate.
   ───────────────────────────────────────────────────────────────────── */

const MEDAL = { 1: "#F5A623", 2: "#9EA7B3", 3: "#B0804F" };
const PLACE = { 1: "Champion", 2: "Runner-up", 3: "Third" };
const AVATAR_SIZE = { 1: 62, 2: 50, 3: 44 };

/* The trophy. A flat-vector cup on a gold gradient with a star cut out of
   the bowl — warm and restrained, not a metallic render. */
const Trophy = () => (
  <svg width="112" height="116" viewBox="0 0 120 124" role="presentation" focusable="false">
    <defs>
      <linearGradient id="lb-trophy-gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFD08A" />
        <stop offset="46%" stopColor="#F5A623" />
        <stop offset="100%" stopColor="#C2760F" />
      </linearGradient>
      <radialGradient id="lb-trophy-glow" cx="50%" cy="42%" r="58%">
        <stop offset="0%" stopColor="rgba(245,166,35,0.34)" />
        <stop offset="100%" stopColor="rgba(245,166,35,0)" />
      </radialGradient>
    </defs>

    <circle cx="60" cy="52" r="48" fill="url(#lb-trophy-glow)" />

    {/* Bowl. */}
    <path d="M34 22h52v20c0 15.5-11.6 28-26 28S34 57.5 34 42z" fill="url(#lb-trophy-gold)" />
    {/* Handles. */}
    <path
      d="M34 27H25a11 11 0 0 0 0 22h5.4"
      fill="none"
      stroke="url(#lb-trophy-gold)"
      strokeWidth="5"
      strokeLinecap="round"
    />
    <path
      d="M86 27h9a11 11 0 0 1 0 22h-5.4"
      fill="none"
      stroke="url(#lb-trophy-gold)"
      strokeWidth="5"
      strokeLinecap="round"
    />
    {/* Stem and base. */}
    <path d="M55 70h10v10H55z" fill="url(#lb-trophy-gold)" />
    <path d="M40 104l3-12h34l3 12z" fill="url(#lb-trophy-gold)" />
    {/* Star, stamped into the bowl. */}
    <path
      d="M60 27l3.23 8.55 9.13.43-7.13 5.72 2.41 8.82L60 45.5l-7.64 5.02 2.41-8.82-7.13-5.72 9.13-.43z"
      fill="#1D1A17"
      opacity="0.5"
    />
  </svg>
);

/* Two arcs sweeping behind the trophy — the spec's "subtle curved orange
   light trails". Stretched to the stage, never interactive. */
const Trails = () => (
  <svg
    className="ink-lb-trails"
    viewBox="0 0 600 260"
    preserveAspectRatio="none"
    role="presentation"
    focusable="false"
  >
    <path
      d="M10 250C120 250 140 74 300 74s180 176 290 176"
      fill="none"
      stroke="rgba(255,106,0,0.24)"
      strokeWidth="1.5"
    />
    <path
      d="M60 262C160 262 190 118 300 118s140 144 240 144"
      fill="none"
      stroke="rgba(255,106,0,0.13)"
      strokeWidth="1.5"
    />
  </svg>
);

const PodiumVisual = ({ rows = [], loading = false }) => {
  const reduce = useReducedMotion();
  const top3 = rows.slice(0, 3);
  // A real podium is read 2 · 1 · 3. With fewer than three entries fall back
  // to natural order so a lone leader still sits under the trophy.
  const order = top3.length === 3 ? [1, 0, 2] : top3.map((_, i) => i);

  const renderPlinth = (rank, position, entry) => (
    <motion.div
      key={entry?._id || rank}
      className="ink-lb-plinth"
      data-rank={rank}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.12 + position * 0.09 }}
    >
      <div className="ink-lb-plinth-avatar">
        {entry ? (
          <UserAvatar
            src={entry.profile_image}
            name={entry.username}
            alt=""
            sx={{
              width: AVATAR_SIZE[rank],
              height: AVATAR_SIZE[rank],
              fontSize: AVATAR_SIZE[rank] * 0.34,
              border: `2px solid ${MEDAL[rank]}`,
            }}
          />
        ) : (
          <div
            className="ink-lb-deco-circle"
            style={{ width: AVATAR_SIZE[rank], height: AVATAR_SIZE[rank] }}
          />
        )}
        <span className="ink-lb-plinth-medal">{rank}</span>
      </div>

      {entry && (
        <>
          <span className="ink-lb-plinth-name">{entry.username}</span>
          <span className="ink-lb-plinth-pts">{entry.points} pts</span>
        </>
      )}

      <div className="ink-lb-plinth-block">{PLACE[rank]}</div>
    </motion.div>
  );

  return (
    <div className="ink-lb-stage" aria-hidden="true">
      <Trails />

      <div className="ink-lb-trophy">
        <Trophy />
      </div>

      <div className="ink-lb-podium">
        {loading
          ? [2, 1, 3].map((rank, position) => (
              <div key={rank} className="ink-lb-plinth" data-rank={rank}>
                <div className="ink-lb-plinth-avatar">
                  <div
                    className="ink-lb-skel"
                    style={{
                      width: AVATAR_SIZE[rank],
                      height: AVATAR_SIZE[rank],
                      borderRadius: "50%",
                      animationDelay: `${position * 0.15}s`,
                    }}
                  />
                </div>
                <div className="ink-lb-skel" style={{ width: 62, height: 12, marginBottom: 6 }} />
                <div className="ink-lb-plinth-block" />
              </div>
            ))
          : order.length > 0
            ? order.map((rowIndex, position) => renderPlinth(rowIndex + 1, position, top3[rowIndex]))
            : [2, 1, 3].map((rank, position) => renderPlinth(rank, position, null))}
      </div>
    </div>
  );
};

export default PodiumVisual;
