import React from "react";
import { Box, Typography, Stack, Chip } from "@mui/material";
import { motion } from "framer-motion";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import UserAvatar from "./UserAvatar";

// Creator-recognition podium for the top three. Rank 1 sits center and
// slightly raised; 2 and 3 flank. Each step shows the creator's avatar,
// name, points, and (when present) their level and badge count — framed as
// recognition rather than a scoreboard.
const MEDALS = {
  1: { color: "#D4AF37", label: "Champion" },
  2: { color: "#9EA7B3", label: "Runner-up" },
  3: { color: "#B0804F", label: "Third place" },
};

const PodiumStep = ({ entry, rank, delay }) => {
  const medal = MEDALS[rank];
  const heights = { 1: 132, 2: 104, 3: 88 };
  const avatarSizes = { 1: 76, 2: 62, 3: 54 };

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
      style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}
    >
      {/* Medal badge floating over the avatar */}
      <Box sx={{ position: "relative", mb: 1.25 }}>
        <UserAvatar
          src={entry.profile_image}
          name={entry.username}
          sx={{
            width: avatarSizes[rank],
            height: avatarSizes[rank],
            fontSize: avatarSizes[rank] * 0.38,
            border: `3px solid ${medal.color}`,
            boxShadow: `0 6px 18px rgba(28,25,23,0.14)`,
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            bottom: -6,
            right: -6,
            width: 26,
            height: 26,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(135deg, ${medal.color}, rgba(255,255,255,0.25))`,
            color: "#fff",
            border: "2px solid rgba(255,255,255,0.85)",
            boxShadow: "0 2px 6px rgba(28,25,23,0.25)",
          }}
        >
          <Typography sx={{ fontSize: 12, fontWeight: 800, lineHeight: 1 }}>{rank}</Typography>
        </Box>
      </Box>

      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 800,
          color: "text.primary",
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {entry.username || "Unknown"}
      </Typography>

      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
        <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 800 }}>
          {entry.points} pts
        </Typography>
      </Stack>

      <Stack direction="row" spacing={0.5} sx={{ mt: 0.75, mb: 1.25, flexWrap: "wrap", justifyContent: "center", rowGap: 0.5 }}>
        {entry.level && (
          <Chip label={`Lv ${entry.level}`} size="small" sx={{ height: 20, fontSize: "0.65rem" }} />
        )}
        {Array.isArray(entry.badges) && entry.badges.length > 0 && (
          <Chip
            size="small"
            icon={<MilitaryTechIcon sx={{ fontSize: 13 }} />}
            label={entry.badges.length}
            sx={{ height: 20, fontSize: "0.65rem" }}
          />
        )}
      </Stack>

      {/* Podium base */}
      <Box
        sx={{
          width: "100%",
          maxWidth: rank === 1 ? 150 : 128,
          height: heights[rank],
          borderRadius: "14px 14px 0 0",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          pt: 1.5,
          background: (t) =>
            rank === 1
              ? `linear-gradient(180deg, ${t.palette.primary.main}, ${t.palette.primary.dark})`
              : t.palette.primary.bgSofter,
          border: (t) => `1px solid ${t.palette.divider}`,
          borderBottom: "none",
          boxShadow: rank === 1 ? "0 12px 32px rgba(17,17,17,0.25)" : "none",
        }}
      >
        <Stack direction="row" spacing={0.5} alignItems="center">
          {rank === 1 && <WorkspacePremiumIcon sx={{ fontSize: 16, color: "#fff" }} />}
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontSize: "0.6rem",
              color: rank === 1 ? "rgba(255,255,255,0.92)" : "text.secondary",
            }}
          >
            {medal.label}
          </Typography>
        </Stack>
      </Box>
    </motion.div>
  );
};

const LeaderboardPodium = ({ rows = [] }) => {
  const top3 = rows.slice(0, 3);
  if (top3.length === 0) return null;
  // Display order: 2 · 1 · 3
  const order = top3.length === 3 ? [1, 0, 2] : top3.map((_, i) => i);

  return (
    <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: { xs: 1.5, sm: 3 }, mt: 2 }}>
      {order.map((rowIndex, position) => (
        <PodiumStep
          key={top3[rowIndex]._id || position}
          entry={top3[rowIndex]}
          rank={rowIndex + 1}
          delay={position * 0.12}
        />
      ))}
    </Box>
  );
};

export default LeaderboardPodium;