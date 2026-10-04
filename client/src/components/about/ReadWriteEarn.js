import React from "react";
import { Box, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import { EditNoteOutlined, EmojiEventsOutlined, MenuBookOutlined } from "@mui/icons-material";
import { FONT_DISPLAY, INK, Reveal } from "../ink";
import { NodeChip } from "./shared";

/* ─────────────────────────────────────────────────────────────────────
   Read · Write · Earn.

   The three things you can do here, in order, with an orange line running
   through them that lights up one segment at a time as the row enters view.
   The sequence is the point — reading is what anyone can do first, writing
   is what you graduate to, and earning follows the work — so the segments
   light left to right rather than all at once.

   The "earn" here is the app's real one: points, levels and badges for
   writing, reading and replying. Nothing on this page promises money.
   ───────────────────────────────────────────────────────────────────── */

const PILLARS = [
  {
    key: "read",
    n: "01",
    title: "Read",
    icon: <MenuBookOutlined />,
    body: "Every story on InkWell is open to anyone. Reading is free, and it stays free.",
    points: ["Save what matters", "Follow a writer", "Reply to the argument"],
  },
  {
    key: "write",
    n: "02",
    title: "Write",
    icon: <EditNoteOutlined />,
    body: "The long-form editor, the research shelf and the assistant are open to every writer, from the first post.",
    points: ["Room for long-form", "Research beside the draft", "AI that questions you"],
  },
  {
    key: "earn",
    n: "03",
    title: "Earn",
    icon: <EmojiEventsOutlined />,
    body: "Points and levels for the work you actually do — writing, reading, and the discussion you keep alive.",
    points: ["Points as you engage", "Levels and badges", "Rewards you can see"],
  },
];

const ReadWriteEarn = () => {
  const reduce = useReducedMotion();

  return (
    <Box className="ink-ab-rwe">
      {PILLARS.map((pillar, i) => (
        <Reveal key={pillar.key} delay={i * 0.12} className="ink-ab-rwe-item">
          <Box className="ink-ab-rwe-card">
            {/* The connector to the next pillar. One segment per gap, so the
                row lights left to right instead of all at once. */}
            {i < PILLARS.length - 1 ? (
              <motion.div
                className="ink-ab-rwe-seg"
                aria-hidden="true"
                initial={reduce ? false : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.6, delay: i * 0.28, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: "0 50%" }}
              />
            ) : null}

            <Box className="ink-ab-rwe-top">
              <NodeChip size={46}>{pillar.icon}</NodeChip>
              <Box component="span" className="ink-ab-rwe-num" aria-hidden="true">
                {pillar.n}
              </Box>
            </Box>

            <Typography
              component="h3"
              sx={{
                m: "1.1rem 0 0",
                fontFamily: FONT_DISPLAY,
                fontSize: "1.3rem",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: INK.text,
              }}
            >
              {pillar.title}
            </Typography>
            <Typography
              component="p"
              sx={{ m: "0.6rem 0 0", fontSize: "0.92rem", lineHeight: 1.6, color: INK.text2 }}
            >
              {pillar.body}
            </Typography>

            <Box component="ul" className="ink-ab-rwe-list">
              {pillar.points.map((point) => (
                <Box component="li" key={point} className="ink-ab-rwe-point">
                  <Box component="span" className="ink-ab-rwe-dot" aria-hidden="true" />
                  {point}
                </Box>
              ))}
            </Box>
          </Box>
        </Reveal>
      ))}
    </Box>
  );
};

export default ReadWriteEarn;
