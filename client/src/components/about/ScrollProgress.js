import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { FONT_DISPLAY } from "../ink";

/* ─────────────────────────────────────────────────────────────────────
   The right-edge scroll rail.

   A 1px track with an orange fill that grows with the page, and one anchor
   per chapter of the story. It is navigation first and decoration second:
   each mark is a real link to a real section id, in a labelled <nav>, and
   the current chapter is marked with aria-current rather than only by
   colour. Hidden below the tablet breakpoint (the brief's rule) — on a phone
   the rail would sit on top of the content it is meant to index.

   The chapter list is the single source of truth for the rail; About.js
   renders its sections from the same array, so a mark can never point at a
   section that does not exist.
   ───────────────────────────────────────────────────────────────────── */

export const CHAPTERS = [
  { id: "story", label: "Story" },
  { id: "problem", label: "Problem" },
  { id: "solution", label: "Solution" },
  { id: "ai", label: "AI" },
  { id: "writers", label: "Writers" },
  { id: "readers", label: "Readers" },
  { id: "future", label: "Future" },
];

const ScrollProgress = () => {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const spring = useSpring(scrollYProgress, { stiffness: 130, damping: 30, restDelta: 0.001 });
  const scaleY = reduce ? scrollYProgress : spring;
  const [active, setActive] = useState(CHAPTERS[0].id);

  /* Which chapter is in the middle of the screen. A narrow band across the
     centre (rather than "the topmost visible section") is what a reader
     actually perceives as the current one while scrolling. */
  useEffect(() => {
    const nodes = CHAPTERS.map((c) => document.getElementById(c.id)).filter(Boolean);
    if (!nodes.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  /* Real anchors, so the rail works with the keyboard and with JS disabled.
     Only the smoothness is ours — and it is dropped for anyone who asked
     for less motion. */
  const jump = (event, id) => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    setActive(id);
  };

  return (
    <Box
      component="nav"
      aria-label="Sections of this page"
      className="ink-ab-rail"
      sx={{
        position: "fixed",
        top: "50%",
        right: "clamp(0.5rem, 1.4vw, 1.25rem)",
        transform: "translateY(-50%)",
        zIndex: 900,
        display: "flex",
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: "0.9rem",
      }}
    >
      {/* The track. Its height is fixed and its fill is scaled, so the
          indicator never reflows the page as the document grows. */}
      <Box
        aria-hidden="true"
        className="ink-ab-rail-track"
        sx={{ position: "relative", width: "2px", height: "clamp(150px, 26vh, 230px)" }}
      >
        {/* motion.div, not Box: the fill's scale is a MotionValue, and only a
            motion element subscribes to one. `sx` is inert on a raw
            motion.div, so the fill's paint lives in About.css and only the
            scale is inline. */}
        <motion.div
          className="ink-ab-rail-fill"
          style={{ scaleY, transformOrigin: "50% 0%" }}
        />
      </Box>

      <Box
        component="ul"
        sx={{
          listStyle: "none",
          m: 0,
          p: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "0.55rem",
        }}
      >
        {CHAPTERS.map((chapter, i) => {
          const on = chapter.id === active;
          return (
            <Box component="li" key={chapter.id}>
              <Box
                component="a"
                href={`#${chapter.id}`}
                onClick={(e) => jump(e, chapter.id)}
                aria-current={on ? "true" : undefined}
                className="ink-ab-rail-link"
                data-active={on}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  textDecoration: "none",
                  fontFamily: FONT_DISPLAY,
                  fontSize: "0.6rem",
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  color: on ? "var(--ink-orange)" : "var(--ink-text-3-decor)",
                  opacity: on ? 1 : 0.62,
                  transition: "color 0.25s ease, opacity 0.25s ease",
                  "&:hover": { color: "var(--ink-text)", opacity: 1 },
                }}
              >
                <Box component="span" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {String(i + 1).padStart(2, "0")}
                </Box>
                <Box
                  component="span"
                  sx={{
                    width: on ? "1.1rem" : "0.7rem",
                    height: "1px",
                    background: "currentColor",
                    transition: "width 0.3s cubic-bezier(0.22,1,0.36,1)",
                  }}
                />
                {chapter.label}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default ScrollProgress;
