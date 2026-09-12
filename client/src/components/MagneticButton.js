import React, { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import GradientButton from "./GradientButton";

// A reusable magnetic CTA: the button gently follows the cursor while
// hovered and springs back to center on leave. A soft orange glow
// blooms behind it on hover. Built on the existing GradientButton so all
// brand styling + props pass through untouched.
//
// Usage: <MagneticButton onClick={...}>Start Writing</MagneticButton>
const MagneticButton = ({ children, strength = 0.35, glow = true, sx, ...props }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  // Springy return for that premium, weighted feel.
  const sxSpring = useSpring(x, { stiffness: 220, damping: 16, mass: 0.4 });
  const sySpring = useSpring(y, { stiffness: 220, damping: 16, mass: 0.4 });

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    x.set(relX * strength);
    y.set(relY * strength);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{ x: sxSpring, y: sySpring, display: "inline-block" }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <GradientButton
        size="large"
        sx={{
          position: "relative",
          // Layered glow behind the button on hover.
          ...(glow && {
            transition: "box-shadow .3s ease, transform .2s ease",
            "&:hover": {
              boxShadow:
                "0 12px 36px rgba(17,17,17,0.30), 0 0 0 4px rgba(17,17,17,0.12)",
            },
          }),
          ...sx,
        }}
        {...props}
      >
        {children}
      </GradientButton>
    </motion.div>
  );
};

export default MagneticButton;