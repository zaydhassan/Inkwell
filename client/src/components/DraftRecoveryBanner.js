import React from "react";
import { Alert, AlertTitle, Button, Stack } from "@mui/material";

// Coarse relative-time string ("just now", "3 min ago", "2 h ago", "yesterday")
// for the recovery banner. Kept dependency-free; full date formatting isn't
// worth pulling in a lib for a one-line label.
const relativeTime = (savedAt) => {
  if (!savedAt) return "earlier";
  const diff = Date.now() - savedAt;
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} h ago`;
  const day = Math.round(hr / 24);
  return day === 1 ? "yesterday" : `${day} days ago`;
};

// Action buttons for the ink tone. The default (light) path keeps MUI's
// `color="inherit"` styling untouched.
const INK_GHOST = {
  color: "var(--ink-text)",
  borderColor: "var(--ink-border)",
  "&:hover": { borderColor: "var(--ink-border-warm)", bgcolor: "var(--ink-orange-softer)" },
};
const INK_SOLID = {
  bgcolor: "var(--ink-orange)",
  color: "#17110C",
  "&:hover": { bgcolor: "var(--ink-orange-2)" },
};

// Presentational banner shown when an unsaved local draft is found on editor
// open. Parent controls visibility (rendered only when a recovery exists);
// this component just reports the time and offers Restore / Discard.
//
// `tone="ink"` restyles it for the dark editorial canvas (Create Blog), where
// MUI's filled-info blue would be the only cold surface on the page. The
// default `tone="light"` is what EditBlog still renders, unchanged. `sx`
// outranks the variant class, so the repaint needs no `!important`.
const DraftRecoveryBanner = ({ savedAt, onRestore, onDiscard, tone = "light" }) => {
  const ink = tone === "ink";

  return (
    <Alert
      severity="info"
      variant="filled"
      sx={{
        mb: 2,
        alignItems: "center",
        ...(ink
          ? {
              bgcolor: "var(--ink-card-hi)",
              backgroundImage: "none",
              color: "var(--ink-text)",
              border: "1px solid var(--ink-border)",
              "& .MuiAlert-icon": { color: "var(--ink-orange)" },
              "& .MuiAlertTitle-root": { color: "var(--ink-text)" },
            }
          : {}),
      }}
      action={
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Button
            color="inherit"
            size="small"
            variant="outlined"
            onClick={onDiscard}
            sx={ink ? INK_GHOST : undefined}
          >
            Discard
          </Button>
          <Button
            color="inherit"
            size="small"
            variant="contained"
            onClick={onRestore}
            sx={ink ? INK_SOLID : undefined}
          >
            Restore
          </Button>
        </Stack>
      }
    >
      <AlertTitle>Unsaved draft found</AlertTitle>
      We recovered unsaved edits from {relativeTime(savedAt)}. Restore them, or
      discard and start fresh. (An uploaded image isn&apos;t kept — please re-attach it.)
    </Alert>
  );
};

export default DraftRecoveryBanner;