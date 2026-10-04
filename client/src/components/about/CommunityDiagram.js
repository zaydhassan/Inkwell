import React from "react";
import { Box, Typography } from "@mui/material";
import {
  AutoStoriesOutlined,
  AutoAwesomeOutlined,
  EditNoteOutlined,
  ForumOutlined,
  GroupsOutlined,
  PersonOutlineOutlined,
  SearchOutlined,
  ReplayOutlined,
} from "@mui/icons-material";
import { FONT_DISPLAY, INK, Reveal } from "../ink";
import { NodeChip, StepMark } from "./shared";

/* ─────────────────────────────────────────────────────────────────────
   The ecosystem, and the loop that runs through it.

   Two diagrams, for one reason: the first one is about *where things sit*,
   the second is about *what happens in what order*. Drawn as a single
   picture they become a bowl of spaghetti.

   The hub places InkWell in the middle with six things around it — and the
   AI is one of the six, not the centre. The loop underneath shows the cycle
   that actually produces the value: a writer publishes, a reader reads, a
   discussion happens, the writing improves. The AI is attached to the loop
   with a dashed line and the label says what it is: available at every step,
   and never the thing anyone came to read.
   ───────────────────────────────────────────────────────────────────── */

const SATELLITES = [
  {
    key: "writers",
    label: "Writers",
    icon: <EditNoteOutlined />,
    body: "People who publish, and keep the rights to their work.",
    col: "1",
    row: "1",
  },
  {
    key: "stories",
    label: "Stories",
    icon: <AutoStoriesOutlined />,
    body: "The writing itself. Every other surface here exists to serve it.",
    col: "2",
    row: "1",
  },
  {
    key: "readers",
    label: "Readers",
    icon: <PersonOutlineOutlined />,
    body: "People who arrive to read, and can reply when they disagree.",
    col: "3",
    row: "1",
  },
  {
    key: "research",
    label: "Research",
    icon: <SearchOutlined />,
    body: "Sources, notes and citations kept beside the draft.",
    col: "1",
    row: "2",
  },
  {
    key: "ai",
    label: "AI",
    icon: <AutoAwesomeOutlined />,
    body: "An assistant inside the work — never the author.",
    col: "3",
    row: "2",
    assistant: true,
  },
  {
    key: "community",
    label: "Community",
    icon: <GroupsOutlined />,
    body: "The follows, replies and arguments between the two sides.",
    col: "2",
    row: "3",
  },
];

const LOOP = ["Writer", "Story", "Reader", "Discussion", "Feedback"];

const CommunityDiagram = () => (
  <Box className="ink-ab-eco">
    {/* ── Where things sit ─────────────────────────────────────────── */}
    <Box className="ink-ab-hub">
      {SATELLITES.map((item, i) => (
        <Box
          key={item.key}
          className="ink-ab-hub-node"
          /* Column/row arrive as custom properties, not as grid-column
             directly: the mobile layout replaces the whole grid, and an
             inline grid-column would outrank the media query that does it. */
          style={{ "--ab-col": item.col, "--ab-row": item.row }}
          data-assistant={item.assistant || undefined}
        >
          <Reveal delay={Math.min(i, 5) * 0.06} y={16}>
            <Box className="ink-ab-hub-card">
              <NodeChip size={38} active={item.assistant}>
                {item.icon}
              </NodeChip>
              <Box component="span" className="ink-ab-hub-label">
                {item.label}
              </Box>
              {/* A word, so the tint on this one card is not the only thing
                  saying which part of the diagram is the assistant. */}
              {item.assistant ? (
                <Box component="span" className="ink-ab-hub-tag">
                  Assistant
                </Box>
              ) : null}
              <Typography
                component="p"
                sx={{ m: "0.35rem 0 0", fontSize: "0.82rem", lineHeight: 1.5, color: INK.text2 }}
              >
                {item.body}
              </Typography>
            </Box>
          </Reveal>
        </Box>
      ))}

      <Box
        className="ink-ab-hub-core"
        style={{ "--ab-col": 2, "--ab-row": 2 }}
      >
        <Reveal y={14}>
          <Box className="ink-ab-hub-core-inner">
            <Typography
              component="span"
              sx={{
                display: "block",
                fontFamily: FONT_DISPLAY,
                fontSize: "0.58rem",
                fontWeight: 800,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: INK.orange,
              }}
            >
              InkWell
            </Typography>
            <Typography
              component="span"
              sx={{
                display: "block",
                mt: "0.35rem",
                fontFamily: FONT_DISPLAY,
                fontSize: "1.05rem",
                fontWeight: 800,
                lineHeight: 1.3,
                color: INK.text,
              }}
            >
              One place for all of it
            </Typography>
          </Box>
        </Reveal>
      </Box>
    </Box>

    {/* ── What happens in what order ───────────────────────────────── */}
    <Reveal className="ink-ab-loop" delay={0.1}>
      <StepMark sx={{ mb: "1.1rem" }}>The loop that does the work</StepMark>

      <Box className="ink-ab-loop-strip">
        <Box component="ol" className="ink-ab-loop-nodes">
          {LOOP.map((label, i) => (
            <Box component="li" key={label} className="ink-ab-loop-node">
              <Box component="span" className="ink-ab-loop-name">
                {label}
              </Box>
              {i < LOOP.length - 1 ? (
                <Box component="span" className="ink-ab-loop-arrow" aria-hidden="true" />
              ) : null}
            </Box>
          ))}
        </Box>

        {/* The closing arc: feedback becomes the next piece. The line and the
            arrow are decoration and are hidden; the sentence is not, because
            it is the part that says what the arc means. */}
        <Box className="ink-ab-loop-return">
          <Box component="span" className="ink-ab-loop-return-line" aria-hidden="true" />
          <Box component="span" className="ink-ab-loop-return-icon" aria-hidden="true">
            <ReplayOutlined />
          </Box>
          <Box component="span" className="ink-ab-loop-return-label">
            and the next piece is better
          </Box>
        </Box>
      </Box>

      <Typography
        component="p"
        sx={{ m: "1.5rem 0 0", fontSize: "0.9rem", lineHeight: 1.6, color: INK.text2, maxWidth: "62ch" }}
      >
        The assistant is attached to the loop, not standing in the middle of it. It can help
        at any point and it is never the thing anyone came here to read.
      </Typography>
    </Reveal>
  </Box>
);

export default CommunityDiagram;
