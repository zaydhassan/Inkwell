import React from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CardGiftcardRoundedIcon from "@mui/icons-material/CardGiftcardRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import PercentRoundedIcon from "@mui/icons-material/PercentRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import { EASE, InkGhostButton, InkPrimaryButton } from "../ink";

/* ─────────────────────────────────────────────────────────────────────
   One row of the reward list.

   LEFT the icon tile, CENTRE the reward's own name / description / cost,
   RIGHT the action. Every string on the card comes from the reward document
   the API returned — the page adds no names, no descriptions and no prices.

   The icon is the one thing the catalog does not carry, so it is derived
   from the reward's real name by keyword and falls back to a gift box. That
   is presentation, not data: an unrecognised reward still renders, just with
   the generic tile.

   Eligibility is the same arithmetic the server enforces in its conditional
   `findOneAndUpdate` — `points >= costInPoints` — so a button is only ever
   live when the redemption would actually succeed.
   ───────────────────────────────────────────────────────────────────── */

const ICON_RULES = [
  { match: /coupon|discount|percent|promo|deal|%|off/i, Icon: PercentRoundedIcon },
  { match: /book|reading|novel|library|chapter/i, Icon: MenuBookRoundedIcon },
  { match: /badge|crown|premium|vip|elite|pro\b|upgrade/i, Icon: WorkspacePremiumRoundedIcon },
];

const iconFor = (name) => {
  const rule = ICON_RULES.find((r) => r.match.test(String(name || "")));
  return rule ? rule.Icon : CardGiftcardRoundedIcon;
};

const RewardRow = ({
  reward,
  points = 0,
  signedIn = false,
  state = "idle", // idle | loading | redeemed
  index = 0,
  onRedeem,
}) => {
  const reduce = useReducedMotion();
  const cost = reward.costInPoints || 0;
  const name = reward.name || "Reward";
  const Icon = iconFor(name);

  const eligible = signedIn && points >= cost;
  const shortfall = Math.max(0, cost - points);
  const busy = state === "loading";

  const action = () => {
    if (!signedIn) {
      return (
        <InkGhostButton
          as={Link}
          to="/login?redirect=%2Frewards"
          endIcon={<ArrowForwardRoundedIcon className="ink-rw-arrow" />}
        >
          Sign in to redeem
        </InkGhostButton>
      );
    }
    if (state === "redeemed") {
      return (
        <span className="ink-rw-done" role="status">
          <CheckRoundedIcon className="ink-rw-check" aria-hidden="true" />
          Redeemed
        </span>
      );
    }
    if (busy) {
      return (
        <InkPrimaryButton disabled aria-busy="true">
          <span className="ink-rw-spin" aria-hidden="true" />
          Redeeming…
        </InkPrimaryButton>
      );
    }
    if (eligible) {
      return (
        <InkPrimaryButton
          onClick={() => onRedeem(reward._id)}
          aria-label={`Redeem ${name} for ${cost} points`}
          endIcon={<ArrowForwardRoundedIcon className="ink-rw-arrow" />}
        >
          Redeem Reward
        </InkPrimaryButton>
      );
    }
    return (
      <InkGhostButton disabled>
        Need {shortfall} more {shortfall === 1 ? "point" : "points"}
      </InkGhostButton>
    );
  };

  return (
    <motion.article
      className={`ink-rw-row${eligible ? " is-eligible" : ""}`}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, ease: EASE, delay: Math.min(index, 6) * 0.08 }}
      /* The lift belongs to the motion layer — this element owns its inline
         transform, so a CSS `:hover { transform }` here would never apply.
         Border, glow, icon and arrow still animate from the stylesheet. The
         gesture carries its OWN transition, nested in the target object: the
         shared `transition` below is the entrance curve (0.5s, EASE), and a
         hover that inherited it would feel sluggish. Framer Motion takes the
         nested one for the gesture and leaves the entrance alone. */
      whileHover={reduce ? undefined : { y: -3, transition: { duration: 0.22, ease: "easeOut" } }}
    >
      <span className="ink-rw-row-icon" aria-hidden="true">
        <Icon />
      </span>

      <div className="ink-rw-row-body">
        <h3 className="ink-rw-row-name">{name}</h3>
        {reward.description ? (
          <p className="ink-rw-row-desc">{reward.description}</p>
        ) : null}
        <span className="ink-rw-row-cost">
          <span className="ink-rw-row-cost-dot" aria-hidden="true" />
          {cost.toLocaleString()} points
        </span>
      </div>

      <div className="ink-rw-row-action">{action()}</div>
    </motion.article>
  );
};

export default RewardRow;
