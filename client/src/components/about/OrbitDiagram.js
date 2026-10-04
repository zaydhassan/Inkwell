import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import {
  CreateOutlined,
  ExploreOutlined,
  ForumOutlined,
  PsychologyOutlined,
  PublishOutlined,
  SearchOutlined,
} from "@mui/icons-material";
import { FONT_DISPLAY, INK } from "../ink";
import { NodeChip } from "./shared";

/* ─────────────────────────────────────────────────────────────────────
   "More than a place to publish." — six capabilities orbiting the idea.

   The ring turns slowly (80s — imperceptible as motion, legible as a
   diagram) and each node counter-rotates for exactly the same duration so
   its label stays upright: the parent's rotate(θ) is cancelled by the
   child's rotate(−θ) about the child's own centre. Hovering or focusing a
   node replaces the copy in the centre card. The centre is the fixed thing —
   that is the entire point of the section — so it never moves.

   Below the tablet breakpoint a rotating ring is a usability problem rather
   than a flourish, so the same six nodes render as a plain list with their
   explanations always visible (there is no hover to reveal them with). Only
   one of the two markups is ever in the accessibility tree: the hidden one
   is `display: none`, not merely transparent.
   ───────────────────────────────────────────────────────────────────── */

const ORBIT = [
  {
    key: "write",
    label: "Write",
    icon: <CreateOutlined />,
    body: "A writing surface built for long-form thinking, not for status updates.",
  },
  {
    key: "research",
    label: "Research",
    icon: <SearchOutlined />,
    body: "Keep your sources beside the draft instead of in another tab.",
  },
  {
    key: "think",
    label: "Think",
    icon: <PsychologyOutlined />,
    body: "Ask to be questioned. An assistant that agrees with everything is worthless.",
  },
  {
    key: "publish",
    label: "Publish",
    icon: <PublishOutlined />,
    body: "One place to ship your work, with your name on it.",
  },
  {
    key: "discover",
    label: "Discover",
    icon: <ExploreOutlined />,
    body: "Find writers thinking about what you're thinking about.",
  },
  {
    key: "connect",
    label: "Connect",
    icon: <ForumOutlined />,
    body: "Readers who answer back, rather than a silent scroll past.",
  },
];

const RADIUS = 36; // percent of the square's half-width

/* Computed once: an even ring starting at twelve o'clock. */
const POINTS = ORBIT.map((_, i) => {
  const angle = (i / ORBIT.length) * Math.PI * 2 - Math.PI / 2;
  return {
    left: `${50 + RADIUS * Math.cos(angle)}%`,
    top: `${50 + RADIUS * Math.sin(angle)}%`,
  };
});

const OrbitDiagram = () => {
  const [active, setActive] = useState(null);
  const node = active === null ? null : ORBIT[active];

  return (
    <Box className="ink-ab-orbit-wrap">
      {/* Desktop: the ring. Hidden (and out of the a11y tree) on small screens. */}
      <Box className="ink-ab-orbit" aria-hidden={false}>
        <Box className="ink-ab-orbit-path" aria-hidden="true" />
        <Box className="ink-ab-orbit-ring" onMouseLeave={() => setActive(null)}>
          {/* The centre. Counter-rotated like every node so its text stays
              level while the ring turns under it. */}
          <Box className="ink-ab-orbit-slot ink-ab-orbit-core-slot">
            <Box className="ink-ab-orbit-counter">
              <Box className="ink-ab-orbit-core" id="ink-ab-orbit-core">
                <Typography
                  component="span"
                  sx={{
                    display: "block",
                    fontFamily: FONT_DISPLAY,
                    fontSize: "0.6rem",
                    fontWeight: 800,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: INK.orange,
                    mb: "0.4rem",
                  }}
                >
                  {node ? node.label : "InkWell"}
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    display: "block",
                    fontFamily: FONT_DISPLAY,
                    fontSize: node ? "0.86rem" : "1.2rem",
                    fontWeight: 800,
                    lineHeight: 1.32,
                    letterSpacing: "-0.015em",
                    color: INK.text,
                  }}
                >
                  {node ? node.body : "Your Ideas"}
                </Typography>
              </Box>
            </Box>
          </Box>

          {ORBIT.map((item, i) => (
            <Box key={item.key} className="ink-ab-orbit-slot" style={POINTS[i]}>
              <Box className="ink-ab-orbit-counter">
                <Box
                  component="button"
                  type="button"
                  className="ink-ab-orbit-node"
                  data-active={i === active || undefined}
                  aria-describedby="ink-ab-orbit-core"
                  aria-label={`What InkWell does here: ${item.label}`}
                  onClick={() => setActive(i)}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                >
                  <NodeChip size={46} active={i === active}>
                    {item.icon}
                  </NodeChip>
                  <Box component="span" className="ink-ab-orbit-label">
                    {item.label}
                  </Box>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Phones and tablets: the same six nodes, no rotation, every
          explanation spelled out. */}
      <Box component="ul" className="ink-ab-orbit-list">
        {ORBIT.map((item) => (
          <Box component="li" key={item.key} className="ink-ab-orbit-row">
            <NodeChip size={40}>{item.icon}</NodeChip>
            <Box>
              <Box component="span" className="ink-ab-orbit-row-label">
                {item.label}
              </Box>
              <Typography
                component="p"
                sx={{ m: 0, fontSize: "0.86rem", lineHeight: 1.5, color: INK.text2 }}
              >
                {item.body}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default OrbitDiagram;
