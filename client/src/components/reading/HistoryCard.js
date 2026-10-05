import React from "react";
import { Link } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import UserAvatar from "../UserAvatar";
import InkMeter from "../ink/InkMeter";
import { relativeDay, progressState } from "./insights";

/* ─────────────────────────────────────────────────────────────────────
   Reading History — one article the reader has read.

   Everything on the card is a real field of a real row: the cover, the
   title, the excerpt, the author, `readAt` (when they first opened it) and
   `progress` (how far they got, written by their own scroll position on
   the reader page — see components/ReadingProgress).

   The progress rail is drawn ONLY when there is progress to draw. A stored
   0 means "opened but never scrolled into the body", which is a real and
   common state; rendering it as an empty 0% bar would imply a measurement
   the reader never made, so that case shows a plain "Read" action instead.

   The card is a single stretched link (the title's ::after covers the
   card), so the whole surface is clickable exactly once in the tab order
   while the bookmark button sits above it and keeps its own hit area.
   ───────────────────────────────────────────────────────────────────── */

/* `description` is the same Quill HTML field BlogCard renders, so the tags
   have to come off before it reaches a one-paragraph excerpt — otherwise
   every card opens with a literal "<p>". Same treatment BlogCard applies to
   the identical field, kept local so this file stays a single component. */
const stripHtml = (html) =>
  html ? new DOMParser().parseFromString(String(html), "text/html").body.textContent || "" : "";
const cleanTitle = (title) =>
  title ? String(title).replace(/<\/?[^>]+(>|$)/g, "") : "";

const HistoryCard = ({ blog, bookmarked, onToggleBookmark, busy }) => {
  const { pct, state, label, cta } = progressState(blog.progress);
  const author = blog.user?.username || "Unknown writer";
  const read = relativeDay(blog.readAt);
  const title = cleanTitle(blog.title);
  // Tag-free, and collapsed to single spaces because the markup it came from
  // is indented — the clamp counts lines, so stray newlines would eat one.
  const excerpt = stripHtml(blog.description).replace(/\s+/g, " ").trim();

  // Up to two pills: the category leads, then the article's own tags fill
  // the second slot. Deduped so a tag that repeats the category shows once.
  const pills = [blog.category, ...(blog.tags || []).map((t) => t?.tag_name)]
    .map((t) => (typeof t === "string" ? t.trim() : ""))
    .filter(Boolean)
    .filter((t, i, all) => all.findIndex((x) => x.toLowerCase() === t.toLowerCase()) === i)
    .slice(0, 2);

  const href = `/blog-details/${blog._id}`;

  return (
    <Box component="article" className={`ink-rh-card is-${state}`}>
      <Box className="ink-rh-cover">
        {blog.image ? (
          <img src={blog.image} alt="" loading="lazy" decoding="async" />
        ) : (
          <Box className="ink-rh-cover-fallback" aria-hidden="true" />
        )}
        <Box className="ink-rh-cover-scrim" aria-hidden="true" />

        <Box
          component="button"
          type="button"
          className={`ink-rh-bm${bookmarked ? " is-on" : ""}`}
          onClick={() => onToggleBookmark(blog._id)}
          disabled={busy}
          aria-pressed={bookmarked}
          aria-label={bookmarked ? `Remove ${blog.title} from bookmarks` : `Save ${blog.title} to bookmarks`}
        >
          {bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
        </Box>
      </Box>

      <Box className="ink-rh-body">
        {pills.length > 0 && (
          <Box className="ink-rh-pills">
            {pills.map((pill) => (
              <Box component="span" className="ink-rh-pill" key={pill}>
                {pill}
              </Box>
            ))}
          </Box>
        )}

        <Typography component="h3" className="ink-rh-title">
          <Link className="ink-rh-title-link" to={href}>
            {title}
          </Link>
        </Typography>

        {excerpt && <Typography className="ink-rh-excerpt">{excerpt}</Typography>}

        <Box className="ink-rh-author">
          <UserAvatar src={blog.user?.profile_image} name={author} sx={{ width: 26, height: 26 }} />
          <Box className="ink-rh-author-text">
            <Typography component="span" className="ink-rh-author-name">
              {author}
            </Typography>
            {read && (
              <Typography component="span" className="ink-rh-author-date">
                Read {read}
              </Typography>
            )}
          </Box>
        </Box>

        <Box className="ink-rh-foot">
          {/* The rail is only honest when it measures something. */}
          {pct > 0 && (
            <Box className="ink-rh-progress">
              <InkMeter value={pct} label={`${title} — ${label}`} />
              <Typography component="span" className="ink-rh-progress-label">
                {label}
              </Typography>
            </Box>
          )}
          <Typography component="span" className="ink-rh-cta">
            {cta} <span aria-hidden="true">→</span>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default HistoryCard;
