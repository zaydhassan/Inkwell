import React from "react";
import ScheduleIcon from "@mui/icons-material/Schedule";
import WritePanel from "./WritePanel";
import { InkField, InkGhostButton } from "../ink";

/* ─────────────────────────────────────────────────────────────────────
   Schedule — publish automatically at a later time.

   Two native inputs instead of one `datetime-local`, because the single
   control is awkward to use and impossible to label per part on a dark
   canvas. They stay purely presentational: the parent keeps `scheduledFor`
   as the one "YYYY-MM-DDTHH:mm" string it submits, so the request body and
   its future-date validation are untouched.

   The server stores a scheduled post as a Draft and promotes it at the
   chosen time (see promoteScheduledBlogs) — hence the wording below.
   ───────────────────────────────────────────────────────────────────── */

const SchedulePanel = ({ date, time, onDateChange, onTimeChange, onSchedule, disabled, busy }) => (
  <WritePanel
    id="schedule"
    icon={<ScheduleIcon sx={{ fontSize: 18 }} />}
    title="Schedule"
    meta={date && time ? "Set" : "Optional"}
  >
    <p className="ink-panel-hint">
      Held as a draft and published automatically at the time you choose.
    </p>

    <div className="ink-sched-row">
      <InkField label="Date" name="schedule-date" type="date" value={date} onChange={onDateChange} />
      <InkField label="Time" name="schedule-time" type="time" value={time} onChange={onTimeChange} />
    </div>

    <InkGhostButton onClick={onSchedule} disabled={disabled} sx={{ width: "100%", minHeight: 46 }}>
      {busy ? "Scheduling…" : "Schedule"}
    </InkGhostButton>
  </WritePanel>
);

export default SchedulePanel;
