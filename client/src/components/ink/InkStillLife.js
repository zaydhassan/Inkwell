import React from "react";
import "./InkStillLife.css";

/* ─────────────────────────────────────────────────────────────────────
   InkWell — the Explore still life.

   A cinematic editorial still life for the Explore hero: an open book under a
   warm circular light, a fountain pen resting across the right-hand page, the
   brand quill floating above the spread, and a ribbon marking the place.

   It is drawn in the same warm-black register as the About illustrations and
   the sign-in still life (components/AboutIllustrations.js,
   components/login/LoginStillLife.js) — orange is the only light source in the
   scene — so every editorial page reads as one photographic set rather than
   three illustration styles.

   Pure inline SVG: no image asset, no network request, and no background
   plate of its own. The wrapper masks the four corners
   (`.ink-still-svg`), so the drawing melts into the page instead of sitting
   inside a rectangle. Purely decorative, hence aria-hidden.

   Gradient ids are prefixed `ink-sl-` because SVG ids share one document
   namespace and must not collide with the other inline SVG in the app.
   ───────────────────────────────────────────────────────────────────── */

// Warm-black surfaces with orange as the only light source in the scene.
const C = {
  ink: "#0B0A09",
  surface: "#171513",
  raise: "#221D18",
  faint: "rgba(255,255,255,0.10)",
  orange: "#FF6A00",
  amber: "#FB923C",
  deep: "#C2410C",
  ember: "#7C2D12",
  cream: "#F5F1EA",
};

// The brand quill — the same path BrandLogo and the newsletter motif use, so
// the floating feather is the brand's own glyph rather than generic clip-art.
const QUILL_PATH = "M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z";

const Quill = ({ transform, opacity = 1, stroke = C.orange, width = 0.62 }) => (
  <g transform={transform} opacity={opacity}>
    <g
      fill="none"
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={QUILL_PATH} />
      <line x1="16" y1="8" x2="2" y2="22" />
      <line x1="17.5" y1="15" x2="9" y2="15" />
    </g>
  </g>
);

/* One ruled line of type on a page. Kept as a stroke rather than real text so
   the page reads as a draft rather than as copy — and drawn in ink rather than
   in cream, because the pages are now lit paper: dark rules are what makes them
   read as written on. */
const Line = ({ x, y, len, opacity, tilt = 0 }) => (
  <rect
    x={x}
    y={y}
    width={len}
    height="4"
    rx="2"
    fill={C.ink}
    opacity={opacity}
    transform={tilt ? `rotate(${tilt} ${x} ${y})` : undefined}
  />
);

const InkStillLife = () => (
  <svg
    viewBox="0 0 620 470"
    className="ink-still-svg"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      {/* Key light, spilling in from the upper left. */}
      <radialGradient id="ink-sl-key" cx="24%" cy="4%" r="80%">
        <stop offset="0%" stopColor={C.orange} stopOpacity="0.15" />
        <stop offset="52%" stopColor={C.deep} stopOpacity="0.05" />
        <stop offset="100%" stopColor={C.deep} stopOpacity="0" />
      </radialGradient>
      {/* The soft circular light the composition is built around. */}
      <radialGradient id="ink-sl-bloom" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={C.orange} stopOpacity="0.22" />
        <stop offset="45%" stopColor={C.deep} stopOpacity="0.09" />
        <stop offset="100%" stopColor={C.deep} stopOpacity="0" />
      </radialGradient>
      {/* Behind the floating quill. */}
      <radialGradient id="ink-sl-halo" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={C.orange} stopOpacity="0.3" />
        <stop offset="100%" stopColor={C.orange} stopOpacity="0" />
      </radialGradient>
      {/* Paper catching the light — warmer near the spine, falling off outward.
          Kept high enough that the spread reads as lit paper rather than as a
          dark slab with lines drawn on it. */}
      <linearGradient id="ink-sl-page-l" x1="1" y1="0" x2="0" y2="0.6">
        <stop offset="0%" stopColor={C.cream} stopOpacity="0.5" />
        <stop offset="55%" stopColor={C.cream} stopOpacity="0.34" />
        <stop offset="100%" stopColor={C.cream} stopOpacity="0.2" />
      </linearGradient>
      <linearGradient id="ink-sl-page-r" x1="0" y1="0" x2="1" y2="0.6">
        <stop offset="0%" stopColor={C.cream} stopOpacity="0.5" />
        <stop offset="55%" stopColor={C.cream} stopOpacity="0.34" />
        <stop offset="100%" stopColor={C.cream} stopOpacity="0.2" />
      </linearGradient>
      {/* The book's boards: dark leather with a lit top edge. */}
      <linearGradient id="ink-sl-cover" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#33291F" />
        <stop offset="100%" stopColor="#151110" />
      </linearGradient>
      {/* Pen barrel: dark resin with a lit edge. */}
      <linearGradient id="ink-sl-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3E332B" />
        <stop offset="42%" stopColor="#241E19" />
        <stop offset="100%" stopColor="#141110" />
      </linearGradient>
      {/* The nib — polished metal picking up the warm light. */}
      <linearGradient id="ink-sl-nib" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={C.amber} />
        <stop offset="100%" stopColor={C.deep} />
      </linearGradient>
      {/* Ribbon: the one saturated object in the scene. */}
      <linearGradient id="ink-sl-ribbon" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={C.amber} />
        <stop offset="100%" stopColor={C.deep} />
      </linearGradient>
    </defs>

    {/* Ambient key light across the frame */}
    <rect x="0" y="0" width="620" height="470" fill="url(#ink-sl-key)" />

    {/* ── The circular light the whole scene is lit by ── */}
    <circle cx="304" cy="286" r="196" fill="url(#ink-sl-bloom)" />
    <circle cx="304" cy="286" r="152" fill="none" stroke={C.orange} strokeWidth="1" opacity="0.14" />
    <circle cx="304" cy="286" r="198" fill="none" stroke={C.amber} strokeWidth="0.8" opacity="0.06" />

    {/* Out-of-focus warm bokeh — depth behind the subject */}
    <circle cx="120" cy="96" r="30" fill={C.orange} opacity="0.05" />
    <circle cx="188" cy="58" r="14" fill={C.amber} opacity="0.07" />
    <circle cx="530" cy="86" r="32" fill={C.deep} opacity="0.06" />
    <circle cx="562" cy="300" r="22" fill={C.deep} opacity="0.05" />
    <circle cx="72" cy="250" r="18" fill={C.orange} opacity="0.05" />

    {/* ── Contact shadow on the desk ── */}
    <ellipse cx="300" cy="424" rx="252" ry="22" fill="#000" opacity="0.5" />

    {/* ── The book ─────────────────────────────────────────────────────
        Boards first, then the page block, then the two lit pages on top, so
        the spread reads as one object with thickness rather than two shapes. */}
    <g>
      {/* boards */}
      <path
        d="M302 250 C 232 234, 132 256, 56 292 L 56 410 C 134 372, 234 352, 302 364 Z"
        fill="url(#ink-sl-cover)"
        stroke={C.faint}
        strokeWidth="1.4"
      />
      <path
        d="M302 250 C 372 234, 472 256, 548 292 L 548 410 C 470 372, 370 352, 302 364 Z"
        fill="url(#ink-sl-cover)"
        stroke={C.faint}
        strokeWidth="1.4"
      />
      {/* board catch light along the outer top edges */}
      <path d="M302 250 C 232 234, 132 256, 56 292" fill="none" stroke={C.cream} strokeOpacity="0.16" strokeWidth="1.6" />
      <path d="M302 250 C 372 234, 472 256, 548 292" fill="none" stroke={C.cream} strokeOpacity="0.16" strokeWidth="1.6" />

      {/* the page block — the cut edges of the gathering */}
      <path
        d="M70 400 C 142 372, 236 356, 302 368 L 302 380 C 236 368, 142 384, 70 412 Z"
        fill={C.cream}
        opacity="0.22"
      />
      <path
        d="M534 400 C 462 372, 368 356, 302 368 L 302 380 C 368 368, 462 384, 534 412 Z"
        fill={C.cream}
        opacity="0.22"
      />

      {/* the two lit pages */}
      <path
        d="M302 262 C 240 248, 148 268, 74 302 L 74 396 C 150 366, 242 350, 302 360 Z"
        fill="url(#ink-sl-page-l)"
        stroke={C.faint}
        strokeWidth="1.2"
      />
      <path
        d="M302 262 C 364 248, 456 268, 530 302 L 530 396 C 454 366, 362 350, 302 360 Z"
        fill="url(#ink-sl-page-r)"
        stroke={C.faint}
        strokeWidth="1.2"
      />

      {/* the fold: a soft dark gradient down the gutter */}
      <path d="M302 262 L 302 360" stroke={C.ink} strokeWidth="10" opacity="0.42" strokeLinecap="round" />
      <path d="M302 262 L 302 360" stroke={C.cream} strokeOpacity="0.3" strokeWidth="1.4" />

      {/* ── Left page: a heading in ink, then a draft ── */}
      <g className="ink-sl-tilt-l">
        <rect x="108" y="300" width="66" height="7" rx="3.5" fill={C.deep} opacity="0.85" />
        <Line x={108} y={324} len={124} opacity={0.5} />
        <Line x={108} y={342} len={148} opacity={0.42} />
        <Line x={108} y={360} len={104} opacity={0.34} />
      </g>

      {/* ── Right page: a draft, plus a ruled block ── */}
      <g className="ink-sl-tilt-r">
        <Line x={368} y={300} len={116} opacity={0.5} />
        <Line x={368} y={318} len={140} opacity={0.42} />
        <Line x={368} y={336} len={92} opacity={0.34} />
        <Line x={368} y={354} len={122} opacity={0.26} />
      </g>

      {/* ── The ribbon marking the place ── */}
      <g className="ink-sl-ribbon-group">
        <path
          d="M330 286 L 352 286 L 352 448 L 341 436 L 330 448 Z"
          fill="url(#ink-sl-ribbon)"
          opacity="0.94"
        />
        <path d="M330 286 L 352 286" stroke={C.cream} strokeOpacity="0.3" strokeWidth="1.4" />
        <path d="M334 288 L 334 440" stroke={C.ink} strokeOpacity="0.22" strokeWidth="1" />
      </g>
    </g>

    {/* ── The fountain pen, resting across the right-hand page ── */}
    <g transform="rotate(-17 392 318)">
      {/* contact shadow, cast onto the paper */}
      <ellipse cx="392" cy="344" rx="150" ry="7" fill="#000" opacity="0.4" />

      {/* nib — tapered, with a breather hole and a slit to the point */}
      <path d="M248 312 l42 -8 v16 z" fill="url(#ink-sl-nib)" />
      <circle cx="266" cy="312" r="2.4" fill={C.ink} opacity="0.8" />
      <line x1="266" y1="312" x2="250" y2="312" stroke={C.ember} strokeWidth="1" />

      {/* section, where the fingers would hold it */}
      <rect x="288" y="303" width="27" height="18" rx="6" fill="#2A231D" stroke={C.faint} strokeWidth="1" />

      {/* barrel */}
      <rect x="313" y="300" width="168" height="24" rx="12" fill="url(#ink-sl-body)" stroke={C.faint} strokeWidth="1.2" />

      {/* cap band — the one warm accent on the object */}
      <rect x="477" y="298" width="14" height="28" rx="3" fill={C.orange} />
      <rect x="477" y="298" width="14" height="1.6" rx="0.8" fill={C.cream} opacity="0.3" />

      {/* cap, with its clip */}
      <rect x="491" y="299" width="86" height="26" rx="13" fill="url(#ink-sl-body)" stroke={C.faint} strokeWidth="1.2" />
      <rect x="541" y="293" width="4" height="15" rx="2" fill={C.amber} opacity="0.8" />

      {/* catch light running the length of the barrel and the cap */}
      <rect x="322" y="304" width="150" height="2.4" rx="1.2" fill={C.cream} opacity="0.26" />
      <rect x="499" y="303" width="72" height="2.4" rx="1.2" fill={C.cream} opacity="0.18" />
    </g>

    {/* ── The floating quill, above the spread ── */}
    <g className="ink-sl-float">
      {/* its own soft halo, so it reads as lit from behind */}
      <circle cx="470" cy="150" r="86" fill="url(#ink-sl-halo)" />
      {/* amber echo, offset a hair, so the feather reads as a rounded form */}
      <Quill transform="translate(430 108) rotate(-16) scale(3.9)" stroke={C.amber} opacity={0.22} />
      <Quill transform="translate(428 106) rotate(-16) scale(3.9)" opacity={0.95} />
    </g>

    {/* ── Warm sparkle, and a few drifting motes ── */}
    <circle className="ink-pulse" cx="392" cy="72" r="3" fill={C.orange} />
    <circle cx="556" cy="176" r="2.4" fill={C.amber} opacity="0.4" />
    <circle cx="196" cy="140" r="2" fill={C.amber} opacity="0.35" />
    <circle cx="252" cy="430" r="2.2" fill={C.amber} opacity="0.25" />
    <path
      d="M512 46 l0 12 M506 52 l12 0"
      stroke={C.amber}
      strokeWidth="2.2"
      strokeLinecap="round"
      opacity="0.4"
    />
  </svg>
);

export default InkStillLife;
