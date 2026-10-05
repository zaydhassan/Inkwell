import React from "react";
import { Box, Typography } from "@mui/material";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import { CountUp } from "../ink/InkReveal";
import { readingStreak, heatmapCells, heatTotal, heatLabel, absoluteDay, ranked } from "./insights";

/* ─────────────────────────────────────────────────────────────────────
   Reading History — the right rail ("Your reading journey").

   Three cards, all fed by the server's whole-history aggregation, so none
   of them can be understated by the grid's pagination:

     • Streak — consecutive days read, plus the longest run and the
       average per week. A zero streak is stated plainly rather than
       dressed up; there is no "keep it up!" copy on a number that is 0.
     • Top topics — the categories the reader actually reads most, with a
       bar scaled to the leader.
     • Reading activity — a 30-day contribution grid.

   Cards with nothing to show are omitted entirely rather than rendered as
   empty shells (the page-level empty state covers the no-history case).
   ───────────────────────────────────────────────────────────────────── */

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const RailCard = ({ title, sub, children, className = "" }) => (
  <Box component="section" className={`ink-rh-railcard ${className}`.trim()} aria-label={title}>
    <Typography component="h2" className="ink-rh-railcard-title">
      {title}
    </Typography>
    {sub && <Typography className="ink-rh-railcard-sub">{sub}</Typography>}
    {children}
  </Box>
);

export const StreakCard = ({ summary, now = Date.now() }) => {
  const { current, longest, daysRead } = readingStreak(summary.days || [], now);
  const since = absoluteDay(summary.firstReadAt);

  return (
    <RailCard title="Reading streak" className="ink-rh-streak">
      <Box className="ink-rh-streak-top">
        <Box className={`ink-rh-flame${current > 0 ? " is-lit" : ""}`} aria-hidden="true">
          <LocalFireDepartmentIcon />
        </Box>
        <Box>
          <Typography className="ink-rh-streak-num">
            {current > 0 ? <CountUp to={current} started /> : "0"}
            <span className="ink-rh-streak-unit">{current === 1 ? "day" : "days"}</span>
          </Typography>
          <Typography className="ink-rh-streak-cap">
            {current > 0 ? "Reading every day, right now" : "No streak going yet"}
          </Typography>
        </Box>
      </Box>

      <Box className="ink-rh-railtable">
        <Box className="ink-rh-railrow">
          <span>Longest streak</span>
          <strong>{longest > 0 ? `${longest} ${longest === 1 ? "day" : "days"}` : "—"}</strong>
        </Box>
        <Box className="ink-rh-railrow">
          <span>Days with reading</span>
          <strong>{daysRead}</strong>
        </Box>
        {summary.perWeek !== null && summary.perWeek !== undefined && (
          <Box className="ink-rh-railrow">
            <span>Average per week</span>
            <strong>{summary.perWeek}</strong>
          </Box>
        )}
        {since && (
          <Box className="ink-rh-railrow">
            <span>Reading since</span>
            <strong>{since}</strong>
          </Box>
        )}
      </Box>
    </RailCard>
  );
};

export const TopicsCard = ({ topics = [] }) => {
  const top = ranked(topics, 5);
  if (top.length === 0) return null;

  return (
    <RailCard title="Top topics" sub="Where your reading actually goes">
      <Box className="ink-rh-topics">
        {top.map((topic) => (
          <Box className="ink-rh-topic" key={topic.name}>
            <Box className="ink-rh-topic-head">
              <Typography component="span" className="ink-rh-topic-name">
                {topic.name}
              </Typography>
              <Typography component="span" className="ink-rh-topic-count">
                {topic.count}
              </Typography>
            </Box>
            <Box className="ink-rh-topic-rail">
              <Box className="ink-rh-topic-fill" sx={{ width: `${topic.pct}%` }} />
            </Box>
          </Box>
        ))}
      </Box>
    </RailCard>
  );
};

export const ActivityCard = ({ heat = [], now = Date.now() }) => {
  const cells = heatmapCells(heat, now, 30);
  if (cells.every((c) => !c)) return null;
  const total = heatTotal(heat);

  return (
    <RailCard
      title="Reading activity"
      sub={total > 0 ? `${total} article${total === 1 ? "" : "s"} in the last 30 days` : "The last 30 days"}
    >
      <Box className="ink-rh-heat" role="img" aria-label={`Reading activity, last 30 days: ${total} articles`}>
        <Box className="ink-rh-heat-days" aria-hidden="true">
          {WEEKDAYS.map((d, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <span key={i}>{d}</span>
          ))}
        </Box>
        <Box className="ink-rh-heat-grid">
          {cells.map((cell, i) =>
            cell ? (
              <Box
                // eslint-disable-next-line react/no-array-index-key
                key={cell.key}
                component="span"
                className={`ink-rh-heat-cell lvl-${cell.level}`}
                title={heatLabel(cell, now)}
              />
            ) : (
              // eslint-disable-next-line react/no-array-index-key
              <Box component="span" key={`pad-${i}`} className="ink-rh-heat-cell is-pad" />
            )
          )}
        </Box>
      </Box>
      <Box className="ink-rh-heat-legend">
        <span>Less</span>
        <Box component="span" className="ink-rh-heat-cell lvl-0" />
        <Box component="span" className="ink-rh-heat-cell lvl-1" />
        <Box component="span" className="ink-rh-heat-cell lvl-2" />
        <Box component="span" className="ink-rh-heat-cell lvl-3" />
        <Box component="span" className="ink-rh-heat-cell lvl-4" />
        <span>More</span>
      </Box>
    </RailCard>
  );
};
