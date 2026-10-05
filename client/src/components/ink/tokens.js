/* ─────────────────────────────────────────────────────────────────────
   InkWell design tokens — the JS mirror.

   These are the names for the CSS custom properties declared in
   `src/styles/inkwell.css` (.ink / .ink-nav). They exist for the handful of
   places JSX needs a colour it cannot reach through a CSS class — inline
   SVG fills, framer-motion gradients, and the MUI `sx` escape hatches.

   The values are `var(--ink-*)` REFERENCES, not copies. That is deliberate:
   a literal here would pin the JSX to one theme and silently ignore the
   light/dark switch, which is exactly the bug this file used to cause.
   Referencing the custom property means every consumer follows
   `[data-theme]` for free, with no context plumbing. SVG `fill`/`stroke`/
   `stop-color` and the `sx` prop all accept custom properties.

   ⚠ Only ever put a var reference here. If a value is needed outside a
   themed subtree (or a renderer that cannot resolve custom properties),
   pass the resolved colour explicitly at the call site instead.
   ───────────────────────────────────────────────────────────────────── */

export const INK = {
  /* Surfaces */
  bg: "var(--ink-bg)",
  bgAlt: "var(--ink-bg-alt)",
  card: "var(--ink-card)",
  cardHi: "var(--ink-card-hi)",

  /* Lines */
  border: "var(--ink-border)",
  borderSoft: "var(--ink-border-soft)",
  borderWarm: "var(--ink-border-warm)",

  /* Type. `text3` is lifted from the brief's #77716A, which only clears
     ~4.1:1 on the dark canvas — see the note in inkwell.css. */
  text: "var(--ink-text)",
  text2: "var(--ink-text-2)",
  text3: "var(--ink-text-3)",
  text3Decor: "var(--ink-text-3-decor)",

  /* Accent — identical in both themes. */
  orange: "var(--ink-orange)",
  orange2: "var(--ink-orange-2)",
  orangeDeep: "var(--ink-orange-deep)",
  orangeSoft: "var(--ink-orange-soft)",
  orangeSofter: "var(--ink-orange-softer)",
  /* A raw orange glow: there is no token for it because it is a wash over
     artwork, not a surface, and orange does not change with the theme. */
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
