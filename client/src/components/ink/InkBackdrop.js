import React from "react";
import { Box } from "@mui/material";

/* ─────────────────────────────────────────────────────────────────────
   InkWell ambient backdrop.

   The shared background system both editorial pages mount as the first
   child of their root: a warm radial atmosphere, an extremely subtle
   hairline grid, and a faint film grain. Optionally adds two slow-drifting
   glow blobs for the hero.

   All of it is decoration: z-index 0 under the page's z-index 1 content
   layer, and pointer-events:none, so it can never intercept a click or sit
   on top of text.
   ───────────────────────────────────────────────────────────────────── */

const InkBackdrop = ({ hero = false, drift = false, sx }) => (
  <Box className="ink-backdrop" aria-hidden="true" sx={sx}>
    {/* Optional ambient glow blobs — slow counter-drift, blurred wide. */}
    {drift && (
      <>
        <Box
          className="ink-drift-a"
          sx={{
            position: "absolute",
            top: "-14%",
            right: "-6%",
            width: { xs: 320, md: 520 },
            height: { xs: 320, md: 520 },
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,106,0,0.16), transparent 68%)",
            filter: "blur(60px)",
          }}
        />
        <Box
          className="ink-drift-b"
          sx={{
            position: "absolute",
            bottom: "-16%",
            left: "-8%",
            width: { xs: 280, md: 460 },
            height: { xs: 280, md: 460 },
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(249,115,22,0.12), transparent 70%)",
            filter: "blur(64px)",
          }}
        />
      </>
    )}

    {/* Hairline grid — tighter and lower-contrast behind the hero copy. */}
    <Box className={`ink-grid${hero ? " ink-grid-hero" : ""}`} />
    {/* Film grain. */}
    <Box className="ink-noise" />
  </Box>
);

export default InkBackdrop;
