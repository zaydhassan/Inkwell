import React, { useRef } from "react";
import { Box } from "@mui/material";
import { useReducedMotion, useScroll, useTransform } from "framer-motion";
import { FONT_DISPLAY, INK } from "../ink";

/* ─────────────────────────────────────────────────────────────────────
   The kit every section on About agrees on.

   Six small primitives, and the reason they exist is consistency rather than
   reuse: fourteen sections written independently would each invent their own
   overline, their own node chip and their own human/AI pill, and the page
   would end up with fourteen slightly different versions of the same three
   ideas. These are those three ideas, defined once.

   Nothing here paints through a stylesheet. Everything is `sx`, so a section
   that needs a tweak passes `sx` and gets it, without a new class.
   ───────────────────────────────────────────────────────────────────── */

/* A page section. Carries the shared vertical rhythm and the scroll offset
   that clears the fixed navbar, and stamps `data-ab-section` so the page's
   structure is visible in the DOM without reading the JSX. */
export const Section = ({ id, label, children, className = "", sx }) => (
  <Box
    component="section"
    id={id}
    data-ab-section={label}
    className={`ink-ab-sec ${className}`.trim()}
    sx={sx}
  >
    {children}
  </Box>
);

/* A small orange overline inside a diagram. Deliberately quieter than the
   page's section eyebrows — these label parts of a drawing, not chapters. */
export const StepMark = ({ children, sx }) => (
  <Box
    component="span"
    sx={{
      display: "block",
      fontFamily: FONT_DISPLAY,
      fontSize: "0.62rem",
      fontWeight: 800,
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      color: INK.orange,
      ...sx,
    }}
  >
    {children}
  </Box>
);

/* The square icon tile used by every diagram node on the page. Filled with
   orange when active, so a diagram's current node is legible at a glance —
   and it is only ever *part* of the signal, never the whole of it.

   The corner radius is derived from the size rather than fixed: the same
   tile appears at 30px in the workflow and 46px in the orbit, and a fixed
   radius would look like a different component at each size.

   `className` is passed through for the one job `sx` cannot do at this
   specificity: a diagram that draws a connector *behind* its tiles needs to
   make those tiles opaque, and that rule has to outrank the `sx` background
   below. Nothing else on the page needs it. */
export const NodeChip = ({ children, size = 44, active = false, sx, className }) => (
  <Box
    className={className}
    sx={{
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      width: size,
      height: size,
      borderRadius: `${Math.round(size * 0.32)}px`,
      color: active ? "#17110C" : INK.orange,
      background: active ? INK.orange : INK.orangeSofter,
      border: `1px solid ${active ? INK.orange : "rgba(255,106,0,0.2)"}`,
      boxShadow: active ? "0 0 22px rgba(255,106,0,0.35)" : "none",
      transition: "background-color 0.22s ease, color 0.22s ease, box-shadow 0.22s ease",
      "& svg": { fontSize: size * 0.5 },
      ...sx,
    }}
  >
    {children}
  </Box>
);

/* Who did this step. The word is the point: colour alone would leave the
   distinction invisible to anyone who cannot separate the two hues, and this
   pill is the mechanism behind the page's transparency claim. */
export const AuthorTag = ({ children, tone = "human", sx }) => (
  <Box
    component="span"
    sx={{
      display: "inline-flex",
      alignItems: "center",
      gap: "0.35rem",
      padding: "0.2rem 0.5rem",
      borderRadius: "999px",
      fontFamily: FONT_DISPLAY,
      fontSize: "0.62rem",
      fontWeight: 800,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      color: tone === "ai" ? INK.orange : INK.text3,
      background: tone === "ai" ? INK.orangeSofter : "rgba(255,255,255,0.03)",
      border: `1px solid ${tone === "ai" ? "rgba(255,106,0,0.3)" : INK.borderSoft}`,
      "& svg": { fontSize: "0.72rem" },
      ...sx,
    }}
  >
    {children}
  </Box>
);

/* A framed surface for one of the page's illustrations. The frame itself is
   `.ink-ab-stage` in About.css, so a plain `<Box className="ink-ab-stage">`
   and this component are the same thing — which is the point, since the
   writer's desk and the philosophy scene are mounted in both ways.

   `aria-hidden` is not applied here: the caller decides, because on this page
   every illustration is decoration and every one of them is hidden — but that
   is a fact about the illustrations, not about this box. */
export const DiagramStage = ({ children, className = "", ...rest }) => (
  <Box className={`ink-ab-stage ${className}`.trim()} {...rest}>
    {children}
  </Box>
);

/* Scroll-linked drift for a decorative element.

   Returns `[ref, y]` — put `ref` on the element being tracked and `y` on a
   `motion` element inside it. Under reduced motion `y` is the number 0 rather
   than a MotionValue, which parks the element and stops the subscription
   doing anything visible. It never returns a negative distance, so nothing
   here can drift far enough to feel like the page is moving underfoot.

   Note on the console: framer-motion prints one development-only warning —
   "ensure that the container has a non-static position" — for any
   `useScroll({ target })`, because its default container is
   `document.documentElement` and that element is always static. The target
   here is positioned, so the measurement is right; the warning is the
   library's, not this page's, and it is compiled out of a production build. */
export const useParallax = (distance = 40) => {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  return [ref, reduce ? 0 : y];
};
