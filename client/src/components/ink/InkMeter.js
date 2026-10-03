import React from "react";
import { Box } from "@mui/material";

/* ─────────────────────────────────────────────────────────────────────
   InkWell meter — the system's one progress rail.

   Level progress on the Profile hero and the daily writing goal both render
   through this, so a progress bar looks the same wherever it appears rather
   than being hand-matched per surface. The fill transition is disabled
   under `prefers-reduced-motion` in inkwell.css.
   ───────────────────────────────────────────────────────────────────── */

const InkMeter = ({ value = 0, label, className = "", sx }) => {
  // Clamp rather than trust the caller: a stale or oversized value would
  // otherwise push the fill outside the rail.
  const pct = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <Box
      className={`ink-meter ${className}`.trim()}
      sx={sx}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <Box className="ink-meter-fill" sx={{ width: `${pct}%` }} />
    </Box>
  );
};

export default InkMeter;
