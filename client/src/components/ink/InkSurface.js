import React from "react";
import { Box } from "@mui/material";
import { INK } from "./tokens";

/* ─────────────────────────────────────────────────────────────────────
   InkWell card + floating-card primitives.

   `variant`:
     "card"  — the default #1B1917 panel
     "hi"    — the elevated #211E1A panel
     "quiet" — the warm vertical gradient used by the stats band

   This is the page's ONE card primitive. Value cards, feature cards, quote
   cards and CTA panels are all this component with `hover` and `sx`
   variations, which is what keeps the card language identical across Home
   and About.
   ───────────────────────────────────────────────────────────────────── */

const VARIANTS = {
  card: "",
  hi: "ink-surface-hi",
  quiet: "ink-surface-quiet",
};

export const InkSurface = ({ children, hover = false, variant = "card", className = "", sx }) => (
  <Box
    className={`ink-surface ${VARIANTS[variant] || ""} ${hover ? "ink-value-card" : ""} ${className}`.trim()}
    sx={sx}
  >
    {children}
  </Box>
);

/* A translucent card that floats over a hero stage. Positioning is left to
   the caller so each card can find its own corner at each breakpoint.
   `float` picks one of three offset bob rhythms. */
export const InkFloatingCard = ({ children, float, className = "", sx }) => (
  <Box
    className={`ink-float-card${float ? ` ${float}` : ""} ${className}`.trim()}
    sx={{ position: "absolute", zIndex: 2, ...sx }}
  >
    {children}
  </Box>
);

/* ── Avatar group ────────────────────────────────────────────────────
   Overlapping initials discs. Deliberately image-free: nothing is fetched
   and no real person is depicted — which is also why the About page can
   show a "global community" without a single portrait. */
export const InkAvatarGroup = ({ members = [], size = 34, sx }) => (
  <Box sx={{ display: "flex", alignItems: "center", ...sx }}>
    {members.map((m, i) => (
      <Box
        key={`${m.initials}-${i}`}
        aria-hidden="true"
        sx={{
          width: size,
          height: size,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: m.bg,
          color: "#F5F1EA",
          fontSize: size * 0.34,
          fontWeight: 700,
          letterSpacing: "0.02em",
          border: `2px solid ${INK.card}`,
          ml: i === 0 ? 0 : `${-size * 0.32}px`,
          zIndex: members.length - i,
          position: "relative",
        }}
      >
        {m.initials}
      </Box>
    ))}
  </Box>
);

export default InkSurface;
