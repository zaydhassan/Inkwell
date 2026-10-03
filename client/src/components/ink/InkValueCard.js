import React from "react";
import { Box, Typography } from "@mui/material";
import { InkSurface } from "./InkSurface";
import { FONT_DISPLAY, INK } from "./tokens";

/* ─────────────────────────────────────────────────────────────────────
   InkWell value / feature card.

   The brief's "Do NOT make every section a card" rule means the card is
   used in exactly two places, both structured: About's six principles and
   Home's three hero capabilities. They share this component so the card
   language (radius, border, icon chip, hover lift) is identical, while
   `compact` changes only the density — not the styling.

   `index` renders the oversized ghost number behind the content. It is
   decorative (`aria-hidden`) and the real order is conveyed by the DOM
   order of the headings, so screen readers get a clean list.
   ───────────────────────────────────────────────────────────────────── */

const InkValueCard = ({ icon, title, body, index, compact = false, sx }) => (
  <InkSurface
    hover
    sx={{
      p: compact ? { xs: 2.5, md: 3 } : { xs: 3, md: 3.5 },
      height: "100%",
      display: "flex",
      flexDirection: "column",
      ...sx,
    }}
  >
    {index !== undefined && (
      <Box className="ink-bignum" aria-hidden="true">
        {String(index).padStart(2, "0")}
      </Box>
    )}

    <Box
      className="ink-value-icon"
      aria-hidden="true"
      sx={{
        position: "relative",
        zIndex: 1,
        width: compact ? 42 : 46,
        height: compact ? 42 : 46,
        mb: compact ? 1.75 : 2,
        "& svg": { fontSize: compact ? 21 : 23 },
      }}
    >
      {icon}
    </Box>

    <Typography
      component="h3"
      sx={{
        position: "relative",
        zIndex: 1,
        fontFamily: FONT_DISPLAY,
        fontWeight: 800,
        fontSize: compact ? "1.02rem" : "1.14rem",
        letterSpacing: "-0.015em",
        lineHeight: 1.3,
        color: INK.text,
      }}
    >
      {title}
    </Typography>

    <Typography
      sx={{
        position: "relative",
        zIndex: 1,
        mt: 1,
        fontSize: compact ? "0.86rem" : "0.9rem",
        lineHeight: 1.65,
        color: INK.text2,
      }}
    >
      {body}
    </Typography>
  </InkSurface>
);

export default InkValueCard;
