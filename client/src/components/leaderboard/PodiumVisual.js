import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import UserAvatar from "../UserAvatar";

/* ─────────────────────────────────────────────────────────────────────
   The hero's trophy stage.

   Composition, front to back: an aurora wash and a field of warm specks
   (both in the stylesheet) → two gradient light trails → a spotlight cone
   → a gold trophy with a specular sheen → three glass podium plinths
   (2 · 1 · 3, the winner's block taller, a light rising off it).

   It is a "modern" stage by construction rather than by decoration: depth
   comes from layered translucent surfaces (glass plinths over an aurora
   plate), light comes from real gradients rather than flat fills, and the
   only motion is slow and physical — the trophy floats, the champion's
   light breathes. Nothing moves fast enough to pull the eye off the board
   underneath.

   Data honesty:
     • The trophy, the trails, the beam, the specks and the glow are pure
       decoration — vector shapes drawn here, no image file and no invented
       content.
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
const RING = {
  1: "rgba(245, 166, 35, 0.18)",
  2: "rgba(158, 167, 179, 0.15)",
  3: "rgba(176, 128, 79, 0.15)",
};
const PLACE = { 1: "Champion", 2: "Runner-up", 3: "Third" };
const AVATAR_SIZE = { 1: 68, 2: 54, 3: 46 };

/* A sparse field of warm specks. Fixed coordinates, so it never twinkles
   into a different picture between renders. */
const SPECK_POINTS = [
  [40, 60, 1.6, 0.5], [96, 32, 1.1, 0.35], [150, 88, 1.8, 0.45], [210, 40, 1, 0.3],
  [268, 72, 2, 0.5], [330, 30, 1.2, 0.35], [388, 96, 1.6, 0.45], [452, 44, 1.1, 0.3],
  [512, 78, 1.9, 0.5], [566, 36, 1.2, 0.35], [70, 150, 1.3, 0.3], [128, 196, 1.7, 0.4],
  [196, 150, 1, 0.28], [256, 210, 1.5, 0.38], [318, 168, 1.1, 0.3], [378, 214, 1.8, 0.42],
  [440, 166, 1.2, 0.3], [500, 206, 1.4, 0.36], [556, 158, 1, 0.28], [24, 240, 1.2, 0.3],
  [96, 286, 1.5, 0.34], [180, 258, 1, 0.26], [300, 290, 1.6, 0.38], [420, 272, 1.1, 0.28],
  [540, 286, 1.4, 0.32],
];

const Specks = () => (
  <svg
    className="ink-lb-specks"
    viewBox="0 0 600 360"
    preserveAspectRatio="xMidYMid slice"
    role="presentation"
    focusable="false"
  >
    {SPECK_POINTS.map(([cx, cy, r, o], i) => (
      <circle key={i} cx={cx} cy={cy} r={r} fill="#FFD8A3" opacity={o} />
    ))}
  </svg>
);

/* The trophy. A glass-gold cup rather than a flat silhouette: a four-stop
   gradient for the metal, a diagonal white sheen laid over the bowl for the
   specular, a lighter rim ellipse for the open mouth, and a dark inset so
   the mouth reads as hollow. The sparkle emblem is stamped twice — a soft
   dark shadow offset down-right, a light one up-left — which is what gives
   it the embossed look without any filter or image. */
const Trophy = () => (
  <svg width="132" height="142" viewBox="0 0 140 150" role="presentation" focusable="false">
    <defs>
      <linearGradient id="lb-cup" x1="0.18" y1="0" x2="0.82" y2="1">
        <stop offset="0%" stopColor="#FFE3B2" />
        <stop offset="34%" stopColor="#F8B845" />
        <stop offset="70%" stopColor="#E08A16" />
        <stop offset="100%" stopColor="#AE5D0B" />
      </linearGradient>
      <linearGradient id="lb-cup-sheen" x1="0" y1="0" x2="0.9" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.72" />
        <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="lb-stem" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F8B845" />
        <stop offset="100%" stopColor="#9E530A" />
      </linearGradient>
      <radialGradient id="lb-halo" cx="50%" cy="46%" r="52%">
        <stop offset="0%" stopColor="rgba(245, 166, 35, 0.42)" />
        <stop offset="58%" stopColor="rgba(245, 166, 35, 0.12)" />
        <stop offset="100%" stopColor="rgba(245, 166, 35, 0)" />
      </radialGradient>
    </defs>

    {/* Halo behind the whole cup. */}
    <circle cx="70" cy="64" r="60" fill="url(#lb-halo)" />

    {/* Handles, drawn behind the bowl so the join is hidden. */}
    <path
      d="M42 36H31a13 13 0 0 0 0 26h5.5"
      fill="none"
      stroke="url(#lb-cup)"
      strokeWidth="5.5"
      strokeLinecap="round"
    />
    <path
      d="M98 36h11a13 13 0 0 1 0 26h-5.5"
      fill="none"
      stroke="url(#lb-cup)"
      strokeWidth="5.5"
      strokeLinecap="round"
    />

    {/* Bowl, then its sheen laid over the same path. */}
    <path d="M42 28h56v18c0 20.4-12.5 34-28 34s-28-13.6-28-34z" fill="url(#lb-cup)" />
    <path d="M42 28h56v18c0 20.4-12.5 34-28 34s-28-13.6-28-34z" fill="url(#lb-cup-sheen)" />

    {/* The open mouth: a lit rim ring, a dark inset inside it. */}
    <ellipse cx="70" cy="28" rx="28" ry="6" fill="#FFECC6" opacity="0.95" />
    <ellipse cx="70" cy="29" rx="23" ry="4.2" fill="#7A4208" opacity="0.6" />

    {/* Sparkle emblem, embossed. */}
    <path
      d="M70 41l3 8.4 8.4 3-8.4 3-3 8.4-3-8.4-8.4-3 8.4-3z"
      fill="#7A4208"
      opacity="0.45"
      transform="translate(1.2 1.2)"
    />
    <path d="M70 41l3 8.4 8.4 3-8.4 3-3 8.4-3-8.4-8.4-3 8.4-3z" fill="#FFF0CF" opacity="0.75" />

    {/* Tapered stem, collar, two-step base. */}
    <path d="M63 80h14l-2 16H65z" fill="url(#lb-stem)" />
    <rect x="58.5" y="94" width="23" height="5" rx="2.5" fill="url(#lb-cup)" />
    <path d="M49 122l4-22h34l4 22z" fill="url(#lb-cup)" />
    <path d="M49 122l4-22h34l4 22z" fill="url(#lb-cup-sheen)" opacity="0.5" />
    <rect x="43" y="122" width="54" height="9" rx="4.5" fill="url(#lb-stem)" />
  </svg>
);

/* Two arcs sweeping behind the trophy — the "curved light trails". Each is
   stroked with a gradient that fades in and out at the ends, so the arc has
   no visible start or end; the sheet blurs the group slightly and adds a
   warm drop-shadow, which is what turns a flat line into a light trail. */
const Trails = () => (
  <svg
    className="ink-lb-trails"
    viewBox="0 0 600 260"
    preserveAspectRatio="none"
    role="presentation"
    focusable="false"
  >
    <defs>
      <linearGradient id="lb-trail-a" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="rgba(255, 106, 0, 0)" />
        <stop offset="44%" stopColor="rgba(255, 146, 42, 0.55)" />
        <stop offset="100%" stopColor="rgba(255, 106, 0, 0)" />
      </linearGradient>
      <linearGradient id="lb-trail-b" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="rgba(245, 166, 35, 0)" />
        <stop offset="54%" stopColor="rgba(245, 166, 35, 0.36)" />
        <stop offset="100%" stopColor="rgba(245, 166, 35, 0)" />
      </linearGradient>
    </defs>
    <path
      d="M10 250C120 250 140 74 300 74s180 176 290 176"
      fill="none"
      stroke="url(#lb-trail-a)"
      strokeWidth="2"
    />
    <path
      d="M60 262C160 262 190 118 300 118s140 144 240 144"
      fill="none"
      stroke="url(#lb-trail-b)"
      strokeWidth="1.6"
    />
  </svg>
);

const PodiumVisual = ({ rows = [], loading = false }) => {
  const reduce = useReducedMotion();
  const top3 = rows.slice(0, 3);
  // A real podium is read 2 · 1 · 3. With fewer than three entries fall back
  // to natural order so a lone leader still sits under the trophy.
  const order = top3.length === 3 ? [1, 0, 2] : top3.map((_, i) => i);
  // How many plinths will actually render — the sheet centres the row when it
  // is fewer than three, instead of leaving one plinth in the left column.
  const count = loading ? 3 : order.length || 3;

  const renderPlinth = (rank, position, entry) => (
    <motion.div
      key={entry?._id || rank}
      className="ink-lb-plinth"
      data-rank={rank}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.12 + position * 0.09 }}
    >
      {/* Light rising off the champion's plinth, up toward the cup. The
          sheet keeps it dark for the other two places. */}
      <span className="ink-lb-plinth-beam" />

      <div className="ink-lb-plinth-avatar">
        {entry ? (
          <UserAvatar
            src={entry.profile_image}
            name={entry.username}
            alt=""
            sx={{
              width: AVATAR_SIZE[rank],
              height: AVATAR_SIZE[rank],
              fontSize: AVATAR_SIZE[rank] * 0.32,
              border: `2px solid ${MEDAL[rank]}`,
              boxShadow: `0 0 0 4px ${RING[rank]}, 0 12px 26px rgba(0, 0, 0, 0.45)`,
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

      <div className="ink-lb-plinth-block">
        <span className="ink-lb-plinth-num">{rank}</span>
        <span className="ink-lb-plinth-place">{PLACE[rank]}</span>
      </div>
    </motion.div>
  );

  return (
    <div className="ink-lb-stage" aria-hidden="true">
      <Specks />
      <Trails />
      <span className="ink-lb-beam" />

      <div className="ink-lb-trophy">
        <Trophy />
      </div>

      <div className="ink-lb-podium" data-count={count}>
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
