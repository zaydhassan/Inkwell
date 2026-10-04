import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { InkBadge, InkMeta } from "./InkButton";
import { EASE, INK } from "./tokens";
import "./InkStoryCard.css";

/* ─────────────────────────────────────────────────────────────────────
   InkWell story card.

   The data-honesty rule this card enforces: a figure is rendered only when
   the data behind it is real.
     • Category, title, excerpt, author, date and tags come from the blog
       document itself.
     • `likes` / `comments` come from the real Like and Comment collections
       (the listing endpoints aggregate them per page), so a card shows
       genuinely counted numbers — never an invented one. A card with no
       counts supplied simply omits that row rather than showing a zero.
     • `readingTime` is supplied by the caller, computed from the post body
       with the shared `readingTime` util.

   There is no demo mode: the frontend-only placeholder stories that used to
   carry fabricated counts are gone, so every card here is a real post.

   `likes`/`comments` are read-only here on purpose. Liking is a real action
   with points attached, and it already lives on the blog detail page; a card
   that faked a toggle would duplicate that logic in a second place. The one
   interactive control is the bookmark toggle, wired to the real
   /api/v1/bookmarks endpoints.
   ───────────────────────────────────────────────────────────────────── */

/* Cover image with a blur-up entrance and a hover zoom. Plain <img> rather
   than the shared BlurImage so the card stays independent of the MUI theme
   (this grid is always dark). */
const Cover = ({ src, alt, zoom }) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const reduce = useReducedMotion();

  return (
    <Box className="ink-story-media">
      <Box
        component="img"
        // A broken cover URL degrades to the bundled fallback rather than to
        // the browser's broken-image glyph.
        src={failed || !src ? "/tech1.jpeg" : src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={zoom && !reduce ? "ink-story-img" : undefined}
        sx={{
          opacity: loaded ? 1 : 0,
          filter: loaded ? "blur(0)" : "blur(14px)",
          transition: "opacity .6s ease, filter .6s ease",
        }}
      />
      {/* Warm grade so every cover sits in the same amber register. */}
      <Box className="ink-story-grade" aria-hidden="true" />
    </Box>
  );
};

const InkStoryCard = ({
  post,
  bookmarked = false,
  onToggleBookmark,
  index = 0,
  size = "default",
}) => {
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const open = () => navigate(`/blog-details/${post.id}`);

  return (
    <motion.article
      className={`ink-story-card ink-surface${size === "feature" ? " ink-story-card--feature" : ""}`}
      style={{ cursor: "pointer", height: "100%" }}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: EASE, delay: Math.min(index, 5) * 0.06 }}
      whileHover={reduce ? undefined : { y: -6 }}
      onClick={open}
      tabIndex={0}
      role="link"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
      aria-label={`Read ${post.title}`}
    >
      <Cover src={post.image} alt={post.title} zoom={!reduce} />

      <Box className="ink-story-body">
        {/* Category and reading time share the top row. The time lives here
            rather than in the footer because at three columns the footer is the
            one line that has to fit an avatar, a name, a date and three
            actions — moving it up is what lets the author's name render in full
            instead of being ellipsised. */}
        <Box className="ink-story-flags">
          {post.category && <InkBadge tone="accent">{post.category}</InkBadge>}
          {post.trending && (
            <InkBadge>
              <TrendingUpIcon sx={{ fontSize: 13 }} />
              Trending
            </InkBadge>
          )}
          {typeof post.readingTime === "number" && (
            <span className="ink-story-time">{post.readingTime} min read</span>
          )}
        </Box>

        <Typography component="h3" className="ink-story-title">
          {post.title}
        </Typography>

        <Typography className="ink-story-excerpt">{post.excerpt}</Typography>

        <Box className="ink-story-foot">
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, minWidth: 0 }}>
            {/* A real avatar when the author has one; otherwise the initials
                disc — the design system's portrait-free default. */}
            {post.avatar ? (
              <Box
                component="img"
                className="ink-story-avatar ink-story-avatar--img"
                src={post.avatar}
                alt=""
                loading="lazy"
              />
            ) : (
              <Box
                className="ink-story-avatar"
                sx={{ background: post.avatarGradient || "linear-gradient(135deg,#44403C,#78716C)" }}
                aria-hidden="true"
              >
                {post.initials}
              </Box>
            )}
            <Box sx={{ minWidth: 0 }}>
              <Typography className="ink-story-author">{post.author}</Typography>
              <Typography className="ink-story-date">{post.date}</Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, flexShrink: 0 }}>
            {typeof post.likes === "number" && (
              <InkMeta icon={<FavoriteBorderIcon />}>{post.likes}</InkMeta>
            )}
            {typeof post.comments === "number" && (
              <InkMeta icon={<ChatBubbleOutlineIcon />}>{post.comments}</InkMeta>
            )}

            <Box
              component="button"
              type="button"
              className="ink-story-action"
              aria-label={bookmarked ? "Remove from bookmarks" : "Save to bookmarks"}
              aria-pressed={bookmarked}
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark?.(post.id);
              }}
            >
              {bookmarked ? (
                <BookmarkIcon sx={{ fontSize: 17, color: INK.orange }} />
              ) : (
                <BookmarkBorderIcon sx={{ fontSize: 17 }} />
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </motion.article>
  );
};

export default InkStoryCard;
