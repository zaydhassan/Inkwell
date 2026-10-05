import React from "react";
import { Box } from "@mui/material";

/* ─────────────────────────────────────────────────────────────────────
   Bookmarks — hero illustration.

   The picture is the page's own idea, drawn once: SAVE → COLLECT → RETURN.
   An open book is the anchor of the frame, and four saved-article cards
   orbit it — each one a miniature of the real thing on this page, with a
   category mark, a couple of title rules and a meta line, and one of them
   carrying the orange "SAVED" mark the page is about. Nothing here is a
   decoration that could belong to any other product.

   Three layers, back to front, which is what gives it depth without any
   glassmorphism: the room's warm light, a soft reading aura with one
   drifting arc, then the cards, then the book. The orbit is deliberate —
   the arc's radius is set so it grazes the inner edge of all four cards,
   which is what binds five separate objects into one composition instead
   of a scattering. Two of the cards tuck behind the book's corners for
   the same reason.

   Drawn in the same house language as ReadingScene and AboutIllustrations —
   thin warm strokes, named gradients, a single orange light source — rather
   than a bitmap, so it stays crisp at any size and costs no network request.

   It sits on a `.ink-plate` (see Bookmarks.css): the plate keeps its dark
   key light in BOTH themes, exactly like the About and History artwork, so
   the composition reads as a deliberate framed panel instead of a dark blob
   on a light page. That is why the fills below are fixed values rather than
   `var(--ink-*)` references — inside a plate the theme does not change, and
   referencing theme tokens would make the artwork flip while its own
   background did not.

   Palette discipline holds here too: warm neutrals, one orange accent, and
   the off-white of the page stock as the brightest thing in the frame, so
   the open book is unmistakably the focal point. No purple, violet, indigo,
   blue or cyan.

   The one word of type — "SAVED" — is interface chrome, not content. Article
   text is drawn as rules, never as legible titles: this product does not
   invent stories to illustrate itself with.

   Motion is NOT declared here. The keyframes, the pivots and the
   reduced-motion off switch all live in pages/Bookmarks.css, keyed off the
   .ink-bm-* classes below. That keeps this file pure geometry and, more
   importantly, keeps "turn all of it off" in one place instead of scattered
   across the markup. Each animated group is the OUTER <g>; the tilt of a
   card is an SVG transform on an inner <g>, because a CSS transform always
   wins over the attribute and would otherwise silently cancel the rotation.

   Decorative: the hero copy beside it carries the meaning, so it is
   aria-hidden rather than labelled.
   ───────────────────────────────────────────────────────────────────── */

/* One bookmark glyph, reused at several sizes: a solid 14×18 with rounded
   shoulders and the classic notch cut out of the foot. */
const BOOKMARK_PATH =
  "M2.5 0 H11.5 A2.5 2.5 0 0 1 14 2.5 V18 L7 13.2 L0 18 V2.5 A2.5 2.5 0 0 1 2.5 0 Z";

const BookmarksScene = ({ className = "", sx }) => (
  <Box className={`ink-bm-art ${className}`.trim()} aria-hidden="true" sx={sx}>
    <svg viewBox="0 0 460 360" role="presentation" focusable="false">
      <defs>
        {/* The room's light, pooling behind everything. */}
        <radialGradient id="bm-glow" cx="50%" cy="46%" r="62%">
          <stop offset="0%" stopColor="#ff6a00" stopOpacity="0.30" />
          <stop offset="55%" stopColor="#f97316" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#ff6a00" stopOpacity="0" />
        </radialGradient>
        {/* The reading aura — a much softer, wider pool than the glow, so
            the middle layer reads as atmosphere rather than a second light. */}
        <radialGradient id="bm-aura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff6a00" stopOpacity="0.20" />
          <stop offset="60%" stopColor="#ff6a00" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#ff6a00" stopOpacity="0" />
        </radialGradient>
        {/* Card faces: lifted toward the light source at the upper left. */}
        <linearGradient id="bm-card" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1d1a17" />
          <stop offset="100%" stopColor="#141210" />
        </linearGradient>
        <linearGradient id="bm-card-hi" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#241e18" />
          <stop offset="100%" stopColor="#171310" />
        </linearGradient>
        {/* Page stock. The brightest value in the frame, deliberately. */}
        <linearGradient id="bm-page" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f7f2e9" />
          <stop offset="100%" stopColor="#ded5c7" />
        </linearGradient>
        {/* The gutter valley. Each page darkens toward the spine, which is
            what makes two flat parallelograms read as one open book. */}
        <linearGradient id="bm-gutter-l" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="bm-gutter-r" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </linearGradient>
        {/* The boards, seen only as a rim outside and below the page block. */}
        <linearGradient id="bm-cover" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2b2621" />
          <stop offset="100%" stopColor="#171412" />
        </linearGradient>
        <radialGradient id="bm-ground" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        {/* One blur, used only by the cards' drop shadows. */}
        <filter id="bm-lift" x="-20%" y="-20%" width="140%" height="160%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* ── LAYER 1 — the room's warm light. It breathes. ────────────── */}
      <ellipse className="ink-bm-glow" cx="230" cy="190" rx="220" ry="170" fill="url(#bm-glow)" />

      {/* ── LAYER 2 — the reading aura ──────────────────────────────── */}
      <circle className="ink-bm-aura" cx="230" cy="210" r="150" fill="url(#bm-aura)" />
      {/* The orbit. Its radius is set to graze the inner edge of all four
          cards — which is what turns five separate objects into one
          composition. The dashes are the whole reason its slow rotation is
          visible at all; a solid ring spinning shows nothing. */}
      <circle
        className="ink-bm-ring"
        cx="230"
        cy="210"
        r="146"
        fill="none"
        stroke="#ff6a00"
        strokeOpacity="0.24"
        strokeWidth="1.3"
        strokeDasharray="2 12"
        strokeLinecap="round"
      />
      {/* The book's shadow goes here rather than with the book. It has to
          land on the lit ground — i.e. over the aura and the orbit — but
          under the cards, which float in front of that surface; painting it
          with the book would lay it across their faces instead. */}
      <ellipse cx="230" cy="298" rx="120" ry="14" fill="url(#bm-ground)" />

      {/* ── LAYER 3 — saved articles, floating ──────────────────────────
          Drawn before the book on purpose: the two lower cards tuck behind
          its fore-edge, which is where the depth comes from. Each card is a
          miniature of a real one on this page — a mark, title rules, a meta
          line — with the text kept suggestive rather than legible. */}

      {/* Top left. */}
      <g className="ink-bm-fc-a">
        <g transform="rotate(-6 99 82)">
          <rect x="37" y="47" width="130" height="84" rx="11" fill="#000000" fillOpacity="0.45" filter="url(#bm-lift)" />
          <rect x="34" y="40" width="130" height="84" rx="11" fill="url(#bm-card)" stroke="rgba(255,255,255,0.09)" />
          <g transform="translate(47 56) scale(0.78)">
            <path d={BOOKMARK_PATH} fill="#ff6a00" />
          </g>
          <rect x="64" y="58" width="40" height="5" rx="2.5" fill="#ff6a00" fillOpacity="0.5" />
          <rect x="47" y="82" width="80" height="6" rx="3" fill="#f5f1ea" fillOpacity="0.82" />
          <rect x="47" y="94" width="58" height="6" rx="3" fill="#f5f1ea" fillOpacity="0.5" />
          <rect x="47" y="111" width="34" height="4" rx="2" fill="#8a837a" fillOpacity="0.85" />
        </g>
      </g>

      {/* Top right — the one card that takes the accent: a warm face, a thin
          orange edge, and the only legible word in the artwork. */}
      <g className="ink-bm-fc-b">
        <g transform="rotate(5.5 361 80)">
          <rect x="295" y="41" width="138" height="92" rx="11" fill="#000000" fillOpacity="0.45" filter="url(#bm-lift)" />
          <rect
            x="292"
            y="34"
            width="138"
            height="92"
            rx="11"
            fill="url(#bm-card-hi)"
            stroke="rgba(255,106,0,0.30)"
          />
          <rect
            x="304"
            y="49"
            width="74"
            height="20"
            rx="10"
            fill="#ff6a00"
            fillOpacity="0.14"
            stroke="#ff6a00"
            strokeOpacity="0.45"
          />
          <g className="ink-bm-glyph">
            <g transform="translate(312 52.5) scale(0.72)">
              <path d={BOOKMARK_PATH} fill="#ff6a00" />
            </g>
          </g>
          <text className="ink-bm-label" x="331" y="63">
            SAVED
          </text>
          <rect x="306" y="82" width="90" height="7" rx="3.5" fill="#f5f1ea" fillOpacity="0.85" />
          <rect x="306" y="96" width="66" height="7" rx="3.5" fill="#f5f1ea" fillOpacity="0.5" />
          <rect x="306" y="112" width="42" height="4" rx="2" fill="#8a837a" fillOpacity="0.85" />
        </g>
      </g>

      {/* Bottom right — tucks behind the book's fore-edge. Its content is
          held to the right of x=360 for that reason: a card whose glyph and
          category rule sit under the book reads as a printing fault, not as
          a card that is partly behind something. What is hidden is only its
          empty upper-left face. */}
      <g className="ink-bm-fc-c">
        <g transform="rotate(-5 365 291)">
          <rect x="305" y="259" width="126" height="78" rx="11" fill="#000000" fillOpacity="0.45" filter="url(#bm-lift)" />
          <rect x="302" y="252" width="126" height="78" rx="11" fill="url(#bm-card)" stroke="rgba(255,255,255,0.09)" />
          <g transform="translate(366 262) scale(0.72)">
            <path d={BOOKMARK_PATH} fill="#ff6a00" />
          </g>
          <rect x="384" y="264" width="30" height="5" rx="2.5" fill="#ff6a00" fillOpacity="0.5" />
          <rect x="366" y="288" width="48" height="6" rx="3" fill="#f5f1ea" fillOpacity="0.8" />
          <rect x="366" y="300" width="34" height="6" rx="3" fill="#f5f1ea" fillOpacity="0.48" />
          <rect x="366" y="312" width="28" height="4" rx="2" fill="#8a837a" fillOpacity="0.8" />
        </g>
      </g>

      {/* Bottom left — the small one, so the orbit has a rhythm rather than
          four identical objects. Tucks behind the book's other corner, so
          its rules stop short of the fore-edge rather than running into it. */}
      <g className="ink-bm-fc-d">
        <g transform="rotate(5 82 278)">
          <rect x="33" y="259" width="104" height="52" rx="10" fill="#000000" fillOpacity="0.45" filter="url(#bm-lift)" />
          <rect x="30" y="252" width="104" height="52" rx="10" fill="url(#bm-card)" stroke="rgba(255,255,255,0.09)" />
          <g transform="translate(42 266) scale(0.72)">
            <path d={BOOKMARK_PATH} fill="#ff6a00" />
          </g>
          <rect x="60" y="268" width="40" height="6" rx="3" fill="#f5f1ea" fillOpacity="0.8" />
          <rect x="60" y="281" width="28" height="5" rx="2.5" fill="#f5f1ea" fillOpacity="0.45" />
        </g>
      </g>

      {/* ── LAYER 4 — the open book, the anchor of the whole frame ───── */}
      {/* Boards first, sitting a few units proud of the pages: what shows
          past the page block is the book's thickness. */}
      <path d="M103 196 L230 161 L230 246 L103 286 Z" fill="url(#bm-cover)" />
      <path d="M357 196 L230 161 L230 246 L357 286 Z" fill="url(#bm-cover)" />

      {/* Pages. */}
      <path d="M112 188 L230 154 L230 234 L112 274 Z" fill="url(#bm-page)" />
      <path d="M348 188 L230 154 L230 234 L348 274 Z" fill="url(#bm-page)" />

      {/* The valley toward the spine. */}
      <path d="M112 188 L230 154 L230 234 L112 274 Z" fill="url(#bm-gutter-l)" />
      <path d="M348 188 L230 154 L230 234 L348 274 Z" fill="url(#bm-gutter-r)" />

      {/* Page-block edges, so the book is a stack and not one sheet. */}
      <g stroke="#f7f2e9" fill="none">
        <path d="M112 274 L230 234" strokeOpacity="0.22" strokeWidth="1.6" />
        <path d="M348 274 L230 234" strokeOpacity="0.22" strokeWidth="1.6" />
        <path d="M106 282 L230 241" strokeOpacity="0.1" strokeWidth="1.6" />
        <path d="M354 282 L230 241" strokeOpacity="0.1" strokeWidth="1.6" />
      </g>

      {/* Set text — rules, not words. A heading and two lines a side. */}
      <g stroke="#6b6259" strokeLinecap="round">
        <path d="M124 201 L186 184" strokeWidth="6" strokeOpacity="0.55" />
        <path d="M124 219 L200 198" strokeWidth="3.5" strokeOpacity="0.45" />
        <path d="M124 237 L180 221" strokeWidth="3.5" strokeOpacity="0.35" />
        <path d="M274 184 L336 201" strokeWidth="6" strokeOpacity="0.55" />
        <path d="M260 198 L336 219" strokeWidth="3.5" strokeOpacity="0.45" />
        <path d="M280 221 L336 237" strokeWidth="3.5" strokeOpacity="0.35" />
      </g>

      {/* Spine shadow, then the ribbon that marks the place. Grouped so the
          whole ribbon swings from its own top edge (see .ink-bm-ribbon). */}
      <path d="M230 154 L230 234" stroke="#000000" strokeOpacity="0.5" strokeWidth="2.5" />
      <g className="ink-bm-ribbon">
        <path d="M224 230 L236 230 L236 300 L230 293 L224 300 Z" fill="#ff6a00" />
        <path d="M226 244 L234 244" stroke="#000000" strokeOpacity="0.18" strokeWidth="1.5" />
      </g>

      {/* ── Loose sparks — the only pure decoration, and the only part that
          twinkles. Each keeps its own base brightness in fillOpacity; the
          CSS animation multiplies on top of it. ─────────────────────── */}
      <g fill="#ff6a00">
        <circle className="ink-bm-spark" cx="200" cy="92" r="2.6" fillOpacity="0.5" />
        <circle className="ink-bm-spark" cx="272" cy="70" r="2.2" fillOpacity="0.38" />
        <circle className="ink-bm-spark" cx="72" cy="200" r="2.4" fillOpacity="0.42" />
        <circle className="ink-bm-spark" cx="392" cy="196" r="2.2" fillOpacity="0.34" />
        <circle className="ink-bm-spark" cx="230" cy="336" r="2.6" fillOpacity="0.44" />
      </g>
    </svg>
  </Box>
);

export default BookmarksScene;
