/* ─────────────────────────────────────────────────────────────────────
   InkWell design tokens — the JS mirror.

   These values are a deliberate, explicit copy of the CSS custom
   properties declared in `src/styles/inkwell.css` (.ink / .ink-nav). They
   exist only for the handful of places JSX needs a colour it cannot reach
   through a CSS class — inline SVG fills, framer-motion gradients, and the
   MUI `sx` escape hatches.

   ⚠ If you change a value here, change it in inkwell.css too. The CSS file
   is the source of truth; this file follows it.
   ───────────────────────────────────────────────────────────────────── */

export const INK = {
  /* Surfaces */
  bg: "#0F0E0D",
  bgAlt: "#151311",
  card: "#1B1917",
  cardHi: "#211E1A",

  /* Lines */
  border: "rgba(255,255,255,0.10)",
  borderSoft: "rgba(255,255,255,0.06)",
  borderWarm: "rgba(255,106,0,0.35)",

  /* Type. `text3` is lifted from the brief's #77716A, which only clears
     ~4.1:1 on this canvas — see the note in inkwell.css. */
  text: "#F5F1EA",
  text2: "#B5AEA5",
  text3: "#8E887F",
  text3Decor: "#77716A",

  /* Accent */
  orange: "#FF6A00",
  orange2: "#F97316",
  orangeDeep: "#C2410C",
  orangeSoft: "rgba(255,106,0,0.14)",
  orangeSofter: "rgba(255,106,0,0.06)",
  orangeGlow: "rgba(255,106,0,0.15)",
};

export const FONT_DISPLAY = '"Plus Jakarta Sans", "Inter", system-ui, sans-serif';
export const FONT_BODY = '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/* The shared entrance easing — a gentle "settle" used by every reveal on
   both pages, so the motion language is identical. */
export const EASE = [0.22, 1, 0.36, 1];

/* Stagger container / child pair. Sections that reveal as a group use
   `staggerContainer` on the parent and `riseIn` on each child. */
export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

export const riseIn = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/* The brief's four social-proof figures. Illustrative marketing values for
   the demo build — NOT live platform statistics. Every surface that renders
   them must carry the disclaimer; `InkStatsBand` does. */
export const STATS = [
  { value: 10, suffix: "K+", label: "Stories published" },
  { value: 50, suffix: "K+", label: "Active readers" },
  { value: 100, suffix: "+", label: "Countries" },
  { value: 4.9, decimals: 1, suffix: "/5", label: "Community rating" },
];

export const STATS_DISCLAIMER =
  "Illustrative figures for the demo build — not live platform statistics.";
