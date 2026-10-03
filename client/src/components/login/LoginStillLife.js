import React from "react";

/* ─────────────────────────────────────────────────────────────────────
   InkWell — the sign-in still life.

   A cinematic editorial still life for the bottom-left of the login page:
   a handwritten manuscript lit by a warm circular glow, an elegant
   fountain pen resting across it, and a quill standing in an inkwell —
   the brand glyph used as an object rather than a logo.

   Three subjects, left to right: inkwell + quill, the written page, the
   pen. Drawn with orange as the only light source in the scene, in the
   same warm-black grade as the About page's own scenes
   (components/AboutIllustrations.js), so the two pages read as one
   photographic register rather than two illustration styles.

   Pure inline SVG — no image assets, no network. It has NO background
   plate of its own, and the wrapper masks its edges (see
   `.ink-login-still-svg`), so it melts into the page instead of sitting
   inside a hard rectangle. Purely decorative, hence aria-hidden.

   The viewBox is cropped to the composition rather than to a round
   canvas: the subjects span x 46–582, y 27–370 of the original 620×400
   frame, so the outer band was dead space that pushed the inkwell ~20px
   in from the page's text column and made the drawing render smaller
   than its box. Cropping to `44 24 542 350` puts the inkwell's shadow on
   the box's left edge — the artwork starts where the type above it starts
   — and gives the same box ~14% more drawing. The key-light wash is a
   radial gradient, so it is already transparent where the new edges cut
   it and the crop leaves no seam.

   Gradient ids are prefixed `ink-ls-` because SVG ids share one document
   namespace and must not collide with other inline SVG in the app.
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

/* The InkWell quill/feather glyph, at object scale.
   `width` is pre-scale: the group's `scale()` multiplies it, so a 0.62
   stroke inside a 3.4× scale lands at a hair over 2px on screen — the
   line weight an inked feather actually has. */
const Quill = ({ transform, opacity = 1, stroke = C.orange, width = 0.62 }) => (
  <g transform={transform} opacity={opacity}>
    <g
      fill="none"
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
      <line x1="16" y1="8" x2="2" y2="22" />
      <line x1="17.5" y1="15" x2="9" y2="15" />
    </g>
  </g>
);

/* One line of handwriting: a shallow wave, narrower as it goes. Kept as a
   stroke rather than typeset text so it reads as a draft, not as copy. */
const Script = ({ y, opacity, drift = 0 }) => (
  <path
    d={`M224 ${y} c 15 -9 27 7 42 -1 c 15 -8 27 7 42 -1 c 15 -8 27 7 42 -1 c 11 -6 20 3 29 0`}
    transform={drift ? `rotate(${drift} 320 ${y})` : undefined}
    stroke={C.cream}
    strokeOpacity={opacity}
    strokeWidth="3.4"
    fill="none"
    strokeLinecap="round"
  />
);

const LoginStillLife = () => (
  <svg
    viewBox="44 24 542 350"
    className="ink-login-still-svg"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      {/* Key light, spilling in from the upper left. */}
      <radialGradient id="ink-ls-key" cx="22%" cy="6%" r="78%">
        <stop offset="0%" stopColor={C.orange} stopOpacity="0.16" />
        <stop offset="55%" stopColor={C.deep} stopOpacity="0.05" />
        <stop offset="100%" stopColor={C.deep} stopOpacity="0" />
      </radialGradient>
      {/* The soft circular light the page brief asks for. */}
      <radialGradient id="ink-ls-bloom" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={C.orange} stopOpacity="0.24" />
        <stop offset="46%" stopColor={C.deep} stopOpacity="0.10" />
        <stop offset="100%" stopColor={C.deep} stopOpacity="0" />
      </radialGradient>
      {/* Manuscript stock: paper catching the light, warmer at the top. */}
      <linearGradient id="ink-ls-sheet" x1="0.1" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor={C.cream} stopOpacity="0.26" />
        <stop offset="58%" stopColor={C.cream} stopOpacity="0.15" />
        <stop offset="100%" stopColor={C.cream} stopOpacity="0.09" />
      </linearGradient>
      {/* Pen barrel: dark resin with a lit edge. */}
      <linearGradient id="ink-ls-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3E332B" />
        <stop offset="42%" stopColor="#241E19" />
        <stop offset="100%" stopColor="#141110" />
      </linearGradient>
      {/* The nib — polished metal picking up the warm light. */}
      <linearGradient id="ink-ls-nib" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={C.amber} />
        <stop offset="100%" stopColor={C.deep} />
      </linearGradient>
    </defs>

    {/* Ambient key light across the whole frame */}
    <rect x="0" y="0" width="620" height="400" fill="url(#ink-ls-key)" />

    {/* ── The glowing circular light behind the page ── */}
    <circle cx="330" cy="188" r="152" fill="url(#ink-ls-bloom)" />
    <circle
      cx="330"
      cy="188"
      r="112"
      fill="none"
      stroke={C.orange}
      strokeWidth="1"
      opacity="0.16"
    />
    <circle
      cx="330"
      cy="188"
      r="150"
      fill="none"
      stroke={C.amber}
      strokeWidth="0.8"
      opacity="0.07"
    />

    {/* Out-of-focus warm bokeh — depth behind the subject */}
    <circle cx="228" cy="70" r="30" fill={C.orange} opacity="0.05" />
    <circle cx="286" cy="42" r="15" fill={C.amber} opacity="0.07" />
    <circle cx="548" cy="72" r="34" fill={C.deep} opacity="0.06" />
    <circle cx="120" cy="120" r="22" fill={C.deep} opacity="0.05" />

    {/* ── The manuscript ── */}
    <g transform="rotate(-5 320 210)">
      <rect
        x="176"
        y="96"
        width="290"
        height="232"
        rx="14"
        fill="url(#ink-ls-sheet)"
        stroke={C.faint}
        strokeWidth="1.4"
      />
      {/* lit top edge — the catch light along the paper */}
      <rect x="176" y="96" width="290" height="2.5" rx="1.25" fill={C.cream} opacity="0.26" />
      {/* ruled margin, like a notebook */}
      <rect x="200" y="124" width="1.6" height="176" rx="0.8" fill={C.orange} opacity="0.35" />

      {/* the title, written in ink */}
      <path
        d="M224 142 c 13 -9 24 7 37 -1 c 13 -8 24 7 37 -2"
        stroke={C.orange}
        strokeOpacity="0.9"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />

      {/* the draft */}
      <Script y={178} opacity={0.3} />
      <Script y={202} opacity={0.25} />
      <Script y={226} opacity={0.21} />
      <Script y={250} opacity={0.17} />

      {/* the closing lines, ruled rather than flowing */}
      <rect x="224" y="278" width="132" height="4.5" rx="2.25" fill={C.cream} opacity="0.14" />
      <rect x="224" y="294" width="96" height="4.5" rx="2.25" fill={C.cream} opacity="0.11" />
    </g>

    {/* ── The fountain pen, resting across the page ── */}
    <g transform="rotate(-12 375 296)">
      {/* contact shadow, cast onto the paper */}
      <ellipse cx="375" cy="324" rx="182" ry="9" fill="#000" opacity="0.42" />

      {/* nib — tapered, with a breather hole and a slit to the point */}
      <path d="M196 286 l46 -9 v18 z" fill="url(#ink-ls-nib)" />
      <circle cx="216" cy="286" r="2.6" fill={C.ink} opacity="0.8" />
      <line x1="216" y1="286" x2="199" y2="286" stroke={C.ember} strokeWidth="1" />

      {/* section, where the fingers would hold it */}
      <rect
        x="240"
        y="276"
        width="30"
        height="20"
        rx="7"
        fill="#2A231D"
        stroke={C.faint}
        strokeWidth="1"
      />

      {/* barrel */}
      <rect
        x="268"
        y="273"
        width="190"
        height="26"
        rx="13"
        fill="url(#ink-ls-body)"
        stroke={C.faint}
        strokeWidth="1.2"
      />

      {/* cap band — the one warm accent on the object */}
      <rect x="452" y="271" width="16" height="30" rx="3" fill={C.orange} />
      <rect x="452" y="271" width="16" height="1.8" rx="0.9" fill={C.cream} opacity="0.3" />

      {/* cap, with its clip */}
      <rect
        x="468"
        y="272"
        width="96"
        height="28"
        rx="14"
        fill="url(#ink-ls-body)"
        stroke={C.faint}
        strokeWidth="1.2"
      />
      <rect x="524" y="266" width="4.5" height="16" rx="2.25" fill={C.amber} opacity="0.8" />

      {/* catch light running the length of the barrel and the cap */}
      <rect x="278" y="277" width="168" height="2.6" rx="1.3" fill={C.cream} opacity="0.28" />
      <rect x="476" y="276" width="80" height="2.6" rx="1.3" fill={C.cream} opacity="0.2" />
    </g>

    {/* ── The inkwell, with the quill standing in it ── */}
    <g>
      <ellipse cx="112" cy="338" rx="66" ry="10" fill="#000" opacity="0.5" />

      {/* body */}
      <path
        d="M62 268 h100 v48 a20 20 0 0 1 -20 20 h-60 a20 20 0 0 1 -20 -20 z"
        fill={C.surface}
        stroke={C.faint}
        strokeWidth="1.4"
      />
      {/* rim light down the left shoulder — the key light catching the glass */}
      <rect x="62" y="274" width="3.4" height="40" rx="1.7" fill={C.orange} opacity="0.3" />
      <rect x="159" y="274" width="3.4" height="38" rx="1.7" fill={C.orange} opacity="0.12" />

      {/* the mouth and the ink in it */}
      <ellipse cx="112" cy="268" rx="50" ry="10" fill={C.raise} />
      <ellipse cx="112" cy="269" rx="41" ry="7" fill={C.ink} />
      <ellipse cx="103" cy="268" rx="16" ry="2.8" fill={C.orange} opacity="0.25" />

      {/* the quill — the brand glyph, drawn as the object it describes.
          The first pass is a faint amber echo, offset a hair, so the
          feather reads as a rounded form rather than a single outline. */}
      <Quill transform="translate(74 189) rotate(-6) scale(3.4)" stroke={C.amber} opacity={0.22} />
      <Quill transform="translate(72 187) rotate(-6) scale(3.4)" opacity={0.95} />
    </g>

    {/* ── Warm sparkle, and a couple of drifting motes ── */}
    <circle className="ink-pulse" cx="428" cy="98" r="3" fill={C.orange} />
    <circle cx="470" cy="196" r="2.4" fill={C.amber} opacity="0.4" />
    <circle cx="292" cy="60" r="2" fill={C.amber} opacity="0.35" />
    <path
      d="M530 122 l0 11 M524.5 127.5 l11 0"
      stroke={C.amber}
      strokeWidth="2.2"
      strokeLinecap="round"
      opacity="0.4"
    />
  </svg>
);

export default LoginStillLife;
