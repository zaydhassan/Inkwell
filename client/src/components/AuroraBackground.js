import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, useSpring } from "framer-motion";

// A subtle, cursor-following charcoal aurora rendered behind the whole
// app (portaled to <body> so it sits at the same layer as the fixed ambient
// glow in index.css, beneath #root's z-index:1 content). GPU-only: it moves
// via transform on a single blurred radial blob. Honors prefers-reduced-motion
// by rendering a static centered glow instead of tracking the pointer.
const AuroraBackground = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(!mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  // Center the blob on the cursor; spring gives it a lazy, weighted trail.
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 55, damping: 22, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 55, damping: 22, mass: 0.6 });

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [enabled, x, y]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      <motion.div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 640,
          height: 640,
          marginLeft: -320,
          marginTop: -320,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(17,17,17,0.06), rgba(17,17,17,0.02) 45%, transparent 70%)",
          filter: "blur(70px)",
          x: enabled ? sx : window.innerWidth / 2,
          y: enabled ? sy : window.innerHeight / 2,
        }}
      />
      {/* Second, cooler accent blob trailing offset for depth */}
      <motion.div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 420,
          height: 420,
          marginLeft: -210,
          marginTop: -210,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(17,17,17,0.03), transparent 65%)",
          filter: "blur(80px)",
          x: enabled ? sx : window.innerWidth / 2,
          y: enabled ? sy : window.innerHeight / 2,
          opacity: 0.7,
        }}
      />
    </motion.div>,
    document.body
  );
};

export default AuroraBackground;