import React from "react";
import ActivityItem from "./ActivityItem";
import { groupByDay } from "./format";

/* ─────────────────────────────────────────────────────────────────────
   The activity feed: one timeline, grouped by day.

   Day headings (Today · Yesterday · This week · Earlier) come from
   groupByDay() and empty groups are dropped, so a heading never sits over
   nothing. Row entrance is staggered by a CSS custom property (`--nt-i`,
   set in ActivityItem) rather than a JS animation library, which keeps the
   whole stagger inside one `prefers-reduced-motion` rule.
   ───────────────────────────────────────────────────────────────────── */

const ActivityFeed = ({ items, filter, onOpen }) => {
  const groups = groupByDay(items);
  // A single running index so the stagger carries across day boundaries
  // instead of restarting at every heading.
  let n = 0;

  return (
    <div
      className="ink-nt-panel"
      id="ink-nt-feed"
      role="tabpanel"
      aria-labelledby={`ink-nt-tab-${filter}`}
      tabIndex={-1}
    >
      {groups.map((group) => (
        <section className="ink-nt-group" key={group.label}>
          <h2 className="ink-nt-group-head">
            <span className="ink-nt-group-label">{group.label}</span>
            <span className="ink-nt-group-count" aria-label={`${group.items.length} notifications`}>
              {group.items.length}
            </span>
          </h2>
          <ul className="ink-nt-list">
            {group.items.map((item) => (
              <ActivityItem key={item._id} n={item} index={n++} onOpen={onOpen} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};

export default ActivityFeed;
