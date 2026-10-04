import React from "react";
import { Box, Typography } from "@mui/material";
import {
  SplitscreenOutlined,
  VisibilityOffOutlined,
  VolumeUpOutlined,
} from "@mui/icons-material";
import { FONT_DISPLAY, INK, Reveal } from "../ink";

/* ─────────────────────────────────────────────────────────────────────
   "Writing online shouldn't feel like shouting into the void."

   Three cards, deliberately colourless. Every other composition on this page
   is warmed by the orange accent because it is describing something InkWell
   does; these three are describing what is wrong elsewhere, so they stay in
   the neutral greys. The section reads cool, the sections that answer it
   read warm — that contrast is the argument.

   These are claims about how publishing feels, not statistics about it. No
   numbers appear here because we have no measurement behind any of them.
   ───────────────────────────────────────────────────────────────────── */

const PROBLEMS = [
  {
    key: "noise",
    title: "The Noise",
    icon: <VolumeUpOutlined />,
    body: "Feeds reward whatever is loudest and fastest. Considered work competes for the same second of attention as something that took ten seconds to make.",
  },
  {
    key: "blackbox",
    title: "The Black Box",
    icon: <VisibilityOffOutlined />,
    body: "You publish, and then you guess. Nothing tells you whether the piece was read, where a reader stopped, or whether the argument landed.",
  },
  {
    key: "fragmentation",
    title: "The Fragmentation",
    icon: <SplitscreenOutlined />,
    body: "Notes in one app, drafts in another, sources in a third. The thinking is scattered long before it ever becomes a piece worth reading.",
  },
];

const ProblemLedger = () => (
  <Box className="ink-ab-problems">
    {PROBLEMS.map((problem, i) => (
      <Reveal key={problem.key} delay={i * 0.09} className="ink-ab-problem-reveal">
        <Box className="ink-ab-problem">
          <Box className="ink-ab-problem-top">
            <Box className="ink-ab-problem-icon" aria-hidden="true">
              {problem.icon}
            </Box>
            <Box component="span" className="ink-ab-problem-num" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </Box>
          </Box>
          <Typography
            component="h3"
            sx={{
              m: 0,
              fontFamily: FONT_DISPLAY,
              fontSize: "1.06rem",
              fontWeight: 800,
              letterSpacing: "-0.01em",
              color: INK.text,
            }}
          >
            {problem.title}
          </Typography>
          <Typography
            component="p"
            sx={{ m: "0.6rem 0 0", fontSize: "0.92rem", lineHeight: 1.62, color: INK.text2 }}
          >
            {problem.body}
          </Typography>
        </Box>
      </Reveal>
    ))}
  </Box>
);

export default ProblemLedger;
