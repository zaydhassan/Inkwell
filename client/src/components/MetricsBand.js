import React, { useEffect, useRef, useState } from "react";
import { Box, Container, Typography, Stack } from "@mui/material";
import { motion, useInView, useReducedMotion } from "framer-motion";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import GroupsIcon from "@mui/icons-material/Groups";
import PublicIcon from "@mui/icons-material/Public";
import StarRateIcon from "@mui/icons-material/StarRate";

// Count-up number driven by requestAnimationFrame with an easeOutCubic
// curve. Jumps straight to the final value when the user prefers reduced
// motion so nothing animates.
const CountUp = ({ to, decimals = 0, duration = 1.6, start, started }) => {
  const prefersReducedMotion = useReducedMotion();
  const [value, setValue] = useState(start ? 0 : to);

  useEffect(() => {
    if (!started) return undefined;
    if (prefersReducedMotion) {
      setValue(to);
      return undefined;
    }
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(to * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, to, duration, prefersReducedMotion]);

  return <>{value.toFixed(decimals)}</>;
};

// A single metric tile: minimal icon, big count-up figure, caption.
const MetricCard = ({ icon, value, decimals, suffix, label, started, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.4 }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
    style={{ flex: 1, minWidth: 150 }}
  >
    <Stack
      alignItems="center"
      spacing={1}
      sx={{ textAlign: "center", px: 2, py: 3 }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "primary.bgSofter",
          color: "primary.main",
          border: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        {icon}
      </Box>
      <Typography
        sx={{
          fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
          fontWeight: 800,
          fontSize: { xs: "1.9rem", md: "2.4rem" },
          letterSpacing: "-0.02em",
          color: "text.primary",
          lineHeight: 1.1,
        }}
      >
        <CountUp to={value} decimals={decimals} started={started} />
        {suffix}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
        {label}
      </Typography>
    </Stack>
  </motion.div>
);

// Social-proof band. The figures below are illustrative marketing values for
// the demo build — NOT live platform statistics — so the footnote says so.
const MetricsBand = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  const metrics = [
    { icon: <AutoStoriesIcon />, value: 10, suffix: "K+", label: "Stories Published" },
    { icon: <GroupsIcon />, value: 50, suffix: "K+", label: "Active Readers" },
    { icon: <PublicIcon />, value: 100, suffix: "+", label: "Countries Reached" },
    { icon: <StarRateIcon />, value: 4.9, decimals: 1, suffix: "/5", label: "Community Rating" },
  ];

  return (
    <Box component="section" ref={ref} sx={{ py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            rowGap: 1,
            borderRadius: 4,
            border: (t) => `1px solid ${t.palette.divider}`,
            background: (t) => t.palette.background.paper,
            boxShadow: (t) => t.customShadows?.card,
            overflow: "hidden",
            "& > *": { flex: "1 1 200px" },
          }}
        >
          {metrics.map((m, i) => (
            <MetricCard key={m.label} {...m} started={inView} delay={i * 0.08} />
          ))}
        </Box>
        <Typography
          variant="caption"
          sx={{ display: "block", textAlign: "center", mt: 1.5, color: "text.disabled" }}
        >
          Illustrative figures for the demo build — not live platform statistics.
        </Typography>
      </Container>
    </Box>
  );
};

export default MetricsBand;