import React from "react";
import { Link } from "react-router-dom";
import { InkGhostButton, InkPrimaryButton } from "../ink";

/* ─────────────────────────────────────────────────────────────────────
   The Activity Center's three non-content states.

     • loading — shimmer rows that mirror a real row's geometry (icon chip,
       avatar, two text lines, timestamp) so the feed swaps in without a
       layout jump. Never placeholder notifications.
     • error   — the spec's copy verbatim, with a retry.
     • empty   — the honest end of "REAL DATA OR NO DATA": a genuinely
       quiet account says so and offers the action that changes it.
   ───────────────────────────────────────────────────────────────────── */

/* Mirrors `.ink-nt-item`'s grid so the skeleton and the real rows line up. */
export const FeedSkeleton = ({ rows = 4 }) => (
  <div className="ink-nt-panel" aria-busy="true" aria-live="polite">
    <span className="ink-nt-sr">Loading your activity…</span>
    <div className="ink-nt-group-head">
      <div className="ink-nt-skel" style={{ width: 74, height: 11 }} />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div className="ink-nt-skel-row" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
        <div className="ink-nt-skel" style={{ width: 38, height: 38, borderRadius: 12 }} />
        <div className="ink-nt-skel" style={{ width: 26, height: 26, borderRadius: "50%" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="ink-nt-skel" style={{ width: "58%", height: 12 }} />
          <div className="ink-nt-skel" style={{ width: "34%", height: 10, marginTop: 9 }} />
        </div>
        <div className="ink-nt-skel" style={{ width: 58, height: 10 }} />
      </div>
    ))}
  </div>
);

export const SidebarSkeleton = () => (
  <div className="ink-nt-card" aria-busy="true">
    <div className="ink-nt-skel" style={{ width: 118, height: 15 }} />
    {/* Placeholder rails, not placeholder figures: dashes hold the row shape
        without ever printing a number the user could read as real. */}
    {Array.from({ length: 3 }).map((_, i) => (
      <div className="ink-nt-stat" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
        <span className="ink-nt-skel ink-nt-skel-dot" />
        <span className="ink-nt-skel" style={{ flex: 1, height: 11 }} />
        <span className="ink-nt-skel" style={{ width: 34, height: 11 }} />
      </div>
    ))}
  </div>
);

export const FeedError = ({ onRetry }) => (
  <div className="ink-nt-panel ink-nt-state" role="alert">
    <span className="ink-nt-state-glyph" aria-hidden="true">
      ⚠️
    </span>
    <p className="ink-nt-state-title">Couldn&rsquo;t load your activity.</p>
    <p className="ink-nt-state-text">Please try again.</p>
    <InkGhostButton onClick={onRetry} sx={{ mt: 1.5 }}>
      Try again
    </InkGhostButton>
  </div>
);

/* Shown only when the account has no notifications at all — distinct from
   "no unread", which keeps the feed on screen with an all-caught-up note. */
export const FeedEmpty = () => (
  <div className="ink-nt-panel ink-nt-state" role="status">
    <span className="ink-nt-state-glyph ink-nt-float" aria-hidden="true">
      ✒️
    </span>
    <p className="ink-nt-state-title">You&rsquo;re all caught up.</p>
    <p className="ink-nt-state-text">
      No new activity right now. Keep writing — your next notification might be a good one.
    </p>
    <div className="ink-nt-state-actions">
      <InkPrimaryButton as={Link} to="/create-blog" endIcon={<span aria-hidden="true">→</span>}>
        Write something
      </InkPrimaryButton>
      <InkGhostButton as={Link} to="/explore">
        Explore stories
      </InkGhostButton>
    </div>
  </div>
);

/* A filter can legitimately come back empty while the account is busy.
   Copy stays specific to the filter so it never reads as "no activity". */
export const FilterEmpty = ({ filter, labels }) => (
  <div className="ink-nt-panel ink-nt-state ink-nt-state--quiet" role="status">
    <p className="ink-nt-state-title">Nothing here yet.</p>
    <p className="ink-nt-state-text">
      {filter === "unread"
        ? "You've read everything — nice work."
        : `No ${(labels || "").toLowerCase()} in your recent activity.`}
    </p>
  </div>
);
