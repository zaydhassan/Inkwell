/* ─────────────────────────────────────────────────────────────────────
   The Rewards page's own components.

   They live under `components/rewards/` rather than beside the page because
   the page composes five distinct blocks (hero, balance, rows, earning
   methods, states) and a single 600-line page file would bury the data flow
   that actually matters. Everything reusable — tokens, buttons, section
   heads, reveal/count-up — still comes from the shared ink system; nothing
   here forks it.
   ───────────────────────────────────────────────────────────────────── */

export { default as RewardsHero } from "./RewardsHero";
export { default as RewardGiftVisual } from "./RewardGiftVisual";
export { default as PointsSummary } from "./PointsSummary";
export { default as RewardRow } from "./RewardRow";
export { default as EarnMethods } from "./EarnMethods";
export { RewardsSkeleton, RewardsError, RewardsEmpty } from "./RewardsStates";
