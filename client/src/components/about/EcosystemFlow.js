import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import {
  AutoFixHighOutlined,
  EditNoteOutlined,
  GroupsOutlined,
  LightbulbOutlined,
  MenuBookOutlined,
  PsychologyOutlined,
  RocketLaunchOutlined,
} from "@mui/icons-material";
import { FONT_DISPLAY, INK } from "../ink";
import { NodeChip, StepMark } from "./shared";

/* ─────────────────────────────────────────────────────────────────────
   The hero's ecosystem strip: one idea walking the whole way through.

   Seven nodes, one shared explanation panel beneath them. The panel is a
   single fixed-height region rather than an accordion under each node on
   purpose — expanding a row under the pointer shoves the rows below it, and
   this diagram is meant to be traced with the mouse, so the thing being
   hovered must never move. Nothing here talks to a server: it is the product
   describing itself.
   ───────────────────────────────────────────────────────────────────── */

const FLOW = [
  {
    key: "idea",
    label: "Idea",
    icon: <LightbulbOutlined />,
    body: "It always begins as a half-formed thought you can't stop turning over.",
  },
  {
    key: "write",
    label: "Write",
    icon: <EditNoteOutlined />,
    body: "Turn your ideas into structured stories.",
  },
  {
    key: "think",
    label: "Think",
    icon: <PsychologyOutlined />,
    body: "Challenge your assumptions before you publish.",
  },
  {
    key: "research",
    label: "Research",
    icon: <MenuBookOutlined />,
    body: "Find evidence and perspectives that strengthen your argument.",
  },
  {
    key: "refine",
    label: "Refine",
    icon: <AutoFixHighOutlined />,
    body: "Cut what isn't carrying weight. Keep what is.",
  },
  {
    key: "publish",
    label: "Publish",
    icon: <RocketLaunchOutlined />,
    body: "Share your work with readers.",
  },
  {
    key: "community",
    label: "Community",
    icon: <GroupsOutlined />,
    body: "Readers answer, question and build on what you wrote.",
  },
];

const EcosystemFlow = () => {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const node = FLOW[active];

  return (
    <Box className="ink-ab-flow">
      <StepMark sx={{ mb: "0.85rem" }}>How one idea travels</StepMark>

      <Box component="ul" className="ink-ab-flow-list">
        {FLOW.map((item, i) => {
          const on = i === active;
          return (
            <Box component="li" key={item.key} className="ink-ab-flow-item">
              <Box
                component="button"
                type="button"
                className="ink-ab-flow-node"
                data-active={on || undefined}
                aria-describedby="ink-ab-flow-panel"
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
              >
                <NodeChip size={38} active={on}>
                  {item.icon}
                </NodeChip>
                <Box component="span" className="ink-ab-flow-label">
                  {item.label}
                </Box>
              </Box>
              {i < FLOW.length - 1 && (
                <Box
                  component="span"
                  aria-hidden="true"
                  className="ink-ab-flow-link"
                  data-lit={i < active || undefined}
                />
              )}
            </Box>
          );
        })}
      </Box>

      {/* The explanation panel. min-height reserves the tallest of the seven
          so switching nodes never nudges the layout. */}
      <Box className="ink-ab-flow-panel" id="ink-ab-flow-panel">
        <motion.div
          key={node.key}
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <Typography
            component="span"
            sx={{
              display: "block",
              fontFamily: FONT_DISPLAY,
              fontSize: "0.62rem",
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: INK.orange,
              mb: "0.35rem",
            }}
          >
            {node.label}
          </Typography>
          <Typography
            component="p"
            sx={{ m: 0, fontSize: "0.9rem", lineHeight: 1.55, color: INK.text2 }}
          >
            {node.body}
          </Typography>
        </motion.div>
      </Box>
    </Box>
  );
};

export default EcosystemFlow;
