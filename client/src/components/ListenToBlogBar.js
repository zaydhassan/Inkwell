import React, { useEffect, useRef, useState } from "react";
import {
  Box, IconButton, LinearProgress, Stack, Typography, Menu, MenuItem, Tooltip,
} from "@mui/material";
import {
  Headphones, PlayArrow, Pause, Stop, SkipNext, SkipPrevious, Speed, Close,
} from "@mui/icons-material";

// Floating "now playing" bar for the blog reader's text-to-speech. Purely
// presentational against the useTextToSpeech hook's state — the parent owns the
// engine and passes state + controls down. Sits fixed at the bottom of the
// viewport so it stays reachable while the reader scrolls.
//
// Two side effects live here because they need the DOM of the article body:
//   1. Auto-scroll the page to the paragraph being spoken.
//   2. Highlight that paragraph with a left accent (`.tts-active`).
// Both are best-effort (wrapped in try/catch + guard against a missing ref) so a
// quirky DOM never breaks playback.

const RATES = [0.75, 1, 1.25, 1.5, 2];

const ListenToBlogBar = ({
  contentRef,
  title,
  speaking,
  paused,
  rate,
  setRate,
  currentChunk,
  totalChunks,
  currentText,
  onToggle,
  onStop,
  onNext,
  onPrev,
}) => {
  const speedAnchor = useRef(null);
  const [speedOpen, setSpeedOpen] = useState(false);

  // Highlight + scroll-to the paragraph whose text contains the sentence
  // currently being spoken. Matching is by substring of the first ~60 chars,
  // which is robust to chunk boundaries splitting a paragraph.
  useEffect(() => {
    if (!speaking || !currentText) return;
    const root = contentRef?.current;
    if (!root) return;
    try {
      root.querySelectorAll(".tts-active").forEach((el) => el.classList.remove("tts-active"));
      const els = [...root.querySelectorAll("p, h1, h2, h3, h4, li, blockquote")];
      const probe = currentText.slice(0, 60);
      const match = els.find((el) => (el.textContent || "").includes(probe));
      if (match) {
        match.classList.add("tts-active");
        match.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } catch {
      // DOM shape unexpected — audio keeps going, just without the highlight.
    }
  }, [currentText, speaking, contentRef]);

  // If the reader navigates away or stops, drop any highlight we left behind.
  useEffect(() => {
    if (speaking || paused) return;
    const root = contentRef?.current;
    if (!root) return;
    try { root.querySelectorAll(".tts-active").forEach((el) => el.classList.remove("tts-active")); } catch {}
  }, [speaking, paused, contentRef]);

  const pct = totalChunks > 0 ? ((currentChunk + 1) / totalChunks) * 100 : 0;

  return (
    <Box
      sx={{
        position: "fixed",
        left: "50%",
        bottom: { xs: 16, sm: 24 },
        transform: "translateX(-50%)",
        width: { xs: "calc(100vw - 24px)", sm: "min(680px, 92vw)" },
        zIndex: 1250,
        // Glassy surface that matches the app's card language; stays legible
        // over any article image.
        bgcolor: (t) => (t.palette.mode === "dark" ? "rgba(33,29,24,0.92)" : "rgba(255,255,255,0.92)"),
        backdropFilter: "blur(12px)",
        border: (t) => `1px solid ${t.palette.divider}`,
        borderRadius: 3,
        boxShadow: 12,
        px: 2,
        py: 1.25,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Headphones color="primary" />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", lineHeight: 1.2 }}>
            {title ? `Listen — ${title}` : "Listen to this blog"}
            {paused ? "  (paused)" : ""}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              color: "text.primary",
              lineHeight: 1.3,
            }}
          >
            {currentText || (speaking ? "…" : "Ready to listen")}
          </Typography>
        </Box>

        <Tooltip title="Speed">
          <IconButton ref={speedAnchor} size="small" onClick={() => setSpeedOpen(true)} aria-label="Reading speed">
            <Speed fontSize="small" />
          </IconButton>
        </Tooltip>
        <Menu anchorEl={speedAnchor.current} open={speedOpen} onClose={() => setSpeedOpen(false)}>
          {RATES.map((r) => (
            <MenuItem key={r} selected={r === rate} onClick={() => { setRate(r); setSpeedOpen(false); }}>
              {r}×
            </MenuItem>
          ))}
        </Menu>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{ mt: 1, height: 4, borderRadius: 2, bgcolor: "action.hover" }}
      />

      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mt: 1 }}>
        <IconButton size="small" onClick={onPrev} disabled={!speaking && !paused} aria-label="Previous sentence">
          <SkipPrevious fontSize="small" />
        </IconButton>
        <IconButton onClick={onToggle} color="primary" aria-label={speaking && !paused ? "Pause" : "Play"}>
          {speaking && !paused ? <Pause /> : <PlayArrow />}
        </IconButton>
        <IconButton size="small" onClick={onNext} disabled={!speaking && !paused} aria-label="Next sentence">
          <SkipNext fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={onStop} disabled={!speaking && !paused} aria-label="Stop">
          <Stop fontSize="small" />
        </IconButton>
        <Typography variant="caption" sx={{ color: "text.secondary", ml: 1, minWidth: 56, textAlign: "right" }}>
          {totalChunks ? `${currentChunk + 1} / ${totalChunks}` : ""}
        </Typography>
        <IconButton size="small" onClick={onStop} aria-label="Close player" sx={{ ml: 0.5 }}>
          <Close fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  );
};

export default ListenToBlogBar;