import React from "react";
import { Box } from "@mui/material";

/* ─────────────────────────────────────────────────────────────────────
   Reading History — hero illustration.

   An open book on a warm desk: a mug, a stack of finished books, a ribbon
   bookmark, and a loose note card drifting above it. Drawn in the same
   house language as AboutIllustrations — thin warm strokes, named
   gradients, a single orange light source — rather than a bitmap, so it
   stays crisp at any size and costs no network request.

   It sits on a `.ink-plate` (see ReadingHistory.css): the plate keeps its
   dark key light in BOTH themes, exactly like the About artwork, so the
   composition reads as a deliberate framed panel instead of a dark blob
   on a light page. That is why the fills below are fixed values rather
   than `var(--ink-*)` references — inside a plate the theme does not
   change, and referencing theme tokens would make the artwork flip while
   its own background did not.

   Decorative: the hero copy beside it carries the meaning, so it is
   aria-hidden rather than labelled.
   ───────────────────────────────────────────────────────────────────── */

const ReadingScene = ({ className = "", sx }) => (
  <Box className={`ink-rh-art ${className}`.trim()} aria-hidden="true" sx={sx}>
    <svg viewBox="0 0 460 360" role="presentation" focusable="false">
      <defs>
        <radialGradient id="rh-glow" cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor="#ff6a00" stopOpacity="0.30" />
          <stop offset="55%" stopColor="#f97316" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#ff6a00" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rh-desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a2420" />
          <stop offset="100%" stopColor="#171412" />
        </linearGradient>
        <linearGradient id="rh-page" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f7f2e9" />
          <stop offset="100%" stopColor="#ddd4c6" />
        </linearGradient>
        <linearGradient id="rh-page-shade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="rh-page-shade-r" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="rh-cover" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c2410c" />
          <stop offset="100%" stopColor="#8a2d07" />
        </linearGradient>
        <linearGradient id="rh-note" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#241f1b" />
          <stop offset="100%" stopColor="#1a1613" />
        </linearGradient>
        <linearGradient id="rh-book-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3a322b" />
          <stop offset="100%" stopColor="#262120" />
        </linearGradient>
        <linearGradient id="rh-book-b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4a3a30" />
          <stop offset="100%" stopColor="#2e2724" />
        </linearGradient>
      </defs>

      {/* Warm light pooling behind the composition. */}
      <ellipse cx="230" cy="168" rx="196" ry="150" fill="url(#rh-glow)" />

      {/* Desk surface — a soft plane, not a hard edge. */}
      <path d="M28 286 H432 a10 10 0 0 1 0 20 H28 a10 10 0 0 1 0-20 Z" fill="url(#rh-desk)" />
      <path d="M28 286 H432" stroke="#ff6a00" strokeOpacity="0.22" strokeWidth="1.5" />

      {/* ── Stack of finished books (left) ─────────────────────────── */}
      <g>
        <rect x="46" y="252" width="112" height="16" rx="5" fill="url(#rh-book-a)" />
        <rect x="46" y="252" width="112" height="16" rx="5" fill="none" stroke="#ff6a00" strokeOpacity="0.18" />
        <rect x="58" y="235" width="98" height="15" rx="5" fill="url(#rh-book-b)" />
        <rect x="70" y="219" width="86" height="14" rx="5" fill="url(#rh-book-a)" />
        <rect x="70" y="219" width="86" height="14" rx="5" fill="none" stroke="#ff6a00" strokeOpacity="0.14" />
        {/* Page edges on the top volume. */}
        <path d="M76 226 H150" stroke="#f7f2e9" strokeOpacity="0.24" strokeWidth="1.4" />
        {/* Ribbon marker spilling out of the stack. */}
        <path d="M150 235 l14 0 0 34 -7 -7 -7 7 Z" fill="#ff6a00" fillOpacity="0.85" />
      </g>

      {/* ── Open book (centre) ─────────────────────────────────────── */}
      <g>
        {/* Covers, splayed. */}
        <path d="M150 268 L232 250 L232 274 L150 292 Z" fill="url(#rh-cover)" />
        <path d="M314 268 L232 250 L232 274 L314 292 Z" fill="url(#rh-cover)" />
        {/* Pages. */}
        <path d="M158 262 L232 246 L232 266 L158 284 Z" fill="url(#rh-page)" />
        <path d="M306 262 L232 246 L232 266 L306 284 Z" fill="url(#rh-page)" />
        {/* Inner shading toward the gutter, so the spread reads as a valley. */}
        <path d="M158 262 L232 246 L232 266 L158 284 Z" fill="url(#rh-page-shade)" />
        <path d="M306 262 L232 246 L232 266 L306 284 Z" fill="url(#rh-page-shade-r)" />
        {/* Text lines — suggestive, not legible. */}
        <g stroke="#6b6259" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round">
          <path d="M170 266 L220 257" />
          <path d="M170 273 L214 265" />
          <path d="M170 280 L220 271" />
          <path d="M246 257 L294 266" />
          <path d="M250 265 L294 273" />
          <path d="M250 272 L290 280" />
        </g>
        {/* Spine shadow. */}
        <path d="M232 246 L232 266" stroke="#000" strokeOpacity="0.35" strokeWidth="2" />
        {/* Ribbon bookmark falling from the gutter. */}
        <path d="M228 248 l12 0 0 46 -6 -6 -6 6 Z" fill="#ff6a00" />
        <path d="M230 258 l8 0" stroke="#000" strokeOpacity="0.18" strokeWidth="1.5" />
      </g>

      {/* ── Mug (right), with steam ────────────────────────────────── */}
      <g>
        <path
          d="M330 240 h58 a8 8 0 0 1 8 8 v22 a16 16 0 0 1 -16 16 h-42 a16 16 0 0 1 -16 -16 v-22 a8 8 0 0 1 8 -8 Z"
          fill="#2b2622"
        />
        <path
          d="M330 240 h58 a8 8 0 0 1 8 8 v22 a16 16 0 0 1 -16 16 h-42 a16 16 0 0 1 -16 -16 v-22 a8 8 0 0 1 8 -8 Z"
          fill="none"
          stroke="#ff6a00"
          strokeOpacity="0.28"
        />
        <path d="M338 246 h42" stroke="#f7f2e9" strokeOpacity="0.16" strokeWidth="1.6" />
        {/* Handle. */}
        <path
          d="M396 250 a16 16 0 0 1 0 28"
          fill="none"
          stroke="#3a322b"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Steam. */}
        <g stroke="#ff6a00" strokeOpacity="0.35" strokeWidth="2.4" strokeLinecap="round" fill="none">
          <path d="M348 230 c6 -8 -6 -14 0 -22" />
          <path d="M366 232 c6 -10 -6 -16 0 -26" />
          <path d="M382 230 c6 -8 -6 -14 0 -22" />
        </g>
      </g>

      {/* ── Floating note card (upper right) ───────────────────────── */}
      <g className="ink-rh-note">
        <rect
          x="300"
          y="86"
          width="118"
          height="76"
          rx="12"
          fill="url(#rh-note)"
          transform="rotate(-6 359 124)"
        />
        <rect
          x="300"
          y="86"
          width="118"
          height="76"
          rx="12"
          fill="none"
          stroke="#ff6a00"
          strokeOpacity="0.30"
          transform="rotate(-6 359 124)"
        />
        <g transform="rotate(-6 359 124)">
          <rect x="314" y="102" width="46" height="5" rx="2.5" fill="#ff6a00" fillOpacity="0.75" />
          <g stroke="#b5aea5" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round">
            <path d="M314 118 H402" />
            <path d="M314 130 H392" />
            <path d="M314 142 H372" />
          </g>
        </g>
      </g>

      {/* Loose sparks of light — the only pure decoration. */}
      <g fill="#ff6a00">
        <circle cx="126" cy="120" r="3" fillOpacity="0.5" />
        <circle cx="152" cy="96" r="2" fillOpacity="0.35" />
        <circle cx="292" cy="60" r="2.4" fillOpacity="0.4" />
        <circle cx="96" cy="180" r="2" fillOpacity="0.3" />
      </g>
    </svg>
  </Box>
);

export default ReadingScene;
