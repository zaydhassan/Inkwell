import React from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ArticleIcon from "@mui/icons-material/Article";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RedeemIcon from "@mui/icons-material/CardGiftcard";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import UserAvatar from "../UserAvatar";

/* ─────────────────────────────────────────────────────────────────────
   The Profile rail: section nav, the two leaderboard boards, and logout.

   One DOM serves both layouts. At ≥1024 it is a sticky column beside the
   content; at ≤1023.95 it flips to a horizontally scrollable pill row above
   it (see Profile.css). No state, no second drawer, no duplicated nav — the
   Navbar already owns the app's drawer.

   The leaderboards are rendered here rather than with `LeaderboardCard`,
   which stays on the light MUI theme for the standalone /leaderboard page.
   Restyling that component would repaint that page, so these five-row lists
   are Profile-local.
   ───────────────────────────────────────────────────────────────────── */

const Board = ({ title, rows, currentUserId }) => (
  <section>
    <h3 className="ink-rail-board-title">
      <EmojiEventsIcon sx={{ fontSize: 15 }} />
      {title}
    </h3>

    {rows.length > 0 ? (
      <ol className="ink-rail-board-list">
        {rows.map((entry, index) => {
          const isMe = currentUserId && String(entry._id) === String(currentUserId);
          return (
            <li
              key={entry._id}
              className={`ink-rail-board-row${isMe ? " is-me" : ""}`}
            >
              <span className="ink-rail-board-rank">{index + 1}</span>
              <UserAvatar
                src={entry.profile_image}
                name={entry.username}
                sx={{ width: 28, height: 28, fontSize: 12 }}
              />
              <span className="ink-rail-board-name">
                {entry.username}
                {isMe ? " (you)" : ""}
              </span>
              <span className="ink-rail-board-pts">{entry.points} pts</span>
            </li>
          );
        })}
      </ol>
    ) : (
      <p className="ink-rail-empty">No {title.toLowerCase()} yet.</p>
    )}
  </section>
);

const DashboardSidebar = ({
  topWriters = [],
  topReaders = [],
  currentUserId,
  onNavigate,
  onLogout,
}) => {
  // Nav entries point at other pages, so they are real buttons that navigate
  // rather than links: two of them are gated behind the writer role and have
  // to toast instead of routing, which a plain <a> could not do. The page owns
  // that decision, so `writerOnly` is passed straight through to onNavigate.
  const item = (label, Icon, path, { active = false, writerOnly = false } = {}) => (
    <button
      type="button"
      className={`ink-rail-link${active ? " is-active" : ""}`}
      onClick={() => onNavigate(path, writerOnly)}
      aria-current={active ? "page" : undefined}
    >
      <Icon />
      {label}
    </button>
  );

  return (
    <aside className="ink-rail">
      <nav className="ink-rail-nav" aria-label="Profile navigation">
        {item("Profile", AccountCircleIcon, "/profile", { active: true })}
        {item("My Blogs", ArticleIcon, "/my-blogs", { writerOnly: true })}
        {item("Create Blog", AddCircleIcon, "/create-blog", { writerOnly: true })}
        {item("Rewards", RedeemIcon, "/rewards")}
        {item("Leaderboard", LeaderboardIcon, "/leaderboard")}
      </nav>

      <hr className="ink-rail-sep" />

      <div className="ink-rail-boards">
        <Board title="Top Writers" rows={topWriters} currentUserId={currentUserId} />
        <Board title="Top Readers" rows={topReaders} currentUserId={currentUserId} />
      </div>

      <hr className="ink-rail-sep" />

      <nav className="ink-rail-nav" aria-label="Session">
        <button type="button" className="ink-rail-link" onClick={onLogout}>
          <ExitToAppIcon />
          Logout
        </button>
      </nav>
    </aside>
  );
};

export default DashboardSidebar;
