import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { InkEyebrow, InkHeading, EASE } from "../ink";
import RewardGiftVisual from "./RewardGiftVisual";

/* ─────────────────────────────────────────────────────────────────────
   The Rewards hero: the editorial pitch on the left, the floating gift
   illustration on the right.

   Typography follows the brief's hierarchy — the eyebrow carries the only
   orange in the copy ("SPEND YOUR POINTS"), the "Rewards" heading stays
   off-white, and the lede is the shared secondary tone. The heading is the
   page's one <h1>.

   The heading's size and leading are pinned here rather than taken from
   `size="hero"`: the shared hero step is tuned for the wide landing heroes,
   and this one has to fit a 380–450px band alongside the illustration. The
   tight leading (0.95) is what keeps the two-line-safe display type from
   adding 20px of dead space under the eyebrow.

   The two entrances are deliberately different: the copy rises, the artwork
   settles in from 96% scale. A scale-in reads as "arriving into place" for
   an illustration in a way a translate does not, and it is the brief's one
   non-looping motion that the page spends on the artwork.
   ───────────────────────────────────────────────────────────────────── */

const HEADING_SX = {
  mt: 2,
  fontSize: "clamp(3.25rem, 5.6vw, 4.5rem)",
  fontWeight: 800,
  lineHeight: 0.95,
  letterSpacing: "-0.04em",
};

/* The shared eyebrow is sized for the wide landing heroes; this one sits
   alone above a 72px heading and reads better a touch larger and tighter
   tracked than the layer's default. `& span` reaches the text only — the
   leading orange rule is a sibling <div> and keeps its shared geometry. */
const EYEBROW_SX = {
  "& span": { fontSize: "0.78rem", letterSpacing: "0.14em" },
};

const RewardsHero = () => {
  const reduce = useReducedMotion();

  return (
    <section className="ink-rw-hero">
      <motion.div
        className="ink-rw-hero-copy"
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <InkEyebrow sx={EYEBROW_SX}>Spend your points</InkEyebrow>
        <InkHeading component="h1" size="hero" sx={HEADING_SX}>
          Rewards
        </InkHeading>
        <p className="ink-rw-lede">
          Redeem the points you've earned for perks, discounts, and more.
        </p>
      </motion.div>

      <motion.div
        className="ink-rw-hero-art"
        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
      >
        <RewardGiftVisual />
      </motion.div>
    </section>
  );
};

export default RewardsHero;
