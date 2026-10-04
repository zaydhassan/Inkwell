import React from "react";
import { Box, Typography } from "@mui/material";
import {
  BookmarkBorderOutlined,
  ExploreOutlined,
  ForumOutlined,
  MenuBookOutlined,
  PersonAddAltOutlined,
  ReplayOutlined,
} from "@mui/icons-material";
import { INK, Reveal } from "../ink";
import { NodeChip } from "./shared";

/* ─────────────────────────────────────────────────────────────────────
   "Built for people who love discovering ideas." — the reader's journey.

   Composed as a path, not a list, because this one is a loop: RETURN puts you
   back at DISCOVER, and the section's whole claim is that reading here ends
   somewhere other than a dead end. The six steps run left to right under a
   single curved connector, with a dashed return arc closing the circuit back
   to the start.

   Deliberately a different shape from the writer's vertical timeline above
   and from the orbit elsewhere on the page — five sections in a row that all
   looked like the same diagram would be a worse failure than any single one
   looking plain.
   ───────────────────────────────────────────────────────────────────── */

const STEPS = [
  {
    key: "discover",
    label: "Discover",
    icon: <ExploreOutlined />,
    body: "Find something worth your attention — not whatever is loudest.",
  },
  {
    key: "read",
    label: "Read",
    icon: <MenuBookOutlined />,
    body: "A page built for reading, not for keeping you scrolling.",
  },
  {
    key: "save",
    label: "Save",
    icon: <BookmarkBorderOutlined />,
    body: "Keep it for later, in a list you will actually come back to.",
  },
  {
    key: "discuss",
    label: "Discuss",
    icon: <ForumOutlined />,
    body: "Reply to the argument, not just the headline.",
  },
  {
    key: "follow",
    label: "Follow",
    icon: <PersonAddAltOutlined />,
    body: "Follow the writers whose thinking you want more of.",
  },
  {
    key: "return",
    label: "Return",
    icon: <ReplayOutlined />,
    body: "Come back because you want to, not because a feed called you.",
  },
];

const ReaderJourney = () => (
  <Box className="ink-ab-reader">
    {/* The section eyebrow already reads "For readers" — the drawing does not
        need to announce itself a second time. */}
    <Box className="ink-ab-reader-path">
      {/* The connector runs behind the nodes; the return arc drops below the
          whole row and comes back to the first node, which is the shape of the
          claim. Both are decoration, and the arc comes after the row in the
          source so it renders under it — drawn at the row's own height it ran
          straight through the labels and the copy beneath them. */}
      <Box className="ink-ab-reader-line" aria-hidden="true" />

      <Box component="ol" className="ink-ab-reader-steps">
        {STEPS.map((step, i) => (
          <Box component="li" key={step.key} className="ink-ab-reader-step">
            <Reveal delay={i * 0.06} y={16}>
              <Box className="ink-ab-reader-node">
                {/* The connector passes behind this row, so the tile has to be
                    opaque — see the note on .ink-ab-reader-chip. */}
                <NodeChip size={44} className="ink-ab-reader-chip">
                  {step.icon}
                </NodeChip>
                <Box component="span" className="ink-ab-reader-label">
                  {step.label}
                </Box>
                <Typography
                  component="p"
                  sx={{ m: "0.4rem 0 0", fontSize: "0.84rem", lineHeight: 1.5, color: INK.text2 }}
                >
                  {step.body}
                </Typography>
              </Box>
            </Reveal>
          </Box>
        ))}
      </Box>

      <Box className="ink-ab-reader-return" aria-hidden="true" />
    </Box>
  </Box>
);

export default ReaderJourney;
