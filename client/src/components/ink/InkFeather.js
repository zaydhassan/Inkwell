import React from "react";
import { Box } from "@mui/material";

/* ─────────────────────────────────────────────────────────────────────
   InkWell feather motif + flowing lines.

   The decorative orange feather used by the Home newsletter panel (and
   available to any other CTA). The quill path is the same one the brand
   mark uses in BrandLogo, so the motif is the brand's own glyph rather
   than generic clip-art.

   Entirely decorative: aria-hidden, pointer-events:none, and drawn in
   currentColor so it inherits whatever orange the caller sets.
   ───────────────────────────────────────────────────────────────────── */

const QUILL_PATH = "M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z";

export const FeatherGlyph = ({ size = 72, strokeWidth = 1.4, sx }) => (
  <Box
    component="svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    sx={{ width: size, height: size, ...sx }}
  >
    <path d={QUILL_PATH} />
    <line x1="16" y1="8" x2="2" y2="22" />
    <line x1="17.5" y1="15" x2="9" y2="15" />
  </Box>
);

/* The flowing orange curves. Three stacked paths with a soft gradient
   stroke; the dash offset drifts slowly so the lines feel alive without
   anything actually moving across the panel. */
const FlowLines = ({ className }) => (
  <Box
    component="svg"
    className={className}
    viewBox="0 0 600 400"
    fill="none"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
  >
    <defs>
      <linearGradient id="ink-flow" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FF6A00" stopOpacity="0" />
        <stop offset="45%" stopColor="#FF6A00" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
      </linearGradient>
    </defs>
    {[
      "M-40 300 C 120 250, 200 150, 360 130 S 560 90, 660 40",
      "M-40 350 C 140 320, 240 210, 400 190 S 580 150, 680 110",
      "M-40 250 C 100 210, 220 120, 380 90 S 540 40, 640 -10",
    ].map((d, i) => (
      <path
        key={i}
        d={d}
        stroke="url(#ink-flow)"
        strokeWidth={1.2}
        className="ink-flow-line"
        style={{ animationDelay: `${i * -3.5}s` }}
      />
    ))}
  </Box>
);

/* The composed motif block: glyph over flowing lines. Sits inside a
   relatively-positioned parent. */
const InkFeather = ({ size = 76, className = "", sx }) => (
  <Box className={className} aria-hidden="true" sx={{ position: "relative", ...sx }}>
    <FlowLines className="ink-flow-lines" />
    <Box
      sx={{
        position: "relative",
        zIndex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size * 1.5,
        height: size * 1.5,
        borderRadius: "50%",
        color: "var(--ink-orange)",
        background: "radial-gradient(circle, rgba(255,106,0,0.16), transparent 68%)",
        border: "1px solid rgba(255,106,0,0.22)",
      }}
    >
      <FeatherGlyph size={size} />
    </Box>
  </Box>
);

export default InkFeather;
