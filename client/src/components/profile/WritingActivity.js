import React from "react";
import { InkSectionHead, InkSurface } from "../ink";
import WritingStreakCard from "../WritingStreak";

/* ─────────────────────────────────────────────────────────────────────
   Section 3 — writing activity.

   The only `variant="quiet"` surface on the page, and the only section whose
   body is a 91-cell mosaic, so it carries its own identity without needing a
   second accent colour.

   The heading lives here rather than inside `WritingStreakCard` so the two
   cannot drift apart; the card supplies figures, heatmap and goal setter.
   The streak belongs to this section — it is a *writing* streak — which is
   why section 2 counts points, badges and stories instead.
   ───────────────────────────────────────────────────────────────────── */

const WritingActivity = () => (
  <section
    className="ink-profile-section ink-profile-section-wide"
    aria-label="Writing activity"
  >
    <InkSectionHead
      eyebrow="Your habit"
      title="Writing activity"
      subtitle="Every square is a day. The stronger the ink, the closer you came to your daily goal."
      size="compact"
      sx={{ mb: 3 }}
    />

    <InkSurface variant="quiet" className="ink-profile-activity">
      <div className="ink-profile-activity-body">
        <WritingStreakCard />
      </div>
    </InkSurface>
  </section>
);

export default WritingActivity;
