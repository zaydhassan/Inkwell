import React from "react";
import UserAvatar from "../UserAvatar";
import { InkBadge, InkEyebrow, InkHeading, InkMeter } from "../ink";
import { onActivate } from "../../utils/a11y";
import { LEVEL_BANDS } from "../LeaderboardCard";
import { nextBadge } from "./badgeMeta";

/* ─────────────────────────────────────────────────────────────────────
   Section 1 — the hero. Identity only: avatar, name, bio, role, level, the
   level meter, and the two relationship counts.

   No card. This is the page's masthead, and putting it on a surface would
   make it read as one more panel among six. It is also the only section that
   repeats nothing: points, badges, stories and streak are quantities, and
   section 2 owns those.

   Figures print raw, without thousands separators, to match `CountUp` in the
   stats rail and the points column in the rail's boards.
   ───────────────────────────────────────────────────────────────────── */

const ProfileHero = ({
  user,
  level,
  points = 0,
  followInfo,
  progress = 0,
  band,
  onAvatarClick,
  fileInputRef,
  onImageChange,
}) => {
  const bandIndex = LEVEL_BANDS.findIndex((b) => b === band);
  const bandCount = LEVEL_BANDS.length;
  const isMaxLevel = band.next === null;

  // A max-level writer still has a badge to chase — Elite Writer unlocks at
  // 5000 while the level ladder tops out at 3000 — so the caption names that
  // instead of dead-ending on "max level reached".
  const upcoming = nextBadge(points);
  const caption = isMaxLevel
    ? upcoming
      ? `Max level · ${upcoming.min - points} pts to ${upcoming.name}`
      : "Max level · every badge earned"
    : `${Math.round(progress)}% to ${band.next} points`;

  return (
    <header className="ink-profile-hero">
      <div className="ink-profile-hero-avatar">
        <UserAvatar
          src={user?.profile_image}
          name={user?.username}
          /* The avatar is the upload control, so its accessible name says so
             rather than just restating the username. */
          alt="Change your profile picture"
          role="button"
          tabIndex={0}
          sx={{
            width: "100%",
            height: "100%",
            fontSize: "2.4rem",
            cursor: "pointer",
          }}
          onClick={onAvatarClick}
          onKeyDown={onActivate(onAvatarClick)}
        />
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={onImageChange}
        />
      </div>

      <div className="ink-profile-hero-id">
        <InkEyebrow>
          {`Level ${Math.min(bandIndex + 1, bandCount)} of ${bandCount}`}
        </InkEyebrow>

        <InkHeading component="h1" size="hero" sx={{ mt: 1.5 }}>
          {user?.username || "Your profile"}
        </InkHeading>

        {user?.bio && <p className="ink-profile-bio">{user.bio}</p>}

        <div className="ink-profile-hero-badges">
          <InkBadge tone="accent">{user?.role || "Reader"}</InkBadge>
          <InkBadge>{level}</InkBadge>
        </div>

        <p className="ink-profile-hero-hint">
          Tap your photo to upload a new one.
        </p>
      </div>

      <div className="ink-profile-hero-meter">
        <div className="ink-profile-hero-meter-head">
          <span className="ink-profile-meter-label">Level progress</span>
          <span className="ink-profile-meter-value">{points} pts</span>
        </div>
        <InkMeter
          value={progress}
          label={`Level progress — ${Math.round(progress)}% of the way to the next level`}
        />
        <p className="ink-profile-hero-note">{caption}</p>
      </div>

      {/* A page-local two-up grid rather than `.ink-stats`: that class is a
          hardcoded 4-up and would leave two empty cells behind two figures. */}
      <div className="ink-profile-hero-stats">
        <div className="ink-profile-hero-stat">
          <span className="ink-profile-hero-stat-value">
            {followInfo.followersCount}
          </span>
          <span className="ink-profile-hero-stat-label">Followers</span>
        </div>
        <div className="ink-profile-hero-stat">
          <span className="ink-profile-hero-stat-value">
            {followInfo.followingCount}
          </span>
          <span className="ink-profile-hero-stat-label">Following</span>
        </div>
      </div>
    </header>
  );
};

export default ProfileHero;
