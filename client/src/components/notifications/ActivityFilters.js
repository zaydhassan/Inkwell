import React from "react";
import { FILTERS } from "./format";

/* ─────────────────────────────────────────────────────────────────────
   Segmented activity filter + the "Mark all as read" action.

   The filter is a real ARIA tablist: each segment reports `aria-selected`
   and the panel below is its `aria-controls` target, so the selected state
   is exposed rather than only colored. Roving tabindex keeps it one tab
   stop, with arrow keys moving between segments.

   "Mark all as read" only exists when there is something to mark, so the
   action can never be a dead button.
   ───────────────────────────────────────────────────────────────────── */

const ActivityFilters = ({ filter, onChange, counts, unreadCount, hasAny, onMarkAll, marking }) => {
  const onKeyDown = (e) => {
    const i = FILTERS.findIndex((f) => f.id === filter);
    if (i < 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next = (i + (e.key === "ArrowRight" ? 1 : -1) + FILTERS.length) % FILTERS.length;
      onChange(FILTERS[next].id);
      // Move focus with the selection, per the tablist pattern.
      const el = e.currentTarget.parentElement?.children?.[next];
      el?.focus?.();
    }
  };

  return (
    <div className="ink-nt-bar">
      <div
        className="ink-nt-filters"
        role="tablist"
        aria-label="Filter your activity"
        onKeyDown={onKeyDown}
      >
        {FILTERS.map((f) => {
          const selected = f.id === filter;
          const n = counts[f.id] || 0;
          return (
            <button
              type="button"
              key={f.id}
              role="tab"
              id={`ink-nt-tab-${f.id}`}
              aria-selected={selected}
              aria-controls="ink-nt-feed"
              tabIndex={selected ? 0 : -1}
              className={`ink-nt-filter${selected ? " is-active" : ""}`}
              onClick={() => onChange(f.id)}
            >
              {f.label}
              {/* The count is a real count of what the segment holds, so an
                  empty segment shows nothing rather than a misleading 0. */}
              {n > 0 && <span className="ink-nt-filter-count">{n}</span>}
            </button>
          );
        })}
      </div>

      {unreadCount > 0 ? (
        <button
          type="button"
          className="ink-nt-markall"
          onClick={onMarkAll}
          disabled={marking}
          aria-label={`Mark all ${unreadCount} notifications as read`}
        >
          <span className="ink-nt-markall-dot" aria-hidden="true" />
          {marking ? "Marking…" : "Mark all as read"}
        </button>
      ) : (
        /* Zero unread but the feed still holds history: say so plainly
           instead of showing a disabled "mark all" that does nothing. */
        hasAny && (
          <span className="ink-nt-caughtup" role="status">
            <span aria-hidden="true">✓</span> All caught up
          </span>
        )
      )}
    </div>
  );
};

export default ActivityFilters;
