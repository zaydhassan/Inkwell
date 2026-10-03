import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Box, CircularProgress, Stack, Tooltip } from "@mui/material";
import { Whatshot as FireIcon } from "@mui/icons-material";
import toast from "react-hot-toast";
import { toastGoal } from "../utils/toasts";
import { useSelector } from "react-redux";
import { InkMeter, InkPrimaryButton } from "./ink";
import "./WritingStreak.css";

// Writing streak + daily word-count goal.
//
// Two exports:
//   <StreakChip />            — compact "🔥 N-day · today X/goal" for the
//                               editor header. Defaults to the LIGHT app theme
//                               (MUI theme tokens) because Edit Blog is still a
//                               light page. Create Blog is on the dark editorial
//                               canvas and opts in with `tone="ink"`, which
//                               swaps the hardcoded light values for --ink-*
//                               tokens. The light path is the default and is
//                               byte-identical to before, so EditBlog is
//                               unaffected.
//   <WritingStreakCard />     — the Profile page's Writing Activity body:
//                               streak figures, 12-week contribution
//                               heatmap, daily-goal setter. Rendered with
//                               InkWell classes, so it needs an `.ink`
//                               ancestor. It carries no heading of its own —
//                               the Profile section supplies "Writing streak"
//                               so the two can't disagree.
//
// Both fetch GET /api/v1/writing/stats (auth, self). The card additionally
// PUTs /api/v1/writing/goal to change the goal.

// Map a day's word count to a 0–4 heatmap level relative to the goal.
// The level → colour ramp lives in WritingStreak.css as --ink-heat-*.
const levelFor = (words, goal) => {
  if (!words || words <= 0) return 0;
  if (!goal || goal <= 0) return words > 0 ? 2 : 0;
  const r = words / goal;
  if (r >= 1) return 4;
  if (r >= 0.75) return 3;
  if (r >= 0.5) return 2;
  if (r >= 0.25) return 1;
  return 1;
};

const useWritingStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const isLogin = useSelector((state) => state.auth.isLogin);
  const fetchStats = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/v1/writing/stats");
      if (data.success) setStats(data);
    } catch {
      /* silent — chip/card just stay empty */
    } finally {
      setLoading(false);
    }
  }, []);
  // Only fetch for a signed-in writer. Without this gate the chip's request
  // fires for every anonymous visitor of any page it lives on, and the
  // axios interceptor bounces them to /login — a stats fetch redirecting
  // someone who never asked for auth.
  useEffect(() => { if (isLogin) fetchStats(); }, [isLogin, fetchStats]);
  return { stats, loading, fetchStats };
};

// ---- Compact chip for the editor header ----
// `tone="ink"` is for the dark editorial canvas (Create Blog). It cannot be
// done with a wrapper class: every value below is inline `sx`, which outranks
// any stylesheet rule, so the tone has to be chosen here.
export const StreakChip = ({ tone = "light" }) => {
  const { stats } = useWritingStats();
  if (!stats) return null;
  const goal = stats.dailyGoal || 500;
  const pct = Math.min(100, Math.round((stats.todayWords / goal) * 100));
  const ink = tone === "ink";
  return (
    <Tooltip title={`Today: ${stats.todayWords}/${goal} words · longest streak ${stats.longestStreak} days`}>
      <Stack
        direction="row"
        spacing={0.75}
        alignItems="center"
        sx={{
          px: 1.25, py: 0.5, borderRadius: 999,
          background: ink ? "rgba(255,255,255,0.04)" : "rgba(17,17,17,0.06)",
          border: ink ? "1px solid var(--ink-border)" : "1px solid rgba(17,17,17,0.12)",
          fontSize: 13, fontWeight: 600,
          color: ink ? "var(--ink-text-2)" : "text.primary",
          whiteSpace: "nowrap",
        }}
      >
        <FireIcon sx={{ fontSize: 18, color: ink ? "var(--ink-orange)" : "primary.main" }} />
        <span>{stats.currentStreak}-day</span>
        <Box component="span" sx={{ opacity: 0.7, fontWeight: 500 }}>
          {stats.todayWords}/{goal}
        </Box>
        {pct >= 100 && <span title="Goal hit!">🎯</span>}
      </Stack>
    </Tooltip>
  );
};

// ---- Contribution heatmap (12 weeks) ----
// Exported so the Activity section can lay it out without a second
// /writing/stats fetch. Grid geometry and the orange ramp live in
// WritingStreak.css, keyed by each cell's data-level.
export const ContributionHeatmap = ({ history, dailyGoal }) => {
  if (!history || !history.length) return null;

  // Align by weekday: pad the first partial week so columns are weeks and
  // rows are Sun–Sat, exactly like GitHub's contribution graph.
  const startWeekday = new Date(history[0].date).getDay();
  const cells = [];
  for (let p = 0; p < startWeekday; p++) cells.push(null);
  history.forEach((d) => cells.push(d));

  const fmt = (date) =>
    new Date(date).toLocaleDateString([], { month: "short", day: "numeric" });
  const total = history.reduce((sum, d) => sum + (d.words || 0), 0);

  return (
    <div className="ink-heatmap-wrap">
      <div className="ink-heatmap-row">
        {/* Seven slots holding Sun–Sat so the three visible labels sit level
            with their own rows rather than being evenly spread. */}
        <div className="ink-heatmap-days" aria-hidden="true">
          {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>

        {/* One image to assistive tech with a summary label: 91 individually
            focusable cells would be a worse experience than the total. The
            per-cell `title` covers pointer users on hover. */}
        <div
          className="ink-heatmap"
          role="img"
          aria-label={`Writing activity: ${total} words over the last ${history.length} days, ${fmt(
            history[0].date
          )} to ${fmt(history[history.length - 1].date)}`}
        >
          {cells.map((cell, i) =>
            cell ? (
              <span
                key={i}
                className="ink-heatmap-cell"
                data-level={levelFor(cell.words, dailyGoal)}
                title={`${cell.words} words · ${fmt(cell.date)}`}
              />
            ) : (
              <span key={i} className="ink-heatmap-cell is-pad" aria-hidden="true" />
            )
          )}
        </div>
      </div>

      <div className="ink-heatmap-legend" aria-hidden="true">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((lvl) => (
          <span key={lvl} className="ink-heatmap-cell" data-level={lvl} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
};

// ---- Full card for the Profile page ----
export const WritingStreakCard = () => {
  const { stats, loading, fetchStats } = useWritingStats();
  const [goalInput, setGoalInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (stats) setGoalInput(String(stats.dailyGoal || 500));
  }, [stats]);

  const saveGoal = async () => {
    const goal = Number(goalInput);
    if (!Number.isFinite(goal) || goal < 50 || goal > 10000) {
      toast.error("Goal must be between 50 and 10,000 words.");
      return;
    }
    setSaving(true);
    try {
      const { data } = await axios.put("/api/v1/writing/goal", { goal });
      if (data.success) {
        toastGoal();
        await fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't update goal.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="ink-streak-loading">
        <CircularProgress size={26} sx={{ color: "var(--ink-orange)" }} />
      </div>
    );
  }
  if (!stats) return null;

  const goal = stats.dailyGoal || 500;
  const pct = Math.min(100, Math.round((stats.todayWords / goal) * 100));

  return (
    <div className="ink-streak">
      <div className="ink-streak-figures">
        <div className="ink-streak-figure">
          <span className="ink-streak-value ink-streak-value--accent">
            {stats.currentStreak}
          </span>
          <span className="ink-streak-label">day streak</span>
        </div>

        <div className="ink-streak-figure">
          <span className="ink-streak-value">{stats.longestStreak}</span>
          <span className="ink-streak-label">best</span>
        </div>

        <div className="ink-streak-today">
          <div className="ink-streak-today-head">
            <span className="ink-streak-label">Today</span>
            <span className="ink-streak-today-count">
              {stats.todayWords}/{goal} words
            </span>
          </div>
          <InkMeter value={pct} label={`Today's writing goal — ${pct}% complete`} />
          {pct >= 100 && <span className="ink-streak-hit">🎯 Goal hit today</span>}
        </div>
      </div>

      <ContributionHeatmap history={stats.history} dailyGoal={goal} />

      <div className="ink-streak-goal">
        <span className="ink-streak-label" id="ink-streak-goal-label">
          Daily goal
        </span>
        <input
          type="number"
          className="ink-field-control ink-streak-goal-input"
          value={goalInput}
          onChange={(e) => setGoalInput(e.target.value)}
          min={50}
          max={10000}
          step={50}
          aria-labelledby="ink-streak-goal-label"
        />
        <span className="ink-streak-label">words/day</span>
        <InkPrimaryButton onClick={saveGoal} disabled={saving} sx={{ ml: "auto" }}>
          {saving ? "Saving…" : "Save"}
        </InkPrimaryButton>
      </div>
    </div>
  );
};

export default WritingStreakCard;
