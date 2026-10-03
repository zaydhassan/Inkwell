import React from "react";
import { InkBadge, InkGhostButton, InkMeter, InkPrimaryButton, InkSurface } from "../ink";

/* ─────────────────────────────────────────────────────────────────────
   One reward in the section-5 grid.

   The per-reward meter is the identity: a grid of cards each showing how far
   the writer is from affording *that* reward. It is the only section built as
   a grid of equal cards, which is what separates it from the achievements
   shelf above and the settings panel below.

   Unaffordable rewards keep a disabled ghost button naming the shortfall —
   the disabled state is the honest signal, and the label says why.
   ───────────────────────────────────────────────────────────────────── */

const RewardCard = ({ reward, points = 0, onRedeem }) => {
  const cost = reward.costInPoints || 0;
  const affordable = points >= cost;
  const shortfall = Math.max(0, cost - points);
  // A zero-cost reward is fully funded rather than a division by zero.
  const pct = cost > 0 ? Math.min(100, (points / cost) * 100) : 100;

  return (
    <InkSurface className="ink-reward-card">
      <div className="ink-reward-head">
        <h3 className="ink-reward-name">{reward.name}</h3>
        <InkBadge tone="accent">{cost} pts</InkBadge>
      </div>

      <div className="ink-reward-meter-row">
        <InkMeter
          value={pct}
          label={`${Math.round(pct)}% of the ${cost} points needed for ${reward.name}`}
        />
        <span className="ink-reward-cost">
          {affordable ? "Ready to redeem" : `${shortfall} pts to go`}
        </span>
      </div>

      <div className="ink-reward-action">
        {affordable ? (
          <InkPrimaryButton onClick={() => onRedeem(reward._id)}>
            Redeem
          </InkPrimaryButton>
        ) : (
          <InkGhostButton disabled>Need {shortfall} more pts</InkGhostButton>
        )}
      </div>
    </InkSurface>
  );
};

export default RewardCard;
