import React, { useRef } from "react";
import { useInView } from "framer-motion";
import { CountUp } from "../ink";

/* ─────────────────────────────────────────────────────────────────────
   Section 2 — creator stats. Quantity, where the hero carried identity.

   Borderless on purpose: no surface, just four figures over hairlines. It is
   the one section with no container at all, which is what keeps it from
   reading as a card among cards.

   `useInView` mirrors InkStatsBand so the count-up starts when the rail is
   actually on screen rather than on mount.
   ───────────────────────────────────────────────────────────────────── */

const ProfileStats = ({ points = 0, badgesEarned = 0, published = 0, drafts = 0 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });

  const stats = [
    { label: "Points", value: points },
    { label: "Badges earned", value: badgesEarned },
    { label: "Published", value: published },
    { label: "Drafts", value: drafts },
  ];

  return (
    <section
      className="ink-profile-section ink-profile-section-wide"
      aria-label="Creator stats"
    >
      <div className="ink-profile-statgrid" ref={ref}>
        {stats.map((stat) => (
          <div className="ink-profile-stat" key={stat.label}>
            <span className="ink-profile-stat-value">
              <CountUp to={stat.value} started={inView} />
            </span>
            <span className="ink-profile-stat-label">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProfileStats;
