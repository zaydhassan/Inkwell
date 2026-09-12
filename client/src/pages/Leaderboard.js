import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Box, Tabs, Tab, ToggleButtonGroup, ToggleButton, Typography, Stack, Button, Skeleton } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import SectionHeading from "../components/SectionHeading";
import LeaderboardCard from "../components/LeaderboardCard";
import LeaderboardPodium from "../components/LeaderboardPodium";
import { useAuth } from "../context/AuthContext";

const PERIODS = [
  { key: "all", label: "All Time" },
  { key: "month", label: "This Month" },
  { key: "week", label: "This Week" },
];

// Loading skeleton: podium steps + list rows, mirroring the real layout.
const LeaderboardSkeleton = () => (
  <Box>
    <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: { xs: 1.5, sm: 3 }, mt: 2 }}>
      {[2, 1, 3].map((rank) => (
        <Stack key={rank} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
          <Skeleton variant="circular" width={rank === 1 ? 76 : 58} height={rank === 1 ? 76 : 58} sx={{ mb: 1.5 }} />
          <Skeleton variant="text" width={90} />
          <Skeleton variant="text" width={54} />
          <Skeleton
            variant="rounded"
            width={rank === 1 ? 150 : 126}
            height={rank === 1 ? 132 : rank === 2 ? 104 : 88}
            sx={{ borderRadius: "14px 14px 0 0", mt: 1 }}
          />
        </Stack>
      ))}
    </Box>
    <Box sx={{ mt: 4 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Stack key={i} direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <Skeleton variant="text" width={22} />
          <Skeleton variant="circular" width={30} height={30} />
          <Skeleton variant="text" width={160} sx={{ flex: 1 }} />
          <Skeleton variant="text" width={54} />
        </Stack>
      ))}
    </Box>
  </Box>
);

// Standalone leaderboard with All-time / Monthly / Weekly period tabs and a
// Writers / Readers toggle. The top three get a recognition podium (avatars,
// rank medals, points, badges); ranks 4–10 render as the shared list card.
const Leaderboard = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState("all");
  const [group, setGroup] = useState("writers"); // writers | readers
  const [data, setData] = useState({ topWriters: [], topReaders: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchLeaderboard = useCallback(async (p) => {
    setLoading(true);
    try {
      const { data: res } = await axios.get(`/api/v1/user/leaderboard?period=${p}`);
      if (res.success) {
        setData({ topWriters: res.topWriters || [], topReaders: res.topReaders || [] });
        setError(false);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard(period);
  }, [period, fetchLeaderboard]);

  const rows = group === "writers" ? data.topWriters : data.topReaders;

  return (
    <Box sx={{ minHeight: "100vh", p: { xs: 2, md: 4 } }}>
      <SectionHeading
        eyebrow="Community standouts"
        title="Leaderboard"
        subtitle="Celebrating the creators and readers who make InkWell thrive — all-time, or the last 30 / 7 days."
        badge
        align="center"
        sx={{ mb: 3 }}
      />

      <Box sx={{ maxWidth: 720, mx: "auto" }}>
        {/* Period tabs */}
        <Tabs
          value={period}
          onChange={(_, v) => setPeriod(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2 }}
        >
          {PERIODS.map((p) => (
            <Tab key={p.key} value={p.key} label={p.label} />
          ))}
        </Tabs>

        {/* Writers / Readers toggle */}
        <ToggleButtonGroup
          value={group}
          exclusive
          onChange={(_, v) => v && setGroup(v)}
          size="small"
          sx={{ mb: 2, display: "flex", justifyContent: "center" }}
        >
          <ToggleButton value="writers" sx={{ textTransform: "none", fontWeight: 700 }}>Writers</ToggleButton>
          <ToggleButton value="readers" sx={{ textTransform: "none", fontWeight: 700 }}>Readers</ToggleButton>
        </ToggleButtonGroup>

        {loading ? (
          <LeaderboardSkeleton />
        ) : error ? (
          <Stack spacing={1.5} alignItems="center" sx={{ py: 6 }}>
            <Typography color="text.secondary">Couldn't load the leaderboard. Please try again.</Typography>
            <Button variant="outlined" onClick={() => fetchLeaderboard(period)}>Retry</Button>
          </Stack>
        ) : rows.length === 0 ? (
          <Stack spacing={1} alignItems="center" sx={{ py: 5 }}>
            <EmojiEventsIcon sx={{ fontSize: 44, color: "text.secondary" }} />
            <Typography variant="h6">No {group} on the board yet</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {period === "all"
                ? "Start writing and engaging to claim a spot."
                : "No activity in this window — keep going!"}
            </Typography>
          </Stack>
        ) : (
          <>
            <LeaderboardPodium rows={rows} />
            {rows.length > 3 && (
              <LeaderboardCard
                title={`${group === "writers" ? "Top Writers" : "Top Readers"} · 4–${rows.length}`}
                rows={rows.slice(3)}
                currentUserId={user?._id}
              />
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default Leaderboard;