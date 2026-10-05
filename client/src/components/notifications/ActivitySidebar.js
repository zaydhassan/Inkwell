import React from "react";
import { Link } from "react-router-dom";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import StarsIcon from "@mui/icons-material/Stars";
import { InkGhostButton, InkPrimaryButton, Reveal } from "../ink";
import { meta, describe, relativeTime } from "./format";

/* ─────────────────────────────────────────────────────────────────────
   The Activity Center rail.

   Three cards, every one of them fed by real data:
     • Your Activity      — streak / published / saved / points, each shown
                            only when the endpoint actually returned it.
     • Recent milestone   — the newest badge/level-up/goal notification.
     • Quick actions      — three routes that already exist.

   There is deliberately NO notification-preferences card: this backend has
   no notification settings to persist (no model, no route), and a row of
   toggles that writes nowhere would be a lie. If preferences are ever
   added, this is where the card belongs.
   ───────────────────────────────────────────────────────────────────── */

const nf = new Intl.NumberFormat();

const STATS = [
  {
    id: "streak",
    Icon: LocalFireDepartmentIcon,
    render: (v) => `${v} day streak`,
    label: (v) => `${v} day writing streak`,
  },
  {
    id: "published",
    Icon: ArticleOutlinedIcon,
    render: (v) => `${nf.format(v)} published`,
    label: (v) => `${v} published stories`,
  },
  {
    id: "saved",
    Icon: BookmarkBorderIcon,
    render: (v) => `${nf.format(v)} saved`,
    label: (v) => `${v} saved stories`,
  },
  {
    id: "points",
    Icon: StarsIcon,
    render: (v) => `${nf.format(v)} points`,
    label: (v) => `${v} points`,
  },
];

/* `stats` values are `null` when the corresponding request failed or the
   endpoint said nothing — those rows are removed rather than shown as 0. */
const YourActivity = ({ stats, unreadCount }) => {
  const rows = STATS.filter((s) => typeof stats[s.id] === "number" && stats[s.id] > 0);

  return (
    <section className="ink-nt-card" aria-labelledby="ink-nt-you">
      <h2 className="ink-nt-card-title" id="ink-nt-you">
        Your activity
      </h2>

      {rows.length > 0 ? (
        <ul className="ink-nt-stats">
          {rows.map((s) => (
            <li className="ink-nt-stat" key={s.id} aria-label={s.label(stats[s.id])}>
              <span className="ink-nt-stat-icon" aria-hidden="true">
                <s.Icon />
              </span>
              <span className="ink-nt-stat-value" aria-hidden="true">
                {s.render(stats[s.id])}
              </span>
            </li>
          ))}
        </ul>
      ) : stats.ready ? (
        <p className="ink-nt-card-note">
          Your numbers appear here once you publish and start reading.
        </p>
      ) : (
        <p className="ink-nt-card-note" aria-busy="true">
          Loading your numbers…
        </p>
      )}

      {unreadCount > 0 && (
        <p className="ink-nt-card-foot">
          <span className="ink-nt-unread" aria-hidden="true" />
          {unreadCount} unread {unreadCount === 1 ? "notification" : "notifications"}
        </p>
      )}
    </section>
  );
};

const RecentMilestone = ({ milestone }) => {
  if (!milestone) {
    return (
      <section className="ink-nt-card" aria-labelledby="ink-nt-milestone">
        <h2 className="ink-nt-card-title" id="ink-nt-milestone">
          Recent milestone
        </h2>
        <div className="ink-nt-milestone ink-nt-milestone--empty">
          <span className="ink-nt-milestone-glyph ink-nt-float" aria-hidden="true">
            🏆
          </span>
          <p className="ink-nt-milestone-text">Your next milestone is waiting.</p>
          <InkGhostButton as={Link} to="/create-blog" sx={{ mt: 1 }}>
            Start writing
          </InkGhostButton>
        </div>
      </section>
    );
  }

  const { Icon } = meta(milestone.type);
  return (
    <section className="ink-nt-card ink-nt-card--milestone" aria-labelledby="ink-nt-milestone">
      <h2 className="ink-nt-card-title" id="ink-nt-milestone">
        Recent milestone
      </h2>
      <div className="ink-nt-milestone">
        <span className="ink-nt-milestone-glyph" aria-hidden="true">
          <Icon />
        </span>
        <p className="ink-nt-milestone-text">{describe(milestone)}</p>
        <p className="ink-nt-milestone-time">{relativeTime(milestone.created_at)}</p>
        <InkGhostButton as={Link} to="/rewards" sx={{ mt: 1 }}>
          View rewards
        </InkGhostButton>
      </div>
    </section>
  );
};

const QuickActions = () => (
  <section className="ink-nt-card" aria-labelledby="ink-nt-quick">
    <h2 className="ink-nt-card-title" id="ink-nt-quick">
      Quick actions
    </h2>
    <ul className="ink-nt-quick">
      <li>
        <Link to="/create-blog">
          Write a story <span aria-hidden="true">→</span>
        </Link>
      </li>
      <li>
        <Link to="/profile">
          View profile <span aria-hidden="true">→</span>
        </Link>
      </li>
      <li>
        <Link to="/explore">
          Explore stories <span aria-hidden="true">→</span>
        </Link>
      </li>
    </ul>
    {/* A single primary action, so the rail ends on momentum rather than a
        fourth equal-weight link. */}
    <InkPrimaryButton
      as={Link}
      to="/create-blog"
      className="ink-nt-card-cta"
      endIcon={<span aria-hidden="true">→</span>}
    >
      Start writing
    </InkPrimaryButton>
  </section>
);

/* The rail's stacking context belongs to the page (it is the <aside>), so
   this only supplies the three cards in their reveal order. */
const ActivitySidebar = ({ stats, milestone, unreadCount }) => (
  <>
    <Reveal y={20} delay={0.1}>
      <YourActivity stats={stats} unreadCount={unreadCount} />
    </Reveal>
    <Reveal y={20} delay={0.18}>
      <RecentMilestone milestone={milestone} />
    </Reveal>
    <Reveal y={20} delay={0.26}>
      <QuickActions />
    </Reveal>
  </>
);

export default ActivitySidebar;
export { YourActivity, RecentMilestone, QuickActions };
