import React from "react";
import { Box, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import { FONT_DISPLAY, INK, Reveal } from "../ink";
import { PhilosophyScene } from "../AboutIllustrations";
import { useParallax } from "./shared";

/* ─────────────────────────────────────────────────────────────────────
   "The future of publishing should feel more human."

   The one cinematic beat on the page: no cards, no diagram, no chips — four
   sentences on a wide dark field, revealed one after another. After eleven
   sections of diagrams the eye needs somewhere quiet to land, and the
   argument needs one place where it is stated plainly rather than drawn.

   The illustration is the page's original PhilosophyScene, kept and given a
   slow parallax drift (killed under reduced motion). Decorative, so it is
   aria-hidden — the sentences next to it carry the meaning.
   ───────────────────────────────────────────────────────────────────── */

const LINES = [
  { actor: "AI", rest: "handles the friction" },
  { actor: "Humans", rest: "provide the perspective" },
  { actor: "Readers", rest: "provide the curiosity" },
  { actor: "Community", rest: "provides the connection" },
];

const FutureVision = () => {
  const reduce = useReducedMotion();
  const [sceneRef, sceneY] = useParallax(26);

  return (
    <Box className="ink-ab-future">
      <Box className="ink-ab-future-copy">
        <Box
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
          What comes next
        </Box>

        <Typography
          component="h2"
          sx={{
            m: "1.2rem 0 0",
            fontFamily: FONT_DISPLAY,
            fontWeight: 800,
            fontSize: "clamp(2rem, 5vw, 3.4rem)",
            lineHeight: 1.06,
            letterSpacing: "-0.035em",
            color: INK.text,
            textWrap: "balance",
            maxWidth: "18ch",
          }}
        >
          The future of publishing should feel more human.
        </Typography>

        <Box component="ul" className="ink-ab-future-lines">
          {LINES.map((line, i) => (
            <Box component="li" key={line.actor} className="ink-ab-future-line">
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                <Typography
                  component="span"
                  sx={{
                    display: "block",
                    fontFamily: FONT_DISPLAY,
                    fontWeight: 800,
                    fontSize: "clamp(1.15rem, 2.4vw, 1.75rem)",
                    lineHeight: 1.3,
                    letterSpacing: "-0.02em",
                    color: INK.text,
                  }}
                >
                  <Box component="span" sx={{ color: INK.orange }}>
                    {line.actor}
                  </Box>{" "}
                  {line.rest}
                </Typography>
              </motion.div>
            </Box>
          ))}
        </Box>
      </Box>

      <Box className="ink-ab-future-scene" ref={sceneRef} aria-hidden="true">
        <motion.div style={{ y: sceneY }}>
          <Box className="ink-ab-stage">
            <PhilosophyScene />
          </Box>
        </motion.div>
      </Box>
    </Box>
  );
};

export default FutureVision;
