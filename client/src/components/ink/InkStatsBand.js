import React, { useRef } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { useInView } from "framer-motion";
import {
  AutoStoriesOutlined,
  GroupsOutlined,
  PublicOutlined,
  StarOutline,
} from "@mui/icons-material";
import { CountUp, Reveal } from "./InkReveal";
import { InkSurface } from "./InkSurface";
import { FONT_DISPLAY, INK, STATS, STATS_DISCLAIMER } from "./tokens";

/* ─────────────────────────────────────────────────────────────────────
   InkWell stats band.

   ONE component, mounted by BOTH the Home and About pages. The brief is
   explicit that a second, visually different stats component must not
   exist — so Home and About render literally the same component with the
   same figures, the same orange outline icons, the same hairline
   dividers, the same count-up, and the same footnote.

   The figures are illustrative marketing values for the demo build, not
   live platform data, and the footnote says so. Do not remove it.
   ───────────────────────────────────────────────────────────────────── */

const ICONS = [<AutoStoriesOutlined />, <GroupsOutlined />, <PublicOutlined />, <StarOutline />];

const InkStatsBand = ({ sx }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });

  return (
    <Box
      ref={ref}
      component="section"
      aria-label="InkWell at a glance"
      sx={sx}
    >
      <InkSurface variant="quiet" sx={{ borderRadius: "26px" }}>
        <Box className="ink-stats">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.08} y={16} amount={0.25}>
              <Stack
                alignItems="center"
                spacing={1}
                sx={{ px: 2, py: { xs: 3.5, md: 4.5 }, textAlign: "center" }}
              >
                <Box
                  aria-hidden="true"
                  sx={{ color: INK.orange, display: "flex", "& svg": { fontSize: 26 } }}
                >
                  {ICONS[i]}
                </Box>
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
                  <CountUp to={stat.value} decimals={stat.decimals} started={inView} />
                  {stat.suffix}
                </Typography>
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: INK.text3 }}>
                  {stat.label}
                </Typography>
              </Stack>
            </Reveal>
          ))}
        </Box>
      </InkSurface>

      <Typography
        sx={{ mt: 1.75, textAlign: "center", fontSize: "0.72rem", color: INK.text3, opacity: 0.85 }}
      >
        {STATS_DISCLAIMER}
      </Typography>
    </Box>
  );
};

export default InkStatsBand;
