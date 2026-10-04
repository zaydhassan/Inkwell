import React from "react";
import { Link } from "react-router-dom";
import { InkGhostButton, InkPrimaryButton } from "../ink";

/* ─────────────────────────────────────────────────────────────────────
   The leaderboard's three non-content states, kept in one file because
   they are the same decision seen three ways: what does this page show
   when it has no board to show?

     • loading — shimmer rows that mirror the real table's geometry, so
       the board swaps in without a layout jump. Never placeholder people.
     • error   — the spec's copy verbatim, with a retry.
     • empty   — the honest end of "REAL DATA OR NO DATA": a real platform
       with no ranked users says so and offers the action that changes it.
   ───────────────────────────────────────────────────────────────────── */

// Skeleton geometry mirrors `.ink-lb-table--writers`, so the columns line up
// with the rows that replace them.
export const BoardSkeleton = () => (
  <div className="ink-lb-card ink-lb-table--writers" aria-busy="true" aria-live="polite">
    <span
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        overflow: "hidden",
        clip: "rect(0 0 0 0)",
        whiteSpace: "nowrap",
      }}
    >
      Loading the leaderboard…
    </span>

    <div className="ink-lb-card-head">
      <div>
        <div className="ink-lb-skel" style={{ width: 148, height: 18 }} />
        <div className="ink-lb-skel" style={{ width: 240, height: 11, marginTop: 10 }} />
      </div>
    </div>

    {Array.from({ length: 6 }).map((_, i) => (
      <div className="ink-lb-skel-row" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
        <div className="ink-lb-skel" style={{ width: 30, height: 30, borderRadius: 10 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="ink-lb-skel" style={{ width: 34, height: 34, borderRadius: "50%" }} />
          <div className="ink-lb-skel" style={{ width: 128, height: 12 }} />
        </div>
        <div className="ink-lb-skel ink-lb-col-stories" style={{ width: 40, height: 11, marginLeft: "auto" }} />
        <div className="ink-lb-skel ink-lb-col-reads" style={{ width: 40, height: 11, marginLeft: "auto" }} />
        <div className="ink-lb-skel ink-lb-col-likes" style={{ width: 40, height: 11, marginLeft: "auto" }} />
        <div className="ink-lb-skel ink-lb-col-followers" style={{ width: 40, height: 11, marginLeft: "auto" }} />
        <div className="ink-lb-skel" style={{ width: 44, height: 11, marginLeft: "auto" }} />
      </div>
    ))}
  </div>
);

export const RailSkeleton = () => (
  <>
    {[4, 6].map((rows, cardIndex) => (
      <div className="ink-lb-card" key={rows} aria-busy="true">
        <div className="ink-lb-card-head">
          <div>
            <div className="ink-lb-skel" style={{ width: 124, height: 16 }} />
            <div className="ink-lb-skel" style={{ width: 186, height: 11, marginTop: 9 }} />
          </div>
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            className="ink-lb-row"
            key={i}
            style={{ animationDelay: `${(cardIndex * 4 + i) * 0.07}s` }}
          >
            <div className="ink-lb-skel" style={{ width: 28, height: 28, borderRadius: "50%" }} />
            <div className="ink-lb-skel" style={{ flex: 1, height: 11 }} />
            <div className="ink-lb-skel" style={{ width: 48, height: 18, borderRadius: 999 }} />
          </div>
        ))}
      </div>
    ))}
  </>
);

export const LeaderboardError = ({ onRetry }) => (
  <div className="ink-lb-state" role="alert">
    <span className="ink-lb-state-emoji" aria-hidden="true">
      ⚠️
    </span>
    <p className="ink-lb-state-title">Unable to load the leaderboard.</p>
    <p className="ink-lb-state-text">Please try again.</p>
    <InkGhostButton onClick={onRetry} sx={{ mt: 1.5 }}>
      Retry
    </InkGhostButton>
  </div>
);

// The writers board is the default, so its copy leads; the readers board gets
// the equivalent invitation rather than the writers' words with a new noun
// swapped in.
export const LeaderboardEmpty = ({ group = "writers" }) => {
  const writers = group === "writers";
  return (
    <div className="ink-lb-state" role="status">
      <span className="ink-lb-state-emoji" aria-hidden="true">
        🏆
      </span>
      <p className="ink-lb-state-title">
        {writers ? "No writers on the board yet" : "No readers on the board yet"}
      </p>
      <p className="ink-lb-state-text">
        {writers
          ? "Start writing and engaging to claim a spot."
          : "Start reading and engaging to claim a spot."}
      </p>
      <InkPrimaryButton
        as={Link}
        to={writers ? "/create-blog" : "/explore"}
        endIcon={<span aria-hidden="true">→</span>}
        sx={{ mt: 1.5 }}
      >
        {writers ? "Start Writing" : "Start Reading"}
      </InkPrimaryButton>
    </div>
  );
};
