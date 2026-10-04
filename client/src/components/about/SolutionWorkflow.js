import React, { useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import {
  AutoFixHighOutlined,
  EditNoteOutlined,
  GroupsOutlined,
  MenuBookOutlined,
  PsychologyOutlined,
  RocketLaunchOutlined,
  VerifiedOutlined,
} from "@mui/icons-material";
import { FONT_DISPLAY, INK, Reveal } from "../ink";
import { NodeChip } from "./shared";
import { Mock } from "./Mocks";

/* ─────────────────────────────────────────────────────────────────────
   "One place for the entire journey."

   Seven steps, one panel. This is a real tab set, not a picture of one:
   `role="tablist"` with roving tabindex, arrow / Home / End keys, and a
   `role="tabpanel"` bound to the selected tab by aria-controls. Hover also
   selects, because the brief asks for it and because a pointer user tracing
   the list should not have to click seven times — but hover is an addition
   to the keyboard behaviour, never a replacement for it.

   Each step's visual is a small abstract mock of what that step does in the
   product (lines being cut, claims being checked, a story card going out).
   They contain no figures of any kind — nothing here is a statistic.
   ───────────────────────────────────────────────────────────────────── */

const STEPS = [
  {
    key: "think",
    n: "01",
    label: "Think",
    icon: <PsychologyOutlined />,
    body: "Start with the claim, not the format. InkWell asks what you are actually arguing before you write a word of it.",
    gain: "A clearer thesis",
    visual: "challenge",
  },
  {
    key: "research",
    n: "02",
    label: "Research",
    icon: <MenuBookOutlined />,
    body: "Gather sources and counter-arguments beside the draft, so the piece is built on evidence rather than momentum.",
    gain: "Evidence, not vibes",
    visual: "sources",
  },
  {
    key: "write",
    n: "03",
    label: "Write",
    icon: <EditNoteOutlined />,
    body: "A focused surface with room for long-form thinking, and the structure of your argument kept in view while you draft.",
    gain: "Momentum",
    visual: "lines",
  },
  {
    key: "refine",
    n: "04",
    label: "Refine",
    icon: <AutoFixHighOutlined />,
    body: "Tighten it. Cut the paragraphs that repeat what you already said better three paragraphs earlier.",
    gain: "A tighter piece",
    visual: "refine",
  },
  {
    key: "verify",
    n: "05",
    label: "Verify",
    icon: <VerifiedOutlined />,
    body: "Check the claims you are least sure about, before a reader does it for you in the comments.",
    gain: "Fewer regrets",
    visual: "checks",
  },
  {
    key: "publish",
    n: "06",
    label: "Publish",
    icon: <RocketLaunchOutlined />,
    body: "Ship it in one place, with your name on it and your work intact.",
    gain: "Your work, live",
    visual: "card",
  },
  {
    key: "connect",
    n: "07",
    label: "Connect",
    icon: <GroupsOutlined />,
    body: "Readers reply, question and follow. The conversation carries on past the last line.",
    gain: "An audience that answers",
    visual: "replies",
  },
];

const SolutionWorkflow = () => {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const tabRefs = useRef([]);
  const step = STEPS[active];

  /* Roving focus: one tab is in the tab order, arrows move between them.
     Activation follows focus, which is the right model for tabs whose panel
     is cheap to render. */
  const move = (index) => {
    const next = (index + STEPS.length) % STEPS.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  const onKeyDown = (event) => {
    const keys = {
      ArrowDown: active + 1,
      ArrowRight: active + 1,
      ArrowUp: active - 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: STEPS.length - 1,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    move(keys[event.key]);
  };

  return (
    <Reveal className="ink-ab-steps-reveal">
      <Box className="ink-ab-steps">
        <Box
          role="tablist"
          aria-orientation="vertical"
          aria-label="The journey of a piece of writing in InkWell"
          className="ink-ab-steps-tabs"
          onKeyDown={onKeyDown}
        >
          {STEPS.map((item, i) => {
            const on = i === active;
            return (
              <Box
                component="button"
                type="button"
                role="tab"
                key={item.key}
                id={`ink-ab-step-tab-${item.key}`}
                aria-selected={on}
                aria-controls="ink-ab-step-panel"
                tabIndex={on ? 0 : -1}
                data-active={on || undefined}
                className="ink-ab-steps-tab"
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
              >
                <Box component="span" className="ink-ab-steps-num" aria-hidden="true">
                  {item.n}
                </Box>
                <NodeChip size={30} active={on}>
                  {item.icon}
                </NodeChip>
                <Box component="span" className="ink-ab-steps-name">
                  {item.label}
                </Box>
              </Box>
            );
          })}
        </Box>

        <Box
          role="tabpanel"
          id="ink-ab-step-panel"
          aria-labelledby={`ink-ab-step-tab-${step.key}`}
          className="ink-ab-steps-panel"
        >
          <motion.div
            key={step.key}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          >
            <Typography
              component="span"
              sx={{
                display: "block",
                fontFamily: FONT_DISPLAY,
                fontSize: "0.62rem",
                fontWeight: 800,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: INK.orange,
              }}
            >
              Step {step.n}
            </Typography>
            <Typography
              component="h3"
              sx={{
                m: "0.5rem 0 0",
                fontFamily: FONT_DISPLAY,
                fontSize: "1.4rem",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: INK.text,
              }}
            >
              {step.label}
            </Typography>
            <Typography
              component="p"
              sx={{ m: "0.7rem 0 0", fontSize: "0.96rem", lineHeight: 1.62, color: INK.text2 }}
            >
              {step.body}
            </Typography>

            <Box className="ink-ab-steps-lower">
              <Mock kind={step.visual} />
              <Box className="ink-ab-steps-gain">
                <Typography
                  component="span"
                  sx={{
                    display: "block",
                    fontSize: "0.58rem",
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: INK.text3Decor,
                  }}
                >
                  What you get
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    display: "block",
                    mt: "0.25rem",
                    fontFamily: FONT_DISPLAY,
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    color: INK.text,
                  }}
                >
                  {step.gain}
                </Typography>
              </Box>
            </Box>
          </motion.div>
        </Box>
      </Box>
    </Reveal>
  );
};

export default SolutionWorkflow;
