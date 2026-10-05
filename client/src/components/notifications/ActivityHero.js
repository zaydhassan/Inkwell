import React from "react";
import { Reveal } from "../ink";

/* ─────────────────────────────────────────────────────────────────────
   Activity Center hero.

   Editorial header (eyebrow · headline · standfirst) plus the summary
   strip. The strip is REAL DATA OR NO DATA: `tiles` is computed in
   format.summarise() and only contains figures that can actually be
   counted — the exact unread total from the server, and per-kind counts
   over the loaded notifications. When there is nothing to count the strip
   is not rendered at all rather than padded with zeros.
   ───────────────────────────────────────────────────────────────────── */

const ActivityHero = ({ tiles = [], loading }) => (
  <header className="ink-nt-hero">
    <Reveal y={18}>
      <span className="ink-eyebrow">
        <span className="ink-nt-tick" aria-hidden="true" />
        Your activity
      </span>
    </Reveal>

    <Reveal y={22} delay={0.06}>
      <h1 className="ink-nt-title">
        Stay in the <em>loop</em>.
      </h1>
    </Reveal>

    <Reveal y={22} delay={0.12}>
      <p className="ink-nt-standfirst">
        Everything happening around your writing, your community, and your InkWell journey.
      </p>
    </Reveal>

    {/* The strip holds its height while loading so the feed below does not
        jump when the counts arrive. */}
    {loading ? (
      <div className="ink-nt-summary" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <div className="ink-nt-summary-cell" key={i}>
            <span className="ink-nt-skel" style={{ width: 30, height: 20 }} />
            <span className="ink-nt-skel" style={{ width: 62, height: 10, marginTop: 8 }} />
          </div>
        ))}
      </div>
    ) : tiles.length > 0 ? (
      <Reveal y={20} delay={0.18}>
        <ul className="ink-nt-summary">
          {tiles.map((t) => (
            // One accessible unit per stat: the label carries the reading
            // order ("3 unread"), so the two visible spans are decorative.
            <li className="ink-nt-summary-cell" key={t.id} aria-label={`${t.value} ${t.label}`}>
              <span className="ink-nt-summary-value" aria-hidden="true">
                {t.value}
              </span>
              <span className="ink-nt-summary-label" aria-hidden="true">
                {t.label}
              </span>
            </li>
          ))}
        </ul>
      </Reveal>
    ) : null}
  </header>
);

export default ActivityHero;
