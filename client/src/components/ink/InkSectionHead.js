import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { FONT_DISPLAY, INK } from "./tokens";

/* ─────────────────────────────────────────────────────────────────────
   InkWell section furniture: the orange eyebrow, the display heading with
   its optional orange highlight, and the section header that pairs them.

   Used by both editorial pages so "OUR STORY" on About and "FRESH INK" on
   Home are typographically identical, not two hand-matched treatments.
   ───────────────────────────────────────────────────────────────────── */

/* The small uppercase orange overline above a section heading. */
export const InkEyebrow = ({ children, align = "left", sx }) => (
  <Stack
    direction="row"
    spacing={1.25}
    alignItems="center"
    justifyContent={align === "center" ? "center" : "flex-start"}
    sx={sx}
  >
    <Box sx={{ width: 24, height: 2, borderRadius: 1, bgcolor: INK.orange, flexShrink: 0 }} />
    <Typography
      component="span"
      sx={{
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: INK.orange,
      }}
    >
      {children}
    </Typography>
  </Stack>
);

/* The orange word inside a headline — "curious minds.", "your time.",
   "attention.". One component, so the highlight is identical everywhere. */
export const InkHighlight = ({ children }) => (
  <Box component="span" sx={{ color: INK.orange }}>
    {children}
  </Box>
);

/* Display heading. One size ladder shared by both pages: the hero uses
   `size="hero"`, section headings use the default. `size="compact"` is for
   denser product pages (Profile), where the marketing scale reads too loud.
   `component` lets a page mount it as an <h1> for the one true page heading. */
export const InkHeading = ({ children, size = "section", align = "left", component = "h2", sx }) => (
  <Typography
    component={component}
    sx={{
      fontFamily: FONT_DISPLAY,
      fontWeight: 800,
      letterSpacing: "-0.025em",
      lineHeight: 1.12,
      color: INK.text,
      textAlign: align,
      ...(size === "hero"
        ? {
            fontSize: { xs: "2.5rem", sm: "3.1rem", md: "clamp(2.8rem, 4.4vw, 4rem)" },
            lineHeight: 1.06,
            letterSpacing: "-0.03em",
          }
        : size === "compact"
        ? { fontSize: { xs: "1.45rem", md: "1.7rem" }, lineHeight: 1.2 }
        : { fontSize: { xs: "1.85rem", md: "2.4rem" } }),
      ...sx,
    }}
  >
    {children}
  </Typography>
);

/* The full section header: eyebrow → heading → supporting line. */
export const InkSectionHead = ({ eyebrow, title, subtitle, align = "left", size = "section", sx }) => (
  <Box sx={{ textAlign: align, ...sx }}>
    {eyebrow && <InkEyebrow align={align}>{eyebrow}</InkEyebrow>}
    <InkHeading align={align} size={size} sx={{ mt: 2 }}>
      {title}
    </InkHeading>
    {subtitle && (
      <Typography
        sx={{
          mt: 1.5,
          fontSize: "1rem",
          lineHeight: 1.7,
          color: INK.text2,
          maxWidth: 620,
          mx: align === "center" ? "auto" : 0,
        }}
      >
        {subtitle}
      </Typography>
    )}
  </Box>
);

export default InkSectionHead;
