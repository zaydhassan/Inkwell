import React from "react";
import { Box, ListItem, Typography, Stack, Chip } from "@mui/material";
import GlassCard from "./GlassCard";
import UserAvatar from "./UserAvatar";

// Level thresholds mirror the server's getLevel() so any progress bar / band
// logic stays consistent with the displayed level. Exported so both the Profile
// progress ring and the Leaderboard page share one source of truth.
export const LEVEL_BANDS = [
  { min: 0, next: 500 },
  { min: 500, next: 1000 },
  { min: 1000, next: 3000 },
  { min: 3000, next: null },
];

// Shared leaderboard list card used by both the Profile sidebar and the
// standalone Leaderboard page (ranks 4+). Each row: rank number, avatar,
// username, and points — with a charcoal highlight on the signed-in user.
const LeaderboardCard = ({ title, emoji, rows, currentUserId }) => (
  <GlassCard sx={{ p: 2, mt: 2 }}>
    <Typography variant="subtitle2" sx={{ textAlign: "center", color: "primary.main", fontWeight: 700, mb: 1 }}>
      {title}
    </Typography>
    {rows.length > 0 ? (
      rows.map((entry, index) => {
        const isMe = currentUserId && String(entry._id) === String(currentUserId);
        return (
          <ListItem
            key={entry._id}
            disableGutters
            sx={{
              py: 0.75,
              px: 1.25,
              borderRadius: 2,
              mb: 0.25,
              bgcolor: isMe ? "brandSoft" : "transparent",
              transition: "background-color .2s ease",
            }}
          >
            <Typography
              variant="body2"
              sx={{ fontWeight: 800, color: "primary.main", minWidth: 26, fontVariantNumeric: "tabular-nums" }}
            >
              {index + 1}
            </Typography>
            <UserAvatar
              src={entry.profile_image}
              name={entry.username}
              sx={{ width: 30, height: 30, fontSize: 13, mx: 1.25 }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                noWrap
                sx={{ fontWeight: isMe ? 700 : 600, color: isMe ? "primary.main" : "text.primary" }}
              >
                {entry.username}
                {isMe ? " (you)" : ""}
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.75} alignItems="center">
              {entry.level && (
                <Chip
                  label={`Lv ${entry.level}`}
                  size="small"
                  sx={{ height: 18, fontSize: "0.6rem", display: { xs: "none", sm: "inline-flex" } }}
                />
              )}
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                {entry.points} pts
              </Typography>
            </Stack>
          </ListItem>
        );
      })
    ) : (
      <Typography variant="body2" sx={{ textAlign: "center", color: "text.secondary" }}>
        No {title.toLowerCase()} yet.
      </Typography>
    )}
  </GlassCard>
);

export default LeaderboardCard;