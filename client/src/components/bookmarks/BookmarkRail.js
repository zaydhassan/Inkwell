import React from "react";
import { Link } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { CountUp } from "../ink/InkReveal";
import { ranked, relativeDay } from "../reading/insights";

/* ─────────────────────────────────────────────────────────────────────
   Bookmarks — the right rail ("Your library at a glance").

   Three cards, all fed by the server's whole-collection aggregation, so
   none of them can be understated by the grid's pagination or narrowed by
   the grid's active filters:

     • Your bookmark stats — saved articles, distinct topics, distinct
       writers, and the total estimated reading time.
     • Top topics — the categories actually saved most, with a bar scaled
       to the leader.
     • Recently bookmarked — the five most recent saves.

   Cards with nothing to show are omitted entirely rather than rendered as
   empty shells. The one deliberate exception is Top topics: a reader who
   has saved articles but no categorised ones yet gets a plain sentence
   instead of an empty chart.

   Nothing here is invented. Every figure is a number the summary endpoint
   aggregated, and the reading-time total is dropped — not shown as zero —
   when the server reports it as not measurable.
   ───────────────────────────────────────────────────────────────────── */

const RailCard = ({ title, sub, children, className = "" }) => (
  <Box component="section" className={`ink-bm-railcard ${className}`.trim()} aria-label={title}>
    <Typography component="h2" className="ink-bm-railcard-title">
      {title}
    </Typography>
    {sub && <Typography className="ink-bm-railcard-sub">{sub}</Typography>}
    {children}
  </Box>
);

export const StatsCard = ({ summary }) => {
  if (!summary || summary.savedCount === 0) return null;

  const minutes = summary.totalReadingMinutes;

  return (
    <RailCard title="Your bookmark stats" sub="Everything you've saved so far">
      <Box className="ink-bm-stats">
        <Box className="ink-bm-stat">
          <Typography className="ink-bm-stat-num">
            <CountUp to={summary.savedCount} started />
          </Typography>
          <Typography className="ink-bm-stat-label">
            {summary.savedCount === 1 ? "Saved article" : "Saved articles"}
          </Typography>
        </Box>
        <Box className="ink-bm-stat">
          <Typography className="ink-bm-stat-num">
            <CountUp to={summary.topicCount} started />
          </Typography>
          <Typography className="ink-bm-stat-label">
            {summary.topicCount === 1 ? "Topic" : "Topics"}
          </Typography>
        </Box>
        <Box className="ink-bm-stat">
          <Typography className="ink-bm-stat-num">
            <CountUp to={summary.writerCount} started />
          </Typography>
          <Typography className="ink-bm-stat-label">
            {summary.writerCount === 1 ? "Writer" : "Writers"}
          </Typography>
        </Box>
        {/* Only rendered when the server could measure every saved body. A
            partial sum would be a made-up figure, so `null` shows nothing. */}
        {minutes !== null && minutes !== undefined && (
          <Box className="ink-bm-stat">
            <Typography className="ink-bm-stat-num">{minutes}</Typography>
            <Typography className="ink-bm-stat-label">Minutes of reading</Typography>
          </Box>
        )}
      </Box>
    </RailCard>
  );
};

export const TopicsCard = ({ topics = [], hasSaves = false }) => {
  const top = ranked(topics, 5);

  if (top.length === 0) {
    // A library that exists but is uncategorised: say so, rather than draw
    // an empty chart with nothing in it.
    if (!hasSaves) return null;
    return (
      <RailCard title="Top topics">
        <Typography className="ink-bm-railcard-text">
          Keep saving stories to discover your favorite topics.
        </Typography>
      </RailCard>
    );
  }

  return (
    <RailCard title="Top topics" sub="What your library is mostly about">
      <Box className="ink-bm-topics">
        {top.map((topic) => (
          <Box className="ink-bm-topic" key={topic.name}>
            <Box className="ink-bm-topic-head">
              <Typography component="span" className="ink-bm-topic-name">
                {topic.name}
              </Typography>
              <Typography component="span" className="ink-bm-topic-count">
                {topic.count}
              </Typography>
            </Box>
            <Box className="ink-bm-topic-rail">
              <Box className="ink-bm-topic-fill" sx={{ width: `${topic.pct}%` }} />
            </Box>
          </Box>
        ))}
      </Box>
    </RailCard>
  );
};

export const RecentCard = ({ recent = [] }) => {
  if (recent.length === 0) return null;

  return (
    <RailCard title="Recently bookmarked" sub="Your newest saves, whatever the filters say">
      <Box className="ink-bm-recent">
        {recent.map((item) => {
          const when = relativeDay(item.bookmarkedAt);
          const meta = [when, item.readingMinutes ? `${item.readingMinutes} min read` : ""]
            .filter(Boolean)
            .join(" · ");
          return (
            <Box className="ink-bm-recentrow" key={item.id}>
              <Link className="ink-bm-recentlink" to={`/blog-details/${item.id}`}>
                <Box className="ink-bm-recentthumb">
                  {item.image ? (
                    <img src={item.image} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <Box className="ink-bm-recentthumb-fallback" aria-hidden="true" />
                  )}
                </Box>
                <Box className="ink-bm-recenttext">
                  <Typography component="span" className="ink-bm-recenttitle">
                    {item.title}
                  </Typography>
                  {meta && (
                    <Typography component="span" className="ink-bm-recentmeta">
                      {meta}
                    </Typography>
                  )}
                </Box>
              </Link>
            </Box>
          );
        })}
      </Box>
    </RailCard>
  );
};
