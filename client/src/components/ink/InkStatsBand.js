import React, { useRef } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { useInView } from "framer-motion";
import { CountUp, Reveal } from "./InkReveal";
import { InkSurface } from "./InkSurface";
import { FONT_DISPLAY, INK } from "./tokens";

/* ─────────────────────────────────────────────────────────────────────
   InkWell highlights band — one 4-up strip, two honest modes.

   REAL DATA OR NO DATA is the product rule this component exists to keep.
   It renders a numeric figure ONLY when a caller hands it one that came
   from the database:

     • `stats`  — real, DB-aggregated figures: { icon, value, suffix,
                  decimals?, label }. Nothing is ever hardcoded here, so
                  the band shows nothing until real data arrives. This is
                  the future-ready path for a live "InkWell by the numbers"
                  section; wire it to an aggregate endpoint and it works.
     • `values` — qualitative product statements: { icon, title, sub }.
                  No numbers, because there are none to show honestly.
                  This is what About renders today.

   `stats` wins when both are supplied. With neither, the component renders
   nothing at all rather than an empty shell.
   ───────────────────────────────────────────────────────────────────── */

const InkStatsBand = ({ stats = [], values = [], sx }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });

  const items =
    stats.length > 0
      ? stats.map((s) => ({ key: s.label, icon: s.icon, value: s.value, decimals: s.decimals, suffix: s.suffix, label: s.label }))
      : values.map((v) => ({ key: v.title, icon: v.icon, title: v.title, sub: v.sub }));

  if (items.length === 0) return null;

  return (
    <Box ref={ref} component="section" aria-label="InkWell at a glance" sx={sx}>
      <InkSurface variant="quiet" sx={{ borderRadius: "26px" }}>
        <Box className="ink-stats">
          {items.map((item, i) => (
            <Reveal key={item.key} delay={i * 0.08} y={16} amount={0.25}>
              <Stack
                alignItems="center"
                spacing={1}
                sx={{ px: 2, py: { xs: 3.5, md: 4.5 }, textAlign: "center" }}
              >
                <Box
                  aria-hidden="true"
                  sx={{ color: INK.orange, display: "flex", "& svg": { fontSize: 26 } }}
                >
                  {item.icon}
                </Box>

                {item.value !== undefined ? (
                  <>
                    <Typography
                      sx={{
                        fontFamily: FONT_DISPLAY,
                        fontWeight: 800,
                        fontSize: { xs: "1.7rem", md: "2.1rem" },
                        letterSpacing: "-0.03em",
                        lineHeight: 1.1,
                        color: INK.text,
                      }}
                    >
                      <CountUp to={item.value} decimals={item.decimals} started={inView} />
                      {item.suffix}
                    </Typography>
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: INK.text3 }}>
                      {item.label}
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography
                      sx={{
                        fontFamily: FONT_DISPLAY,
                        fontWeight: 800,
                        fontSize: { xs: "1.02rem", md: "1.12rem" },
                        letterSpacing: "-0.015em",
                        lineHeight: 1.25,
                        color: INK.text,
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 500, color: INK.text3, lineHeight: 1.5 }}>
                      {item.sub}
                    </Typography>
                  </>
                )}
              </Stack>
            </Reveal>
          ))}
        </Box>
      </InkSurface>
    </Box>
  );
};

export default InkStatsBand;
