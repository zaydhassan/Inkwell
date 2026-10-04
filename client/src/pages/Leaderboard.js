import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Box } from "@mui/material";
import { InkBackdrop, Reveal } from "../components/ink";
import {
  BoardSkeleton,
  LeaderboardEmpty,
  LeaderboardError,
  LeaderboardHero,
  RailSkeleton,
  RisingWriters,
  TopTopics,
  TopWritersBoard,
} from "../components/leaderboard";
import { useAuth } from "../context/AuthContext";
import "./Leaderboard.css";

/* ─────────────────────────────────────────────────────────────────────
   InkWell — Leaderboard.

   The page is a presentation of whatever the leaderboard endpoint already
   ranks; it computes nothing itself. One request per time filter returns
   both boards plus the rail's data, so switching Writers/Readers is purely
   local and switching the window is a single refetch.

   REAL DATA OR NO DATA is the rule this page is built on:
     • Every figure on screen comes from the database — the boards' metrics,
       the rising writers' seven-day point gains, and the topic counts.
     • There is no fallback set of demo competitors. An empty board is an
       empty state with a route into writing, not a fabricated top ten.
     • The hero's podium shows the real top three, or abstract circles.

   Layout: a two-column hero (copy · trophy stage), then the board table at
   68% beside the rail at 32%. On tablet both stacks to one column, and on
   phones the table sheds its low-priority metric columns rather than
   squeezing them.
   ───────────────────────────────────────────────────────────────────── */

const EMPTY = { topWriters: [], topReaders: [], risingWriters: [], topTopics: [] };

const Leaderboard = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState("all");
  const [group, setGroup] = useState("writers"); // writers | readers
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchLeaderboard = useCallback(async (p) => {
    setLoading(true);
    try {
      const { data: res } = await axios.get(`/api/v1/user/leaderboard?period=${p}`);
      if (res.success) {
        setData({
          topWriters: res.topWriters || [],
          topReaders: res.topReaders || [],
          risingWriters: res.risingWriters || [],
          topTopics: res.topTopics || [],
        });
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
  const boardEmpty = rows.length === 0;
  // The board can be empty while the rail still has real things to say (an
  // active platform whose writers simply have not earned points yet). The
  // full-page empty state is reserved for the case where there is genuinely
  // nothing on the page at all.
  const railEmpty = data.risingWriters.length === 0 && data.topTopics.length === 0;

  return (
    <Box className="ink ink-leaderboard" component="main">
      {/* The 54px grid, the grain and the drifting warm glow — the same
          backdrop the other editorial pages mount, with the tighter hero
          grid this page's spec calls for. */}
      <InkBackdrop hero drift />

      <div className="ink-lb-wrap">
        <LeaderboardHero
          period={period}
          onPeriodChange={setPeriod}
          group={group}
          onGroupChange={setGroup}
          rows={rows}
          loading={loading}
          failed={error}
        />

        {error ? (
          <div className="ink-lb-card">
            <LeaderboardError onRetry={() => fetchLeaderboard(period)} />
          </div>
        ) : loading ? (
          <div className="ink-lb-layout">
            <BoardSkeleton />
            <aside className="ink-lb-rail">
              <RailSkeleton />
            </aside>
          </div>
        ) : boardEmpty && railEmpty ? (
          <div className="ink-lb-card">
            <LeaderboardEmpty group={group} />
          </div>
        ) : (
          <div className="ink-lb-layout">
            {boardEmpty ? (
              <div className="ink-lb-card">
                <LeaderboardEmpty group={group} />
              </div>
            ) : (
              <TopWritersBoard rows={rows} group={group} currentUserId={user?._id} />
            )}

            <aside className="ink-lb-rail" aria-label="Trends on InkWell">
              <Reveal y={18}>
                <RisingWriters rows={data.risingWriters} />
              </Reveal>
              <Reveal y={18} delay={0.08}>
                <TopTopics topics={data.topTopics} period={period} />
              </Reveal>
            </aside>
          </div>
        )}
      </div>
    </Box>
  );
};

export default Leaderboard;
