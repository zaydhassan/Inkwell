import React, { useRef } from "react";
import { Box, Typography } from "@mui/material";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { FONT_DISPLAY, INK, Reveal } from "../ink";
import { WritingDeskScene } from "../AboutIllustrations";

/* ─────────────────────────────────────────────────────────────────────
   "Built for people who have something to say." — the writer's journey.

   A vertical timeline whose spine is drawn by the reader's own scrolling:
   `scaleY` is bound to the section's progress through the viewport, so the
   line arrives at GROW at roughly the pace you read the steps. That is the
   one scroll-linked motion on the page and it is here because the section is
   about a process happening over time.

   Under `prefers-reduced-motion` the line is simply already drawn
   (`scaleY: 1`) — a timeline is not less legible for being complete.
   ───────────────────────────────────────────────────────────────────── */

const STEPS = [
  { key: "idea", n: "01", label: "Idea", body: "It starts as a note you keep coming back to." },
  { key: "draft", n: "02", label: "Draft", body: "A first version, written for yourself before anyone else." },
  {
    key: "assist",
    n: "03",
    label: "AI assist",
    body: "The assistant pushes back early, while changes are still cheap.",
  },
  {
    key: "research",
    n: "04",
    label: "Research",
    body: "Sources arrive next to the claim they are supporting.",
  },
  {
    key: "publish",
    n: "05",
    label: "Publish",
    body: "The piece goes out with your name on it.",
  },
  {
    key: "grow",
    n: "06",
    label: "Grow",
    body: "Readers arrive, reply, and follow the next one.",
  },
];

const WriterJourney = () => {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <Box className="ink-ab-journey" ref={ref}>
      <Box className="ink-ab-journey-main">
        {/* No step mark here: the section's own eyebrow already reads "For
            writers", and saying it twice in the same glance is noise. */}
        <Box component="ol" className="ink-ab-timeline">
          {/* The spine and its scroll-drawn fill. */}
          <Box className="ink-ab-timeline-spine" aria-hidden="true">
            <motion.div
              className="ink-ab-timeline-fill"
              style={{ scaleY: reduce ? 1 : scaleY, transformOrigin: "50% 0%" }}
            />
          </Box>

          {STEPS.map((step, i) => (
            <Box component="li" key={step.key} className="ink-ab-timeline-step">
              <Reveal delay={i * 0.05} y={18}>
                <Box className="ink-ab-timeline-row">
                  <Box className="ink-ab-timeline-mark" aria-hidden="true">
                    {step.n}
                  </Box>
                  <Box>
                    <Typography
                      component="h3"
                      sx={{
                        m: 0,
                        fontFamily: FONT_DISPLAY,
                        fontSize: "1rem",
                        fontWeight: 800,
                        letterSpacing: "-0.01em",
                        color: INK.text,
                      }}
                    >
                      {step.label}
                    </Typography>
                    <Typography
                      component="p"
                      sx={{ m: "0.35rem 0 0", fontSize: "0.9rem", lineHeight: 1.55, color: INK.text2 }}
                    >
                      {step.body}
                    </Typography>
                  </Box>
                </Box>
              </Reveal>
            </Box>
          ))}
        </Box>
      </Box>

      <Reveal className="ink-ab-journey-side" delay={0.12}>
        <Box className="ink-ab-stage">
          <WritingDeskScene />
        </Box>
      </Reveal>
    </Box>
  );
};

export default WriterJourney;
