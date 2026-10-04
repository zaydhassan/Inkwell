import React from "react";
import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ArrowForwardRounded } from "@mui/icons-material";
import { FONT_DISPLAY, INK, InkGhostButton, InkPrimaryButton, InkSurface, Reveal } from "../ink";

/* ─────────────────────────────────────────────────────────────────────
   The close.

   Centred panel, two buttons, and one slow warm glow behind it. The glow is
   the only animation, it is a single CSS keyframe on a blurred radial, and it
   is switched off for anyone who asked for less motion — by this point the
   reader has scrolled the whole argument and does not need the page pulsing
   at them.

   Routes are the ones the page already used: /register for a new writer,
   /explore to go and read. Nothing new is introduced here.
   ───────────────────────────────────────────────────────────────────── */

const ClosingCta = () => {
  const navigate = useNavigate();

  return (
    <Reveal className="ink-ab-cta" y={22}>
    <InkSurface variant="quiet" className="ink-ab-cta-panel">
      <Box className="ink-ab-cta-glow" aria-hidden="true" />

      <Typography
        component="span"
        sx={{
          display: "block",
          fontFamily: FONT_DISPLAY,
          fontSize: "0.62rem",
          fontWeight: 800,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          color: INK.orange,
        }}
      >
        Ready when you are
      </Typography>

      <Typography
        component="h2"
        sx={{
          m: "1rem 0 0",
          fontFamily: FONT_DISPLAY,
          fontWeight: 800,
          fontSize: "clamp(1.9rem, 4.4vw, 3rem)",
          lineHeight: 1.08,
          letterSpacing: "-0.035em",
          color: INK.text,
          textWrap: "balance",
        }}
      >
        Have an idea worth remembering?
      </Typography>

      <Typography
        component="p"
        sx={{
          m: "1rem 0 0",
          fontFamily: FONT_DISPLAY,
          fontSize: "clamp(1.15rem, 2.2vw, 1.6rem)",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: INK.orange,
        }}
      >
        Bring it to InkWell.
      </Typography>

      <Box className="ink-ab-cta-actions">
        <InkPrimaryButton
          size="large"
          onClick={() => navigate("/register")}
          endIcon={<ArrowForwardRounded />}
        >
          Start writing
        </InkPrimaryButton>
        <InkGhostButton
          size="large"
          onClick={() => navigate("/explore")}
          endIcon={<ArrowForwardRounded />}
        >
          Explore stories
        </InkGhostButton>
      </Box>
    </InkSurface>
  </Reveal>
  );
};

export default ClosingCta;
