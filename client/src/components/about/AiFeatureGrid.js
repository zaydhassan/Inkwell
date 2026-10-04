import React from "react";
import { Box, Typography } from "@mui/material";
import {
  AutoAwesomeOutlined,
  ContentCopyOutlined,
  FactCheckOutlined,
  InsightsOutlined,
  PsychologyOutlined,
  TravelExploreOutlined,
} from "@mui/icons-material";
import { FONT_DISPLAY, INK, Reveal } from "../ink";
import { Mock } from "./Mocks";

/* ─────────────────────────────────────────────────────────────────────
   The six AI capabilities, as cards.

   Each card carries a small mock of what the feature actually produces. At
   rest the mock is dim so the card reads as a card; on hover or focus-within
   it comes up to full strength, which is the "short demonstration" the brief
   asks for without a video, a GIF or a network request. The lift is a plain
   CSS transform on the card — the card is not a motion element (its Reveal
   wrapper is), so the stylesheet keeps ownership of its hover state and
   there is no inline transform to fight with.
   ───────────────────────────────────────────────────────────────────── */

const FEATURES = [
  {
    key: "copilot",
    title: "AI Writing Copilot",
    icon: <AutoAwesomeOutlined />,
    body: "Drafts with you rather than for you. It continues a thought, tightens a sentence, and suggests where the next paragraph should go while you keep the pen.",
    demo: "lines",
  },
  {
    key: "challenge",
    title: "Challenge My Idea",
    icon: <PsychologyOutlined />,
    body: "Ask it to argue back. It finds the weakest joint in your thesis and presses on it before a reader does.",
    demo: "challenge",
  },
  {
    key: "research",
    title: "Research Assistant",
    icon: <TravelExploreOutlined />,
    body: "Summarise a source, extract the counter-argument, and keep the citations beside the draft where you will actually use them.",
    demo: "sources",
  },
  {
    key: "factcheck",
    title: "Fact Check",
    icon: <FactCheckOutlined />,
    body: "Flags the claims that need a source, so you can go and find one before publishing instead of after.",
    demo: "checks",
  },
  {
    key: "insights",
    title: "AI Article Insights",
    icon: <InsightsOutlined />,
    body: "A plain reading of how the piece is built — its structure, its pacing, and the places where attention slips.",
    demo: "annotate",
  },
  {
    key: "repurpose",
    title: "Repurpose",
    icon: <ContentCopyOutlined />,
    body: "Turn one finished piece into a shorter summary or a version reshaped for a different surface, without rewriting it from scratch.",
    demo: "fan",
  },
];

const AiFeatureGrid = () => (
  <Box className="ink-ab-features">
    {FEATURES.map((feature, i) => (
      <Reveal key={feature.key} delay={Math.min(i, 5) * 0.06}>
        {/* No tabIndex: the card has no action of its own, and the mock it
            reveals is decorative — adding six empty stops to the tab order
            would be noise for a keyboard reader. */}
        <Box component="article" className="ink-ab-feature">
          <Box className="ink-ab-feature-head">
            <Box className="ink-ab-feature-icon" aria-hidden="true">
              {feature.icon}
            </Box>
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
              {feature.title}
            </Typography>
          </Box>
          <Typography
            component="p"
            sx={{ m: "0.6rem 0 0", fontSize: "0.9rem", lineHeight: 1.6, color: INK.text2 }}
          >
            {feature.body}
          </Typography>
          <Box className="ink-ab-feature-demo" aria-hidden="true">
            <Mock kind={feature.demo} />
          </Box>
        </Box>
      </Reveal>
    ))}
  </Box>
);

export default AiFeatureGrid;
