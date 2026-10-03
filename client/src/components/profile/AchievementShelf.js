import React from "react";
import { InkSectionHead } from "../ink";
import { BADGE_META, badgeState, earnedCount } from "./badgeMeta";

/* ─────────────────────────────────────────────────────────────────────
   Section 4 — achievements.

   No outer card: three tiles at 900px, narrower than the sections either side
   of it so the page has a rhythm instead of a uniform column.

   All three tiles always render, in fixed order. Earned is a *state*, not
   presence — a locked tile reads as a goal, whereas an absent one reads as a
   broken page, and a brand-new account at 0 points is the common case rather
   than an edge case.
   ───────────────────────────────────────────────────────────────────── */

const AchievementShelf = ({ badges = [], points = 0 }) => {
  const earned = earnedCount(badges);

  return (
    <section
      className="ink-profile-section ink-profile-section-mid"
      aria-label="Achievements"
    >
      <InkSectionHead
        eyebrow={`${earned} of ${BADGE_META.length} earned`}
        title="Achievements"
        size="compact"
        sx={{ mb: 3 }}
      />

      <ul className="ink-badge-grid">
        {BADGE_META.map(({ name, min, Icon, blurb }) => {
          const state = badgeState(name, badges, points);
          return (
            <li
              key={name}
              className={`ink-badge-tile ${state.earned ? "is-earned" : "is-locked"}`}
              /* Locked tiles state the unlock threshold, since the greyed
                 icon alone conveys "not yet" but not "how far". */
              aria-label={
                state.earned
                  ? `${name} — earned`
                  : `${name} — locked, unlocks at ${min} points`
              }
            >
              <span className="ink-badge-tile-icon">
                <Icon sx={{ fontSize: 24 }} />
              </span>
              <h3 className="ink-badge-tile-name">{name}</h3>
              <p className="ink-badge-tile-blurb">{blurb}</p>
              <span className="ink-badge-tile-status">
                {state.earned ? "Earned" : `${state.pointsLeft} pts to go`}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default AchievementShelf;
