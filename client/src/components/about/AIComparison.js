import React from "react";
import { Box, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import { AutoAwesomeOutlined, PersonOutlineOutlined } from "@mui/icons-material";
import { EASE, FONT_DISPLAY, INK, Reveal } from "../ink";
import { NodeChip } from "./shared";

/* ─────────────────────────────────────────────────────────────────────
   "AI that helps you think. Not AI that replaces you."

   Two chains side by side, and the whole section is a comparison of *length
   and order*, not of adjectives. The left chain is four steps long and ends
   at the publish button. The right one is seven, and the last thing that
   happens in it is a person editing their own work.

   The orange line down the InkWell side is the section's one piece of
   motion: its segments light up in order as the column enters view, which is
   a way of reading the chain rather than decoration. It does not animate at
   all under `prefers-reduced-motion` — the segments are simply there, at full
   strength, from the first frame.

   The chips carry the human/AI distinction by colour, with a legend, so
   colour is never the only signal; the explicit HUMAN / AI pills are spent
   once, in the authorship timeline further down, where that distinction is
   the subject rather than the background.
   ───────────────────────────────────────────────────────────────────── */

const THEM = [
  { key: "prompt", label: "Prompt" },
  { key: "generate", label: "Generate" },
  { key: "copy", label: "Copy" },
  { key: "publish", label: "Publish" },
];

const OURS = [
  { key: "idea", label: "Your idea", who: "human" },
  { key: "explore", label: "AI helps you explore it", who: "ai" },
  { key: "challenge", label: "AI challenges your thinking", who: "ai" },
  { key: "research", label: "You research", who: "human" },
  { key: "fact", label: "Fact check", who: "ai" },
  { key: "edit", label: "You edit", who: "human" },
  { key: "you-publish", label: "You publish", who: "human" },
];

const COLUMNS = [
  {
    key: "them",
    eyebrow: "Most AI writing tools",
    lede: "One prompt, one output, and the thinking happens somewhere you can't see.",
    close: "The tool writes. You publish.",
    steps: THEM,
    ours: false,
  },
  {
    key: "ours",
    eyebrow: "InkWell",
    lede: "The assistant sits inside the work — before the draft, during the argument, after the claims.",
    close: "The tool helps. You decide.",
    steps: OURS,
    ours: true,
  },
];

/* One step, and the piece of line that belongs above it.

   The line is drawn in the gap above the step rather than as one spine behind
   the column: a spine behind these tiles shows straight through them, and they
   are translucent on purpose.

   The segment fades rather than growing. An element scaled vertically from
   zero has no area at rest, and an intersection ratio is measured against
   area — so "grow the line down the gap" asks the browser to notice an element
   that is not there yet, and whether it does is a question about timing rather
   than about the layout. Fading a segment that is already full height keeps
   the area real: the observer answers from the geometry, every time, and the
   stagger still reads as the chain lighting up one link at a time. */
const ChainStep = ({ step, i, ours, reduce }) => (
  <Box component="li" className="ink-ab-chain-step">
    {i > 0 ? (
      <Box className="ink-ab-chain-link" aria-hidden="true">
        {ours ? (
          <motion.span
            className="ink-ab-chain-link-fill"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0 }}
            transition={
              reduce
                ? { duration: 0 }
                : { duration: 0.45, delay: i * 0.12, ease: EASE }
            }
          />
        ) : null}
      </Box>
    ) : null}

    <NodeChip size={34} active={ours && step.who === "ai"}>
      {ours ? (
        step.who === "ai" ? (
          <AutoAwesomeOutlined />
        ) : (
          <PersonOutlineOutlined />
        )
      ) : null}
    </NodeChip>
    <Box component="span" className="ink-ab-chain-label">
      {step.label}
    </Box>
  </Box>
);

const Chain = ({ column }) => {
  const reduce = useReducedMotion();
  return (
    <Box className={`ink-ab-chain${column.ours ? " is-ours" : ""}`}>
      <Typography
        component="span"
        sx={{
          display: "block",
          fontFamily: FONT_DISPLAY,
          fontSize: "0.62rem",
          fontWeight: 800,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: column.ours ? INK.orange : INK.text3Decor,
        }}
      >
        {column.eyebrow}
      </Typography>

      <Typography
        component="p"
        sx={{ m: "0.6rem 0 1.5rem", fontSize: "0.9rem", lineHeight: 1.6, color: INK.text2 }}
      >
        {column.lede}
      </Typography>

      <Box className="ink-ab-chain-body">
        <Box component="ol" className="ink-ab-chain-steps">
          {column.steps.map((step, i) => (
            <ChainStep key={step.key} step={step} i={i} ours={column.ours} reduce={reduce} />
          ))}
        </Box>
      </Box>

      {/* The chip colour is the human/AI cue, so it needs naming. */}
      {column.ours ? (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            mt: "1.5rem",
          }}
        >
          {[
            { tone: INK.orange, label: "AI-assisted" },
            { tone: "rgba(255,255,255,0.35)", label: "You" },
          ].map((legend) => (
            <Box
              key={legend.label}
              component="span"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                fontSize: "0.72rem",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontWeight: 700,
                color: INK.text2,
              }}
            >
              <Box
                component="span"
                aria-hidden="true"
                sx={{
                  width: 9,
                  height: 9,
                  borderRadius: "3px",
                  background: legend.tone,
                }}
              />
              {legend.label}
            </Box>
          ))}
        </Box>
      ) : null}

      <Typography
        component="p"
        sx={{
          m: column.ours ? "1rem 0 0" : "1.5rem 0 0",
          fontFamily: FONT_DISPLAY,
          fontSize: "0.94rem",
          fontWeight: 800,
          lineHeight: 1.4,
          color: column.ours ? INK.text : INK.text3Decor,
        }}
      >
        {column.close}
      </Typography>
    </Box>
  );
};

const AiComparison = () => (
  <Box className="ink-ab-compare">
    {COLUMNS.map((column, i) => (
      <Reveal key={column.key} delay={i * 0.1}>
        <Chain column={column} />
      </Reveal>
    ))}
  </Box>
);

export default AiComparison;
