import React from "react";

/* ─────────────────────────────────────────────────────────────────────
   The Rewards hero illustration: a glowing gift box floating in the dark,
   with the ambient field it sits in.

   Drawn here rather than fetched — no image file, no stock art, no remote
   dependency. The whole thing is `aria-hidden`: the points card and the
   reward list carry every real figure, so nothing here is announced.

   The canvas is deliberately WIDE (560×380, ratio ~1.47) rather than the
   near-square box it started as. The hero's height budget is tight, and a
   square drawing that fills a 45% column is what made the old hero tower
   over its copy. At this ratio the same `height` yields a wider, shorter
   illustration that sits inside the hero instead of dictating it.

   Motion is applied by the stylesheet to `<g>` wrappers, never to an element
   that also carries a `transform` ATTRIBUTE — a CSS transform replaces the
   attribute outright and would silently throw the placement away. So each
   chip and ring is an outer `<g transform="translate(...)">` for position
   around an inner `<g class="ink-rw-…">` that animates in its own local
   space (rotating about its own centre via `transform-box: fill-box`, not
   the viewBox origin).
   ───────────────────────────────────────────────────────────────────── */

/* One chip: a dark rounded tile with a gold hairline and a gold glyph.
   `glyph` draws in local coordinates around (0, 0). */
const Chip = ({ x, y, float, children }) => (
  <g transform={`translate(${x} ${y})`}>
    <g className={`ink-rw-chip ink-rw-chip-${float}`}>
      <rect
        x="-30"
        y="-30"
        width="60"
        height="60"
        rx="18"
        fill="url(#rw-chip-bg)"
        stroke="rgba(245,158,11,0.34)"
        strokeWidth="1.5"
      />
      <rect x="-30" y="-30" width="60" height="60" rx="18" fill="url(#rw-chip-sheen)" />
      {children}
    </g>
  </g>
);

const RewardGiftVisual = () => (
  <svg
    className="ink-rw-gift-svg"
    viewBox="0 0 560 380"
    role="presentation"
    focusable="false"
  >
    <defs>
      <linearGradient id="rw-box" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stopColor="#FFE3B0" />
        <stop offset="42%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#A9660A" />
      </linearGradient>
      <linearGradient id="rw-lid" x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0%" stopColor="#FFF0D2" />
        <stop offset="52%" stopColor="#F7B740" />
        <stop offset="100%" stopColor="#C2760F" />
      </linearGradient>
      <linearGradient id="rw-ribbon" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0%" stopColor="#FF9A4D" />
        <stop offset="55%" stopColor="#FF6A00" />
        <stop offset="100%" stopColor="#B93E05" />
      </linearGradient>
      <linearGradient id="rw-sheen" x1="0" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
        <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.06" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="rw-chip-bg" x1="0" y1="0" x2="0.7" y2="1">
        <stop offset="0%" stopColor="#242019" />
        <stop offset="100%" stopColor="#15120E" />
      </linearGradient>
      <linearGradient id="rw-chip-sheen" x1="0" y1="0" x2="0.9" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>
      <radialGradient id="rw-glow" cx="50%" cy="46%" r="54%">
        <stop offset="0%" stopColor="rgba(255,140,40,0.34)" />
        <stop offset="58%" stopColor="rgba(255,120,20,0.1)" />
        <stop offset="100%" stopColor="rgba(255,106,0,0)" />
      </radialGradient>
      <radialGradient id="rw-floor" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(255,150,40,0.26)" />
        <stop offset="100%" stopColor="rgba(255,150,40,0)" />
      </radialGradient>
    </defs>

    {/* Ambient glow, then the pool of light the box sits in. */}
    <circle className="ink-rw-glow" cx="280" cy="184" r="204" fill="url(#rw-glow)" />
    <ellipse cx="280" cy="322" rx="168" ry="28" fill="url(#rw-floor)" />

    {/* Spark field. */}
    {[
      [52, 168, 1.8, 0.5], [118, 74, 1.4, 0.4], [186, 44, 2.1, 0.55],
      [292, 54, 1.5, 0.4], [382, 66, 1.9, 0.5], [508, 182, 1.4, 0.35],
      [452, 296, 1.7, 0.45], [352, 346, 1.3, 0.35], [168, 340, 1.8, 0.45],
      [74, 262, 1.5, 0.4], [280, 26, 1.6, 0.42], [524, 120, 1.2, 0.3],
    ].map(([cx, cy, r, o], i) => (
      <circle
        key={i}
        className="ink-rw-particle"
        cx={cx}
        cy={cy}
        r={r}
        fill="#FFD8A3"
        opacity={o}
        style={{ animationDelay: `${(i % 5) * 0.7}s` }}
      />
    ))}

    {/* Orbital rings — two thin ellipses at different tilts, counter-rotating. */}
    <g transform="translate(280 196)">
      <g className="ink-rw-ring ink-rw-ring-a">
        <ellipse rx="214" ry="60" fill="none" stroke="rgba(255,106,0,0.3)" strokeWidth="1.6" />
      </g>
      <g className="ink-rw-ring ink-rw-ring-b">
        <ellipse rx="186" ry="48" fill="none" stroke="rgba(245,158,11,0.2)" strokeWidth="1.3" />
      </g>
    </g>

    {/* The gift, scaled well past its drawn size so it reads as the hero's
        subject rather than one element among the chips.

        The scale CANNOT ride on `<g class="ink-rw-gift">`: that group is the
        one the stylesheet animates with `translateY`, and a CSS transform
        replaces the element's `transform` attribute outright — putting the
        scale there would silently drop it. So the placement lives on an outer
        attribute-only group and the animated group stays attribute-free
        inside it.

        The three-step translate wraps the scale about the box's own centre
        (280, 248) instead of the viewBox origin, which would fling it off the
        canvas. */}
    <g transform="translate(280 248) scale(1.45) translate(-280 -248)">
      <g className="ink-rw-gift">
        {/* Bow, behind the lid. */}
        <path d="M280 190C263 176 247 182 254 196c4 8 17 4 26-6z" fill="url(#rw-ribbon)" />
        <path d="M280 190c17-14 33-8 26 6-4 8-17 4-26-6z" fill="url(#rw-ribbon)" />
        <circle cx="280" cy="189" r="6.5" fill="#FF8A3D" />

        {/* Body, ribbon, lid, then the sheen over both. */}
        <rect x="226" y="212" width="108" height="94" rx="9" fill="url(#rw-box)" />
        <rect x="269" y="212" width="22" height="94" fill="url(#rw-ribbon)" />
        <rect x="216" y="186" width="128" height="34" rx="10" fill="url(#rw-lid)" />
        <rect x="269" y="186" width="22" height="34" fill="url(#rw-ribbon)" />
        {/* The sheen goes on last so its own hairline outline sits on top of
            everything — a warm dark edge is what separates the lid from the
            body and stops the box reading as one soft blob. */}
        <rect x="226" y="212" width="108" height="94" rx="9" fill="url(#rw-sheen)" stroke="rgba(146,82,8,0.42)" strokeWidth="1.2" />
        <rect x="216" y="186" width="128" height="34" rx="10" fill="url(#rw-sheen)" stroke="rgba(146,82,8,0.42)" strokeWidth="1.2" />
      </g>
    </g>

    {/* Coupon, reading and achievement chips around the box. */}
    <Chip x={92} y={128} float="a">
      <circle cx="-7.5" cy="-7.5" r="4.6" fill="none" stroke="#F59E0B" strokeWidth="2.6" />
      <circle cx="7.5" cy="7.5" r="4.6" fill="none" stroke="#F59E0B" strokeWidth="2.6" />
      <path d="M9 -9L-9 9" stroke="#F59E0B" strokeWidth="2.6" strokeLinecap="round" />
    </Chip>

    <Chip x={470} y={138} float="b">
      <path
        d="M-12 -6q6-4.5 12 0 6-4.5 12 0v14q-6-4.5-12 0-6-4.5-12 0z"
        fill="none"
        stroke="#F59E0B"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path d="M0 -5.5v13" stroke="#F59E0B" strokeWidth="2.4" strokeLinecap="round" />
    </Chip>

    <Chip x={128} y={306} float="c">
      <path
        d="M-12 6l2.6-12 5.6 6.4L0-8l3.8 8.4L9.4-6 12 6z"
        fill="none"
        stroke="#F59E0B"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path d="M-12 9h24" stroke="#F59E0B" strokeWidth="2.4" strokeLinecap="round" />
    </Chip>
  </svg>
);

export default RewardGiftVisual;
