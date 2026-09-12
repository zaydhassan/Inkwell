import React, { useState } from "react";
import { Box, Typography, Chip, Stack, Avatar } from "@mui/material";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import ScheduleIcon from "@mui/icons-material/Schedule";
import GlassCard from "./GlassCard";
import BlurImage from "./BlurImage";

// Two-line clamp helper used for title + description.
const clamp = (lines = 2) => ({
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});

// Entrance variants live on a wrapper in CommunitySection (the direct child
// of the stagger container) so the reveal doesn't depend on variant
// propagation through the <Tilt> intermediate. This component's own outer
// element is a plain div on purpose — it must NOT carry variants, or it can
// inherit a stuck "hidden" (opacity 0) state.
//
// Derive up to two initials from a display name for the avatar fallback.
const getInitials = (name) => {
  if (!name) return "U";
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const PlaceholderBlogCard = ({ post, index = 0 }) => {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  // Like count reacts to the toggle so the card feels alive.
  const likeCount = post.likes + (liked ? 1 : 0);

  // Burst a small on-brand confetti from the heart the first time a card is
  // liked. Coordinates are normalized to the viewport for canvas-confetti.
  const handleLike = (e) => {
    if (!liked) {
      const r = e.currentTarget.getBoundingClientRect();
      const origin = {
        x: (r.left + r.width / 2) / window.innerWidth,
        y: (r.top + r.height / 2) / window.innerHeight,
      };
      confetti({
        particleCount: 28,
        spread: 55,
        startVelocity: 32,
        scalar: 0.7,
        ticks: 110,
        origin,
        colors: ["#111111", "#52525B", "#A3A3A3", "#FFFFFF"],
      });
    }
    setLiked((v) => !v);
  };

  return (
    <div style={{ height: "100%" }}>
      <motion.div
        whileHover={{ y: -8, scale: 1.015 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        style={{ height: "100%" }}
      >
        <GlassCard
          glowOnHover
          sx={{
            position: "relative",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            // Gradient border that brightens on hover.
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              borderRadius: "inherit",
              padding: "1.5px",
              background:
                "linear-gradient(135deg, rgba(17,17,17,0.30), rgba(17,17,17,0.08))",
              WebkitMask:
                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
              opacity: 0.4,
              transition: "opacity .3s ease",
              pointerEvents: "none",
              zIndex: 1,
            },
            "&:hover::before": { opacity: 1 },
          }}
        >
          {/* Cover image */}
          <Box
            sx={{
              position: "relative",
              height: 180,
              overflow: "hidden",
            }}
          >
            <BlurImage src={post.image} alt="" sx={{ position: "absolute", inset: 0 }} />
            {/* Gradient overlay for legibility of badges + depth */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.45) 100%)",
                pointerEvents: "none",
              }}
            />

            {/* Category badge */}
            <Chip
              label={post.category}
              size="small"
              sx={{
                position: "absolute",
                top: 12,
                left: 12,
                zIndex: 2,
                bgcolor: "rgba(255,255,255,0.16)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.28)",
                backdropFilter: "blur(8px)",
                fontWeight: 700,
                height: 24,
                "& .MuiChip-label": { px: 1, fontSize: "0.7rem" },
              }}
            />

            {/* Trending badge */}
            {post.trending && (
              <Chip
                icon={<LocalFireDepartmentIcon sx={{ fontSize: 15, color: "#fff" }} />}
                label="Trending"
                size="small"
                sx={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  zIndex: 2,
                  bgcolor: "primary.main",
                  color: "#fff",
                  fontWeight: 700,
                  height: 24,
                  boxShadow: "0 4px 14px rgba(17,17,17,0.30)",
                  "& .MuiChip-label": { px: 1, fontSize: "0.7rem" },
                }}
              />
            )}
          </Box>

          {/* Body */}
          <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 1.25, flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                lineHeight: 1.3,
                color: "text.primary",
                transition: "color .2s ease",
                ...clamp(2),
                "&:hover": { color: "primary.main" },
              }}
            >
              {post.title}
            </Typography>

            <Typography variant="body2" sx={{ color: "text.secondary", ...clamp(2) }}>
              {post.description}
            </Typography>

            {/* Meta row: avatar + author + date · reading time */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <motion.div whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.94 }}>
                <Avatar
                  sx={{
                    width: 30,
                    height: 30,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#fff",
                    background: post.avatarGradient,
                    fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                  }}
                >
                  {getInitials(post.author)}
                </Avatar>
              </motion.div>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{ display: "block", color: "text.primary", fontWeight: 600, lineHeight: 1.2 }}
                  noWrap
                >
                  {post.author}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                  {post.date}
                  <Box component="span" sx={{ opacity: 0.5 }}>·</Box>
                  <ScheduleIcon sx={{ fontSize: 12 }} />
                  {post.readingTime} min
                </Typography>
              </Box>
            </Stack>

            {/* Stats row: likes + comments + bookmark */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mt: "auto", pt: 1.25, borderTop: (t) => `1px solid ${t.palette.divider}` }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <motion.button
                  type="button"
                  onClick={handleLike}
                  whileTap={{ scale: 0.85 }}
                  whileHover={{ scale: 1.08 }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: liked ? "var(--accent)" : "inherit",
                  }}
                  aria-label={liked ? "Unlike" : "Like"}
                  aria-pressed={liked}
                >
                  <motion.span animate={{ scale: liked ? [1, 1.25, 1] : 1 }} transition={{ duration: 0.3 }}>
                    {liked ? <FavoriteIcon sx={{ fontSize: 18 }} /> : <FavoriteBorderIcon sx={{ fontSize: 18 }} />}
                  </motion.span>
                  <Typography variant="caption" sx={{ color: liked ? "primary.main" : "text.secondary", fontWeight: 600 }}>
                    {likeCount}
                  </Typography>
                </motion.button>

                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "text.secondary" }}>
                  <ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>{post.comments}</Typography>
                </Stack>
              </Stack>

              <motion.button
                type="button"
                onClick={() => setBookmarked((v) => !v)}
                whileHover={{ rotate: -12, scale: 1.1 }}
                whileTap={{ scale: 0.88 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 6,
                  color: bookmarked ? "var(--accent)" : "inherit",
                }}
                aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
                aria-pressed={bookmarked}
              >
                {bookmarked ? <BookmarkIcon sx={{ fontSize: 18 }} /> : <BookmarkBorderIcon sx={{ fontSize: 18 }} />}
              </motion.button>
            </Stack>
          </Box>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default PlaceholderBlogCard;