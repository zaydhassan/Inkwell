import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import { AutoAwesomeOutlined, CheckOutlined, CloseOutlined, EditOutlined } from "@mui/icons-material";
import { FONT_DISPLAY, INK, InkGhostButton, InkPrimaryButton } from "../ink";

/* ─────────────────────────────────────────────────────────────────────
   "See how InkWell helps you write."

   A demonstration, and it says so. Everything below is local component
   state: accepting, editing and dismissing the suggestion all do real work on
   the text in the panel, and none of it leaves the browser. There is no API
   call here and there must not be one — the About page has no business
   quietly spending a reader's AI credits to decorate itself, and a request
   that might fail would make the demonstration depend on a server that has
   nothing to do with the point being made.

   The suggestion is the brief's example line, unchanged.
   ───────────────────────────────────────────────────────────────────── */

const DRAFT = "AI is changing how people work.";
const SUGGESTION =
  "AI is changing how people work — but the bigger shift is how people think about what work should look like.";

const WritingDemo = () => {
  const reduce = useReducedMotion();
  // idle → suggested → accepted | dismissed | editing → (back to) suggested
  const [phase, setPhase] = useState("idle");
  const [draft, setDraft] = useState(DRAFT);
  const [editText, setEditText] = useState(SUGGESTION);

  const reset = () => {
    setPhase("idle");
    setDraft(DRAFT);
    setEditText(SUGGESTION);
  };

  const fade = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
      };

  return (
    <Box className="ink-ab-demo">
      {/* The document. A draft header, the text, and a status line that
          reports what the last action did. */}
      <Box className="ink-ab-demo-doc">
        <Box className="ink-ab-demo-doc-head">
          <Box component="span" className="ink-ab-demo-dot" aria-hidden="true" />
          <Typography
            component="span"
            sx={{
              fontFamily: FONT_DISPLAY,
              fontSize: "0.66rem",
              fontWeight: 800,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: INK.text3Decor,
            }}
          >
            Draft · untitled
          </Typography>
        </Box>

        {phase === "editing" ? (
          <Box
            component="textarea"
            className="ink-ab-demo-input"
            aria-label="Edit the suggested sentence"
            value={editText}
            rows={3}
            onChange={(e) => setEditText(e.target.value)}
          />
        ) : (
          <Typography component="p" className="ink-ab-demo-text">
            {draft}
          </Typography>
        )}

        <Typography component="p" className="ink-ab-demo-status" aria-live="polite">
          {phase === "accepted"
            ? "Accepted. It is your sentence now — keep going."
            : phase === "dismissed"
              ? "Dismissed. InkWell will not offer that line again."
              : phase === "editing"
                ? "Rewrite it however you like, then save."
                : phase === "suggested"
                  ? "One suggestion, with its reasoning. Yours to take or leave."
                  : "Your draft. Ask for a suggestion when you want one."}
        </Typography>
      </Box>

      {/* The suggestion, and the three things you can do with it. */}
      <Box className="ink-ab-demo-side">
        {phase === "idle" ? (
          <Box className="ink-ab-demo-ask">
            <Typography component="p" sx={{ m: "0 0 1rem", fontSize: "0.9rem", lineHeight: 1.6, color: INK.text2 }}>
              The assistant reads the last line and offers one continuation. It never writes the piece.
            </Typography>
            <InkPrimaryButton
              onClick={() => setPhase("suggested")}
              startIcon={<AutoAwesomeOutlined />}
            >
              Suggest a continuation
            </InkPrimaryButton>
          </Box>
        ) : null}

        {phase === "suggested" ? (
          <motion.div {...fade}>
            <Box className="ink-ab-demo-card ink-ab-demo-card--live">
              <Typography
                component="span"
                sx={{
                  display: "block",
                  mb: "0.5rem",
                  fontFamily: FONT_DISPLAY,
                  fontSize: "0.6rem",
                  fontWeight: 800,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: INK.orange,
                }}
              >
                Suggested continuation
              </Typography>
              <Typography component="p" sx={{ m: 0, fontSize: "0.94rem", lineHeight: 1.6, color: INK.text }}>
                {SUGGESTION}
              </Typography>
              <Box className="ink-ab-demo-actions">
                <InkPrimaryButton
                  className="ink-ab-btn-sm"
                  onClick={() => {
                    setDraft(SUGGESTION);
                    setPhase("accepted");
                  }}
                  startIcon={<CheckOutlined />}
                >
                  Accept
                </InkPrimaryButton>
                <InkGhostButton
                  className="ink-ab-btn-sm"
                  onClick={() => {
                    setEditText(SUGGESTION);
                    setPhase("editing");
                  }}
                  startIcon={<EditOutlined />}
                >
                  Edit
                </InkGhostButton>
                <InkGhostButton
                  className="ink-ab-btn-sm"
                  onClick={() => setPhase("dismissed")}
                  startIcon={<CloseOutlined />}
                >
                  Dismiss
                </InkGhostButton>
              </Box>
            </Box>
          </motion.div>
        ) : null}

        {phase === "editing" ? (
          <motion.div {...fade}>
            <Box className="ink-ab-demo-card ink-ab-demo-card--live">
              <Typography
                component="span"
                sx={{
                  display: "block",
                  mb: "0.5rem",
                  fontFamily: FONT_DISPLAY,
                  fontSize: "0.6rem",
                  fontWeight: 800,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: INK.orange,
                }}
              >
                Your edit
              </Typography>
              <Box className="ink-ab-demo-actions">
                <InkPrimaryButton
                  className="ink-ab-btn-sm"
                  disabled={!editText.trim()}
                  onClick={() => {
                    setDraft(editText.trim());
                    setPhase("accepted");
                  }}
                  startIcon={<CheckOutlined />}
                >
                  Save
                </InkPrimaryButton>
                <InkGhostButton className="ink-ab-btn-sm" onClick={() => setPhase("suggested")}>
                  Cancel
                </InkGhostButton>
              </Box>
            </Box>
          </motion.div>
        ) : null}

        {phase === "accepted" || phase === "dismissed" ? (
          <motion.div {...fade}>
            <Box className="ink-ab-demo-card" data-tone={phase}>
              <Typography
                component="p"
                sx={{
                  m: 0,
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                  color: phase === "accepted" ? INK.text : INK.text2,
                }}
              >
                {phase === "accepted"
                  ? "That is the whole idea: the suggestion is a starting point, and the sentence is still yours to change."
                  : "Dismissing is a real answer. Nothing is written into your draft unless you say so."}
              </Typography>
              <Box className="ink-ab-demo-actions">
                <InkGhostButton className="ink-ab-btn-sm" onClick={reset}>
                  Run it again
                </InkGhostButton>
              </Box>
            </Box>
          </motion.div>
        ) : null}
      </Box>
    </Box>
  );
};

export default WritingDemo;
