import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { Link } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import PreviewIcon from "@mui/icons-material/VisibilityOutlined";
import SaveIcon from "@mui/icons-material/Save";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { InkGhostButton, InkPrimaryButton } from "../ink";

/* ─────────────────────────────────────────────────────────────────────
   Studio top bar — 64px, glass-quiet, three zones.

   LEFT    feather + "Back to Home" (nav is hidden on this route — the
           studio IS the page).
   CENTER  the REAL autosave readout. Nothing here is decorative: it renders
           the page's actual saveState, and the "Xs ago" line ticks off the
           timestamp the page records when a write lands. No fake states.
   RIGHT   the live word / read-time figures, then Preview · Save Draft ·
           Publish — the same handlers the page used before, same disabled
           and "Saving…/Scheduling…/Publishing…" labels.

   The tick re-renders the label only; the saved timestamp comes from state
   the page owns.
   ───────────────────────────────────────────────────────────────────── */

const agoLabel = (savedAt, now) => {
  const secs = Math.max(0, Math.round((now - savedAt) / 1000));
  if (secs < 10) return "just now";
  if (secs < 90) return `${Math.floor(secs / 10) * 10}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
};

const StudioTopBar = ({
  saveState,
  lastSavedAt,
  hasDraftContent,
  draftKey,
  wordCount,
  readingTime,
  submittingStatus,
  onSaveDraft,
  onPublish,
  onPreview,
  onOpenAi,
  aiOpen,
}) => {
  const busy = submittingStatus !== null;
  // Ticks only while it matters: a 10s interval keeps "just now"/"40s ago"
  // honest, and it stops entirely when there is nothing to count from.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const needed = Boolean(draftKey) && (saveState === "saving" || lastSavedAt);
    if (!needed) return undefined;
    const id = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(id);
  }, [draftKey, saveState, lastSavedAt]);
  useEffect(() => setNow(Date.now()), [saveState]);

  const saving = saveState === "saving";
  const showSave = Boolean(draftKey) && (saving || (saveState === "saved" && hasDraftContent));

  return (
    <header className="ist-topbar" role="banner">
      <div className="ist-topbar-left">
        <Link to="/" className="ist-topbar-home" aria-label="Back to Home">
          <ArrowBackIcon className="ist-topbar-back-icon" />
        </Link>
        <span className="ist-topbar-brand" aria-hidden="true">
          inkwell
        </span>
        <span className="ist-topbar-divider" aria-hidden="true" />
        <span className="ist-topbar-context">Writing studio</span>
      </div>

      <div className="ist-topbar-center">
        {showSave ? (
          <span
            className={`ist-save-chip${saving ? " is-saving" : " is-saved"}`}
            role="status"
            aria-live="polite"
          >
            {saving ? (
              <CloudUploadIcon className="ist-save-icon" />
            ) : (
              <CloudDoneIcon className="ist-save-icon" />
            )}
            {saving
              ? "Saving…"
              : lastSavedAt
              ? `Autosaved ${agoLabel(lastSavedAt, now)}`
              : "Saved"}
          </span>
        ) : null}
      </div>

      <div className="ist-topbar-right">
        <span className="ist-topbar-stats">
          {wordCount} words <span aria-hidden="true">•</span> {readingTime} min read
        </span>

        <div className="ist-topbar-actions">
          <InkGhostButton
            className="ist-topbar-btn ist-topbar-preview"
            onClick={onPreview}
            startIcon={<PreviewIcon sx={{ fontSize: 17 }} />}
            aria-haspopup="dialog"
          >
            <span className="ist-btn-label">Preview</span>
          </InkGhostButton>
          <InkGhostButton
            className="ist-topbar-btn"
            onClick={onSaveDraft}
            disabled={busy}
            startIcon={<SaveIcon sx={{ fontSize: 17 }} />}
            aria-label={
              submittingStatus === "Draft"
                ? "Saving…"
                : submittingStatus === "Schedule"
                ? "Scheduling…"
                : "Save Draft"
            }
          >
            <span className="ist-btn-label">
              {submittingStatus === "Draft"
                ? "Saving…"
                : submittingStatus === "Schedule"
                ? "Scheduling…"
                : "Save Draft"}
            </span>
          </InkGhostButton>
          <InkPrimaryButton
            className="ist-topbar-btn ist-topbar-publish"
            onClick={onPublish}
            disabled={busy}
            endIcon={<ArrowForwardIcon sx={{ fontSize: 17 }} />}
          >
            {submittingStatus === "Published" ? "Publishing…" : "Publish"}
          </InkPrimaryButton>
        </div>

        <button
          type="button"
          className="ist-topbar-ai-fab"
          onClick={onOpenAi}
          aria-expanded={aiOpen}
          aria-label="Open InkWell AI"
        >
          ✦
        </button>
      </div>
    </header>
  );
};

export default StudioTopBar;