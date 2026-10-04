import React from "react";
import { Box, Typography } from "@mui/material";
import {
  AutoAwesomeOutlined,
  EditNoteOutlined,
  EditOutlined,
  FactCheckOutlined,
  LightbulbOutlined,
  PersonOutlineOutlined,
  RocketLaunchOutlined,
  SearchOutlined,
} from "@mui/icons-material";
import { INK, Reveal } from "../ink";
import { AuthorTag, NodeChip } from "./shared";

/* ─────────────────────────────────────────────────────────────────────
   "AI shouldn't make authors invisible."

   The whole article, step by step, with each step labelled by who did it.
   This is the most literal section on the page and it is meant to be: the
   claim is that you can always tell where the machine was involved, so the
   section demonstrates that instead of asserting it.

   Every step carries its own word — "Human", "AI assisted" — as a pill, not
   only as a colour. The timeline runs horizontally with the steps
   alternating above and below the spine, and collapses to a plain vertical
   list on small screens, because alternating above/below is unreadable in a
   single narrow column.
   ───────────────────────────────────────────────────────────────────── */

const TRACE = [
  {
    key: "idea",
    label: "Idea",
    who: "human",
    icon: <LightbulbOutlined />,
    body: "The original thought, yours.",
  },
  {
    key: "draft",
    label: "Writer draft",
    who: "human",
    icon: <EditNoteOutlined />,
    body: "A first pass in your own words, before any tool sees it.",
  },
  {
    key: "suggestion",
    label: "AI suggestion",
    who: "ai",
    icon: <AutoAwesomeOutlined />,
    body: "An offered sentence or structure. Offered — never applied.",
  },
  {
    key: "edit",
    label: "Writer edit",
    who: "human",
    icon: <EditOutlined />,
    body: "You take what is useful and rewrite the rest.",
  },
  {
    key: "research",
    label: "Research",
    who: "human",
    icon: <SearchOutlined />,
    body: "You go and find the sources that back the claims.",
  },
  {
    key: "factcheck",
    label: "Fact check",
    who: "ai",
    icon: <FactCheckOutlined />,
    body: "Flags claims that still need a source. It cannot supply one.",
  },
  {
    key: "publish",
    label: "Publish",
    who: "human",
    icon: <RocketLaunchOutlined />,
    body: "Your name, on your work, at your moment.",
  },
];

const AuthorshipTimeline = () => (
  <Box className="ink-ab-trace">
    <Box component="ol" className="ink-ab-trace-steps">
      {/* The spine is a grid item, not an overlay: alternating above/below a
          centred line is a three-row grid (up / spine / down), and keeping the
          line inside the list is what lets the columns stay in step. It is an
          li because an <ol> may only contain li — role="presentation" plus
          aria-hidden keeps it out of the accessibility tree, where a
          decorative rule has no business being. */}
      <Box
        component="li"
        className="ink-ab-trace-spine"
        role="presentation"
        aria-hidden="true"
      >
        <Box className="ink-ab-trace-spine-line" />
        <Box className="ink-ab-trace-spine-marks">
          {TRACE.map((step) => (
            <Box key={step.key} component="span" className="ink-ab-trace-spine-dot" data-who={step.who} />
          ))}
        </Box>
      </Box>

      {TRACE.map((step, i) => (
        <Box
          component="li"
          key={step.key}
          className="ink-ab-trace-step"
          data-side={i % 2 === 0 ? "up" : "down"}
          /* Custom property, not grid-column: the phone layout collapses this
             to one column and must be able to win. */
          style={{ "--ab-col": i + 1 }}
        >
          <Reveal delay={Math.min(i, 6) * 0.05} y={14}>
            <Box className="ink-ab-trace-node" data-who={step.who}>
              <NodeChip size={38} active={step.who === "ai"}>
                {step.icon}
              </NodeChip>
              <Box component="span" className="ink-ab-trace-label">
                {step.label}
              </Box>
              <AuthorTag tone={step.who === "ai" ? "ai" : "human"} sx={{ mt: "0.4rem" }}>
                {step.who === "ai" ? <AutoAwesomeOutlined /> : <PersonOutlineOutlined />}
                {step.who === "ai" ? "AI assisted" : "Human"}
              </AuthorTag>
              <Typography
                component="p"
                sx={{ m: "0.5rem 0 0", fontSize: "0.82rem", lineHeight: 1.5, color: INK.text2 }}
              >
                {step.body}
              </Typography>
            </Box>
          </Reveal>
        </Box>
      ))}
    </Box>
  </Box>
);

export default AuthorshipTimeline;
