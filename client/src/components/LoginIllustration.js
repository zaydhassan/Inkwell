import React from "react";
import { Box } from "@mui/material";
import { motion } from "framer-motion";

/* ─────────────────────────────────────────────────────────────────────
   Original InkWell editorial illustration — "the writing desk".

   A creator at a warm, minimal workspace: laptop, notebook, coffee,
   plant, books — with a quill and a floating idea-card drifting above.
   Pure inline vector (no image assets, no network requests), drawn in
   InkWell's warm palette so it melts into the cream background. The
   wrapper applies a soft radial mask so the composition fades at the
   edges instead of sitting in a hard box.
   ───────────────────────────────────────────────────────────────────── */

// Warm palette — matches the login page's local accent system.
const C = {
  blob: "#FFF3E6",
  cream: "#FFFBF5",
  sand: "#F2E7DA",
  line: "#E4D5C3",
  deep: "#C2410C",
  orange: "#EA580C",
  tangerine: "#FB923C",
  pale: "#FFE3C7",
  charcoal: "#2E2723",
  slate: "#6B5D52",
  sage: "#9CAF88",
  skin: "#F3C9A6",
  hair: "#4A382E",
};

const Quill = ({ x, y, rotate = 0, scale = 1, opacity = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`} opacity={opacity}>
    <path
      d="M0 0 C 10 -26, 34 -40, 50 -34 C 46 -18, 32 -4, 12 4 C 6 6, 2 4, 0 0 Z"
      fill={C.orange}
    />
    <path d="M4 -2 C 18 -20, 32 -30, 44 -32" stroke={C.cream} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    <path d="M0 0 L -8 10" stroke={C.charcoal} strokeWidth="2.4" strokeLinecap="round" />
  </g>
);

const LoginIllustration = () => (
  <motion.div
    aria-hidden="true"
    animate={{ y: [0, -9, 0] }}
    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
    style={{ width: "100%" }}
  >
    <Box
      component="svg"
      viewBox="0 0 560 420"
      sx={{
        width: "100%",
        height: "auto",
        display: "block",
        maskImage: "radial-gradient(75% 75% at 50% 48%, black 52%, transparent 98%)",
        WebkitMaskImage: "radial-gradient(75% 75% at 50% 48%, black 52%, transparent 98%)",
      }}
    >
      {/* Soft warm blobs — the "air" of the scene */}
      <ellipse cx="280" cy="235" rx="248" ry="176" fill={C.blob} />
      <ellipse cx="140" cy="130" rx="120" ry="90" fill="#FFEEDD" opacity="0.75" />

      {/* Ground shadow */}
      <ellipse cx="285" cy="392" rx="185" ry="13" fill={C.sand} />

      {/* ── Books stack (left) ── */}
      <rect x="128" y="298" width="78" height="13" rx="3" fill={C.orange} />
      <rect x="134" y="285" width="66" height="13" rx="3" fill={C.pale} />
      <rect x="138" y="272" width="56" height="13" rx="3" fill={C.charcoal} />
      <rect x="188" y="300" width="6" height="9" rx="2" fill={C.cream} opacity="0.6" />

      {/* ── Plant (left of books) ── */}
      <path d="M92 292 h30 l-4 24 h-22 z" fill={C.deep} opacity="0.85" />
      <path d="M107 292 C 96 276, 96 262, 106 252 C 112 262, 112 278, 107 292 Z" fill={C.sage} />
      <path d="M107 292 C 118 278, 122 268, 118 256 C 108 264, 104 280, 107 292 Z" fill={C.sage} opacity="0.75" />
      <path d="M106 292 C 104 280, 100 274, 92 270 C 94 282, 100 290, 106 292 Z" fill={C.sage} opacity="0.6" />

      {/* ── Desk ── */}
      <rect x="64" y="314" width="432" height="13" rx="6.5" fill={C.sand} />
      <rect x="92" y="327" width="9" height="60" rx="4" fill={C.line} />
      <rect x="462" y="327" width="9" height="60" rx="4" fill={C.sand} />

      {/* ── Creator ── */}
      {/* torso / sweater */}
      <path d="M254 314 c 2 -44, 22 -66, 50 -66 c 28 0, 48 22, 50 66 z" fill={C.tangerine} />
      {/* neck */}
      <rect x="298" y="240" width="14" height="12" rx="5" fill={C.skin} />
      {/* head */}
      <circle cx="305" cy="224" r="19" fill={C.skin} />
      {/* hair bun + hairline */}
      <circle cx="322" cy="212" r="8" fill={C.hair} />
      <path d="M286 222 a19 19 0 0 1 38 -6 c -8 -8 -28 -8 -38 6 Z" fill={C.hair} />

      {/* ── Laptop ── */}
      <rect x="252" y="240" width="98" height="70" rx="8" fill={C.charcoal} />
      <rect x="260" y="248" width="82" height="54" rx="4" fill={C.pale} />
      {/* story lines on the screen */}
      <rect x="270" y="258" width="52" height="5" rx="2.5" fill={C.orange} />
      <rect x="270" y="270" width="62" height="4" rx="2" fill={C.line} />
      <rect x="270" y="280" width="44" height="4" rx="2" fill={C.line} />
      <rect x="270" y="290" width="56" height="4" rx="2" fill={C.line} />
      {/* base */}
      <path d="M244 310 h114 l -9 8 h -96 z" fill="#4A4038" />

      {/* ── Notebook (right of laptop) ── */}
      <g transform="rotate(6 380 296)">
        <rect x="352" y="280" width="52" height="34" rx="4" fill={C.cream} stroke={C.line} strokeWidth="2" />
        <line x1="360" y1="290" x2="396" y2="290" stroke={C.line} strokeWidth="3" strokeLinecap="round" />
        <line x1="360" y1="299" x2="390" y2="299" stroke={C.line} strokeWidth="3" strokeLinecap="round" />
        <rect x="348" y="276" width="6" height="42" rx="3" fill={C.orange} />
      </g>

      {/* ── Coffee (far right) ── */}
      <rect x="428" y="286" width="26" height="28" rx="6" fill={C.orange} />
      <path d="M454 292 a 8 8 0 1 1 0 16" stroke={C.orange} strokeWidth="4.5" fill="none" />
      <path d="M436 278 c 2 -5 -2 -7 0 -12" stroke={C.line} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M444 280 c 2 -5 -2 -7 0 -12" stroke={C.line} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />

      {/* ── Floating idea card (top left) ── */}
      <g transform="rotate(-7 150 120)">
        <rect x="118" y="84" width="66" height="82" rx="8" fill={C.cream} stroke={C.line} strokeWidth="2" />
        <rect x="128" y="98" width="34" height="5" rx="2.5" fill={C.tangerine} />
        <rect x="128" y="112" width="44" height="4" rx="2" fill={C.sand} />
        <rect x="128" y="122" width="40" height="4" rx="2" fill={C.sand} />
        <rect x="128" y="132" width="46" height="4" rx="2" fill={C.sand} />
        <rect x="128" y="148" width="20" height="8" rx="4" fill="rgba(234,88,12,0.16)" />
      </g>

      {/* ── Quills drifting through the scene ── */}
      <Quill x={392} y={128} rotate={18} scale={1} />
      <Quill x={196} y={62} rotate={-24} scale={0.55} opacity={0.5} />

      {/* ── Sparkles ── */}
      <circle cx="248" cy="96" r="3" fill={C.tangerine} opacity="0.6" />
      <circle cx="470" cy="196" r="2.5" fill={C.tangerine} opacity="0.45" />
      <circle cx="88" cy="200" r="2.5" fill={C.tangerine} opacity="0.5" />
      <path d="M508 118 l0 10 M503 123 l10 0" stroke={C.tangerine} strokeWidth="2.4" strokeLinecap="round" opacity="0.55" />
      <path d="M72 300 l0 8 M68 304 l8 0" stroke={C.tangerine} strokeWidth="2.2" strokeLinecap="round" opacity="0.4" />
    </Box>
  </motion.div>
);

export default LoginIllustration;