import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { EASE } from "./tokens";

/* ─────────────────────────────────────────────────────────────────────
   InkWell motion primitives.

   The whole motion vocabulary for both editorial pages lives here, so
   Home and About animate with one personality: fade + translateY on
   entrance, an easeOutCubic count-up for figures, and a hard opt-out the
   moment the user prefers reduced motion.
   ───────────────────────────────────────────────────────────────────── */

/* Entrance wrapper. Under `prefers-reduced-motion` the element renders in
   its final state with no transition at all. */
export const Reveal = ({ children, delay = 0, y = 26, amount = 0.25, style, ...rest }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.65, ease: EASE, delay }}
      style={style}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

/* Count-up figure driven by requestAnimationFrame with an easeOutCubic
   curve. Under reduced motion there is nothing to count through, so the
   final figure shows immediately rather than waiting on the in-view
   trigger. */
export const CountUp = ({ to, decimals = 0, duration = 1.5, started }) => {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? to : 0);

  useEffect(() => {
    if (reduce) {
      setValue(to);
      return undefined;
    }
    if (!started) return undefined;
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / (duration * 1000), 1);
      setValue(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, to, duration, reduce]);

  return <>{value.toFixed(decimals)}</>;
};
