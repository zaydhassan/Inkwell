import React from "react";
import { Box } from "@mui/material";
import { motion } from "framer-motion";
import {
  InkEyebrow,
  InkHeading,
  InkHighlight,
  InkStillLife,
  EASE,
  staggerContainer,
  riseIn,
} from "../ink";

/* ─────────────────────────────────────────────────────────────────────
   InkWell Explore — the hero.

   Two columns: the page's one true heading on the left, the still life on the
   right. The drawing carries its own radial mask (see InkStillLife.css), so
   there is no plate, frame or rectangle edge — it sits directly on the page
   canvas the way the type does.

   No statistics, no floating metric cards, no avatars: the Home hero already
   makes that argument, and Explore's job is to get the reader into the catalog
   as fast as possible. The search field belongs to the page, directly below
   this block, so the hero stays purely typographic.
   ───────────────────────────────────────────────────────────────────── */

const ExploreHero = () => (
  <Box component="section" className="ink-explore-hero" aria-label="Explore stories">
    <div className="ink-explore-hero-grid">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible">
        <motion.div variants={riseIn}>
          <InkEyebrow>Explore</InkEyebrow>
        </motion.div>

        <motion.div variants={riseIn}>
          <InkHeading
            component="h1"
            size="hero"
            sx={{
              mt: 2.5,
              // The brief's 64–76px desktop headline. The shared hero ladder
              // tops out at 64px, so Explore overrides it here rather than
              // changing the ladder for Home and About.
              fontSize: { xs: "2.75rem", sm: "3.4rem", md: "clamp(3.4rem, 5.3vw, 4.75rem)" },
              letterSpacing: "-0.035em",
            }}
          >
            Discover stories
            <br />
            <InkHighlight>that inspire.</InkHighlight>
          </InkHeading>
        </motion.div>

        <motion.div variants={riseIn}>
          <p className="ink-explore-lede">
            A growing library of ideas from writers across the world — technology, culture,
            craft and everything in between. Search, browse, and find the piece you needed
            today.
          </p>
        </motion.div>
      </motion.div>

      {/* Purely decorative: the drawing is aria-hidden inside the component. */}
      <motion.div
        className="ink-explore-hero-art"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.12 }}
      >
        <InkStillLife />
      </motion.div>
    </div>
  </Box>
);

export default ExploreHero;
