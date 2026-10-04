import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import UserAvatar from "../UserAvatar";
import { exactCount, formatCount } from "./format";

/* ─────────────────────────────────────────────────────────────────────
   "Top Writers" / "Top Readers" — the board's main table.

   Every column is a real, server-aggregated figure:
     Stories   — published posts by the author
     Reads     — total views across those posts
     Likes     — likes received across those posts
     Followers — rows in the follow graph pointing at the author
     Points    — the leaderboard's own ranking metric

   The readers board shows the read-side equivalents (articles actually
   read, followers, points) instead of writing metrics a reader cannot
   have — an empty Stories column for readers would be a lie dressed as a
   zero.

   A metric the API did not send renders as "—", never as 0: an absent
   figure and a counted zero are different facts.

   Layout is CSS grid rather than a <table>, with explicit ARIA table roles
   so the header/cell relationships survive; on phones the four low-priority
   metric columns are dropped and the row becomes a three-up list.
   ───────────────────────────────────────────────────────────────────── */

const DASH = "—";

const Num = ({ value, label, column }) => {
  const shown = formatCount(value);
  const cls = `ink-lb-num ink-lb-col-${column}`;
  if (shown === null) {
    return (
      <span className={cls} role="cell" aria-label={`${label}: not available`}>
        {DASH}
      </span>
    );
  }
  return (
    <span
      className={cls}
      role="cell"
      aria-label={`${label}: ${exactCount(value)}`}
      title={`${label}: ${exactCount(value)}`}
    >
      {shown}
    </span>
  );
};

const TopWritersBoard = ({ rows = [], group = "writers", currentUserId }) => {
  const reduce = useReducedMotion();
  const writers = group === "writers";

  return (
    <div className="ink-lb-card">
      <div className="ink-lb-card-head">
        <div>
          <h2 className="ink-lb-card-title">{writers ? "🏆 Top Writers" : "📖 Top Readers"}</h2>
          <p className="ink-lb-card-sub">
            {writers
              ? "Writers with the most engagement, reads, and impact on InkWell."
              : "Readers with the most articles read and engagement on InkWell."}
          </p>
        </div>
        <span className="ink-lb-card-count">{rows.length} ranked</span>
      </div>

      <div
        role="table"
        aria-label={writers ? "Top writers" : "Top readers"}
        className={writers ? "ink-lb-table--writers" : "ink-lb-table--readers"}
      >
        <div className="ink-lb-thead" role="row">
          <span role="columnheader">#</span>
          <span role="columnheader">{writers ? "Writer" : "Reader"}</span>
          {writers ? (
            <>
              <span className="ink-lb-col-num ink-lb-col-stories" role="columnheader" title="Published stories">
                Stories
              </span>
              <span className="ink-lb-col-num ink-lb-col-reads" role="columnheader" title="Total reads on their stories">
                Reads
              </span>
              <span className="ink-lb-col-num ink-lb-col-likes" role="columnheader" title="Likes received on their stories">
                Likes
              </span>
              <span className="ink-lb-col-num ink-lb-col-followers" role="columnheader" title="People following them">
                Followers
              </span>
            </>
          ) : (
            <>
              <span className="ink-lb-col-num ink-lb-col-reads" role="columnheader" title="Articles they have read">
                Articles read
              </span>
              <span className="ink-lb-col-num ink-lb-col-followers" role="columnheader" title="People following them">
                Followers
              </span>
            </>
          )}
          <span className="ink-lb-col-num" role="columnheader" title="Leaderboard points">
            Points
          </span>
        </div>

        <div role="rowgroup">
          {rows.map((entry, index) => {
            const rank = index + 1;
            const isMe = currentUserId && String(entry._id) === String(currentUserId);
            const meta = [entry.topCategory, entry.level].filter(Boolean).join(" · ");

            return (
              <motion.div
                key={entry._id || rank}
                className={`ink-lb-trow${isMe ? " is-me" : ""}`}
                role="row"
                data-rank={rank}
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                /* The hover lift lives here, not in the stylesheet. Framing the
                   row's entrance in `y` makes this library the owner of the
                   row's inline transform, and an inline transform outranks any
                   `:hover` rule in the sheet — a CSS translateY on hover was
                   silently dead until a probe caught it. Colour and border
                   still come from the CSS hover rule. */
                whileHover={reduce ? undefined : { y: -1 }}
                transition={{
                  duration: 0.42,
                  ease: [0.22, 1, 0.36, 1],
                  delay: Math.min(index, 8) * 0.05,
                }}
              >
                <span className="ink-lb-rank" role="cell" aria-label={`Rank ${rank}`}>
                  {rank}
                </span>

                <div className="ink-lb-writer" role="cell">
                  <UserAvatar
                    src={entry.profile_image}
                    name={entry.username}
                    alt=""
                    sx={{ width: 36, height: 36, fontSize: 14, flexShrink: 0 }}
                  />
                  <span className="ink-lb-writer-name">
                    <span>
                      {entry.username || "Unknown"}
                      {isMe && <span className="ink-lb-you">You</span>}
                    </span>
                    {meta && <span className="ink-lb-writer-meta">{meta}</span>}
                  </span>
                </div>

                {writers ? (
                  <>
                    <Num value={entry.stories} label="Stories" column="stories" />
                    <Num value={entry.reads} label="Reads" column="reads" />
                    <Num value={entry.likes} label="Likes" column="likes" />
                    <Num value={entry.followers} label="Followers" column="followers" />
                  </>
                ) : (
                  <>
                    <Num value={entry.reads} label="Articles read" column="reads" />
                    <Num value={entry.followers} label="Followers" column="followers" />
                  </>
                )}

                <span className="ink-lb-num is-points" role="cell" aria-label={`Points: ${exactCount(entry.points)}`}>
                  {formatCount(entry.points) ?? DASH}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TopWritersBoard;
