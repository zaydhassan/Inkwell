import React from "react";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import UserAvatar from "../UserAvatar";
import { exactCount } from "./format";

/* ─────────────────────────────────────────────────────────────────────
   The leaderboard's right rail: two cards beside the main table.

   Rising Writers — the writers who earned the most points over the last
   seven days, showing the real points they earned. The spec asked for a
   growth indicator here; a percentage *is* shown nowhere, because the
   honest base for one is the previous seven-day window, which on a young
   ledger is a handful of points — "+300%" off a base of 4 points is
   arithmetic noise pretending to be a trend. The real seven-day gain is
   the same information without the invention. When nobody has earned
   anything in the window the card says exactly that.

   Top Topics — published-article counts per category, over whichever
   window the page's filter is on, straight from the Blog collection. The
   bar is each topic's share of the largest topic: a ratio of two real
   numbers, and never the only encoding of it (the count sits beside it in
   text, and the bar is hidden from assistive tech as a duplicate).
   ───────────────────────────────────────────────────────────────────── */

const PERIOD_COPY = {
  all: "Most popular topics across InkWell.",
  month: "Most popular topics in the last 30 days.",
  week: "Most popular topics in the last 7 days.",
};

export const RisingWriters = ({ rows = [] }) => (
  <div className="ink-lb-card">
    <div className="ink-lb-card-head">
      <div>
        <h2 className="ink-lb-card-title">Rising Writers</h2>
        <p className="ink-lb-card-sub">Creators gaining the most traction recently.</p>
      </div>
    </div>

    {rows.length === 0 ? (
      <p className="ink-lb-state-text">
        No writers have earned points in the last 7 days yet. The board fills in as people write and
        engage.
      </p>
    ) : (
      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {rows.map((entry, index) => (
          <li className="ink-lb-row" key={entry._id || index}>
            <UserAvatar
              src={entry.profile_image}
              name={entry.username}
              alt=""
              sx={{ width: 30, height: 30, fontSize: 12, flexShrink: 0 }}
            />
            <span className="ink-lb-row-name">{entry.username || "Unknown"}</span>
            <span
              className="ink-lb-trend"
              title={`Points earned in the last 7 days: ${exactCount(entry.points)}`}
            >
              <TrendingUpRoundedIcon sx={{ fontSize: 14 }} aria-hidden="true" />
              +{entry.points} pts
            </span>
          </li>
        ))}
      </ol>
    )}
  </div>
);

export const TopTopics = ({ topics = [], period = "all" }) => {
  // The largest count anchors the bars. It is read off real rows; when the
  // list is empty there is no bar to draw at all.
  const max = topics.reduce((highest, topic) => Math.max(highest, topic.count), 0);

  return (
    <div className="ink-lb-card">
      <div className="ink-lb-card-head">
        <div>
          <h2 className="ink-lb-card-title">🔥 Top Topics</h2>
          <p className="ink-lb-card-sub">{PERIOD_COPY[period] || PERIOD_COPY.all}</p>
        </div>
      </div>

      {topics.length === 0 ? (
        <p className="ink-lb-state-text">
          No stories have been published in this window yet.
        </p>
      ) : (
        topics.map((topic) => (
          <div className="ink-lb-topic" key={topic.category}>
            <div className="ink-lb-topic-top">
              <span className="ink-lb-topic-name">{topic.category}</span>
              <span className="ink-lb-topic-count">
                {topic.count} {topic.count === 1 ? "story" : "stories"}
              </span>
            </div>
            <div className="ink-lb-topic-bar" aria-hidden="true">
              <div
                className="ink-lb-topic-fill"
                style={{ width: max > 0 ? `${(topic.count / max) * 100}%` : "0%" }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
};
