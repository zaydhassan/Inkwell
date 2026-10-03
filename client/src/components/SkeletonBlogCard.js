import React from "react";
import { Box, Skeleton, Stack } from "@mui/material";
import GlassCard from "./GlassCard";
import { INK } from "./ink/tokens";

// Premium skeleton that mirrors the real/placeholder card layout exactly:
// cover image, category + trending badges, title, two-line description, and
// a meta row (avatar + name + stats). MUI's `wave` shimmer does the base
// sweep; a slow diagonal gradient overlay adds the high-end "sheen" pass
// you'd see on Linear/Vercel loading states.
//
// `ink` swaps the surface and shimmer for the shared InkWell dark tokens, so
// the always-dark editorial pages (Home) don't flash a light card mid-load.
// The default stays on the MUI theme for the rest of the app.
//
// `mediaSx` lets a caller match its grid's real cover height (Explore does —
// its cards use an explicit height, not an aspect ratio). It is merged last,
// so it wins over the default 180px.
const SkeletonBlogCard = ({ ink = false, mediaSx }) => {
  const Surface = ink ? Box : GlassCard;
  const surfaceProps = ink ? { className: "ink-surface" } : {};

  // On the ink surface the shimmer lifts *lighter* than its card; on the
  // light theme it lifts white. Same sheen, opposite direction of contrast.
  const shimmer = ink ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.18)";
  const base = ink ? "rgba(255,255,255,0.06)" : undefined; // undefined → theme `divider`

  return (
    <Surface
      {...surfaceProps}
      sx={{
        p: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...(ink ? { borderColor: INK.border } : {}),
      }}
    >
      <Box
        sx={{
          position: "relative",
          height: 180,
          bgcolor: ink ? "rgba(255,255,255,0.03)" : undefined,
          ...mediaSx,
        }}
      >
        {!ink && (
          <Skeleton variant="rectangular" width="100%" height="100%" animation="wave" sx={{ bgcolor: "divider" }} />
        )}
        {/* Sheen sweep */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(110deg, transparent 30%, ${shimmer} 50%, transparent 70%)`,
            backgroundSize: "220% 100%",
            animation: "skeletonSheen 1.6s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
        <Skeleton
          variant="rounded"
          width={92}
          height={24}
          sx={{ position: "absolute", top: 12, left: 12, ...(base ? { bgcolor: base } : { bgcolor: "divider" }) }}
          animation="wave"
        />
      </Box>

      <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 1.25, flex: 1 }}>
        <Skeleton variant="text" sx={{ fontSize: "1.15rem", ...(base ? { bgcolor: base } : {}) }} animation="wave" />
        <Skeleton variant="text" width="92%" animation="wave" sx={base ? { bgcolor: base } : undefined} />
        <Skeleton variant="text" width="68%" animation="wave" sx={base ? { bgcolor: base } : undefined} />

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: "auto", pt: 1.5 }}>
          <Skeleton variant="circular" width={32} height={32} animation="wave" sx={base ? { bgcolor: base } : undefined} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" animation="wave" sx={base ? { bgcolor: base } : undefined} />
          </Box>
          <Skeleton variant="rounded" width={56} height={20} animation="wave" sx={base ? { bgcolor: base } : undefined} />
        </Stack>
      </Box>
    </Surface>
  );
};

export default SkeletonBlogCard;
