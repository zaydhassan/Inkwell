import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Box, Typography, Button, TextField, Tooltip, CircularProgress, Stack, LinearProgress,
} from "@mui/material";
import { Whatshot as FireIcon } from "@mui/icons-material";
import toast from "react-hot-toast";
import { toastGoal } from "../utils/toasts";

// Writing streak + daily word-count goal.
//
// Two exports:
//   <StreakChip />           — compact "🔥 N-day · today X/goal" for the
//                              CreateBlog / EditBlog editor header.
//   <WritingStreakCard />     — full Profile card: streak, longest, today's
//                              progress, a 12-week contribution heatmap, and a
//                              daily-goal setter.
//
// Both fetch GET /api/v1/writing/stats (auth, self). The card additionally
// PUTs /api/v1/writing/goal to change the goal.

const HEATMAP_LEVELS = [
  "rgba(120,120,120,0.10)", // 0 words
  "rgba(120,120,120,0.35)", // 1
  "rgba(120,120,120,0.55)", // 2
  "rgba(120,120,120,0.75)", // 3
  "rgba(120,120,120,0.95)", // 4
];

// Map a day's word count to a 0–4 heatmap level relative to the goal.
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
  useEffect(() => { fetchStats(); }, [fetchStats]);
  return { stats, loading, fetchStats };
};

// ---- Compact chip for the editor header ----
export const StreakChip = () => {
  const { stats } = useWritingStats();
  if (!stats) return null;
  const goal = stats.dailyGoal || 500;
  const pct = Math.min(100, Math.round((stats.todayWords / goal) * 100));
  return (
    <Tooltip title={`Today: ${stats.todayWords}/${goal} words · longest streak ${stats.longestStreak} days`}>
      <Stack
        direction="row"
        spacing={0.75}
        alignItems="center"
        sx={{
          px: 1.25, py: 0.5, borderRadius: 999,
          background: "rgba(17,17,17,0.06)",
          border: "1px solid rgba(17,17,17,0.12)",
          fontSize: 13, fontWeight: 600, color: "text.primary",
          whiteSpace: "nowrap",
        }}
      >
        <FireIcon sx={{ fontSize: 18, color: "primary.main" }} />
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
const Heatmap = ({ history, dailyGoal }) => {
  if (!history || !history.length) return null;
  // Align by weekday: pad the first partial week so columns are weeks and
  // rows are Sun–Sat, exactly like GitHub's contribution graph.
  const startWeekday = new Date(history[0].date).getDay();
  const cells = [];
  for (let p = 0; p < startWeekday; p++) cells.push(null);
  history.forEach((d) => cells.push(d));
  const totalCols = Math.ceil(cells.length / 7);

  return (
    <Box sx={{ display: "flex", gap: 2 }}>
      <Stack spacing={0.4} sx={{ fontSize: 10, color: "text.secondary", justifyContent: "space-between", pt: 0.2 }}>
        {["Mon", "Wed", "Fri"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </Stack>
      <Box sx={{ display: "flex", gap: 3, overflowX: "auto", pb: 0.5 }}>
        {Array.from({ length: totalCols }).map((_, col) => (
          <Stack key={col} direction="column" spacing={0.4}>
            {Array.from({ length: 7 }).map((_, row) => {
              const cell = cells[col * 7 + row];
              if (!cell) return <Box sx={{ width: 13, height: 13 }} />;
              const lvl = levelFor(cell.words, dailyGoal);
              return (
                <Tooltip
                  key={row}
                  title={`${cell.words} words · ${new Date(cell.date).toLocaleDateString([], { month: "short", day: "numeric" })}`}
                >
                  <Box
                    sx={{
                      width: 13, height: 13, borderRadius: 1,
                      bgcolor: HEATMAP_LEVELS[lvl],
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  />
                </Tooltip>
              );
            })}
          </Stack>
        ))}
      </Box>
    </Box>
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
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  if (!stats) return null;

  const goal = stats.dailyGoal || 500;
  const pct = Math.min(100, Math.round((stats.todayWords / goal) * 100));

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <FireIcon sx={{ color: "primary.main" }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Writing streak</Typography>
      </Stack>

      <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "primary.main", lineHeight: 1 }}>
            {stats.currentStreak}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>day streak</Typography>
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>
            {stats.longestStreak}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>longest</Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>Today</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              {stats.todayWords}/{goal}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={pct}
            sx={{
              height: 8, borderRadius: 5,
              bgcolor: "rgba(120,120,120,0.15)",
              "& .MuiLinearProgress-bar": { bgcolor: "primary.main" },
            }}
          />
          {pct >= 100 && (
            <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700 }}>
              🎯 Goal hit today!
            </Typography>
          )}
        </Box>
      </Stack>

      <Heatmap history={stats.history} dailyGoal={goal} />

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2.5 }}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>Daily goal:</Typography>
        <TextField
          type="number"
          size="small"
          value={goalInput}
          onChange={(e) => setGoalInput(e.target.value)}
          sx={{ width: 120 }}
          inputProps={{ min: 50, max: 10000, step: 50 }}
        />
        <Typography variant="caption" sx={{ color: "text.secondary" }}>words/day</Typography>
        <Button size="small" variant="contained" disabled={saving} onClick={saveGoal} sx={{ ml: "auto" }}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </Stack>
    </Box>
  );
};

export default WritingStreakCard;