import React from "react";
import { Link } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import UserAvatar from "../UserAvatar";
import { stripHtml, readingTime } from "../../utils/sanitize";
import { relativeDay } from "../reading/insights";

/* ─────────────────────────────────────────────────────────────────────
   Bookmarks — one saved article.

   Every field on the card is a real field of the row the list endpoint
   returned: the cover, the title, the excerpt, the category and tags, the
   author, and `bookmarkedAt` (when the reader saved it — `shapeBlog` reads
   it straight off the bookmark row's `created_at`).

   The control this page is FOR is the bookmark button, so unlike the other
   card in the app it is rendered in its saved state — every listed row is
   bookmarked by definition. Pressing it removes the article from the list,
   which is why the page (not this component) owns the optimistic removal.

   The card is a single stretched link (the title's ::after covers the
   surface), so the whole thing is clickable exactly once in the tab order
   while the bookmark button sits above it with its own hit area. The
   "Read more" footer is therefore a plain span, not a second link — a real
   button there would be a duplicate tab stop to the same destination.

   This deliberately does NOT inherit HistoryCard's reading semantics: a
   bookmark has no progress, so there is no meter and no "Continue reading"
   state. Its meta line is when it was saved plus the article's own length.
   ───────────────────────────────────────────────────────────────────── */

/* `description` is the same Quill HTML field BlogCard renders, so the tags
   come off before it reaches a one-paragraph excerpt — otherwise every card
   would open with a literal "<p>". */
const cleanTitle = (title) => (title ? String(title).replace(/<\/?[^>]+(>|$)/g, "") : "");

/* relativeDay returns "Today" / "Yesterday" / "6 days ago" / "2 weeks ago",
   and an absolute "Sep 12, 2026" for anything older. Only the relative forms
   read correctly lower-cased inside "Saved …", so the absolute one is left
   alone. */
const savedWhen = (value) => {
  const rel = relativeDay(value);
  if (!rel) return "";
  return /^(Today|Yesterday|\d)/.test(rel) ? rel.toLowerCase() : rel;
};

const BookmarkCard = ({ blog, onRemove, busy }) => {
  const author = blog.user?.username || "Unknown writer";
  const title = cleanTitle(blog.title);
  // Tag-free, and collapsed to single spaces because the markup it came from
  // is indented — the clamp counts lines, so stray newlines would eat one.
  const excerpt = stripHtml(blog.description).replace(/\s+/g, " ").trim();

  // Reading time is a property of the ARTICLE, not a claim about the reader:
  // the same 200-wpm estimate over the same body the reader page measures. A
  // row with no body shows no estimate rather than a made-up one.
  const minutes = blog.description ? readingTime(blog.description) : 0;
  const saved = savedWhen(blog.bookmarkedAt);
  const meta = [saved ? `Saved ${saved}` : "", minutes ? `${minutes} min read` : ""]
    .filter(Boolean)
    .join(" · ");

  // Up to three pills: the category leads, then the article's own tags fill
  // the rest. Deduped so a tag that repeats the category shows once.
  const pills = [blog.category, ...(blog.tags || []).map((t) => t?.tag_name)]
    .map((t) => (typeof t === "string" ? t.trim() : ""))
    .filter(Boolean)
    .filter((t, i, all) => all.findIndex((x) => x.toLowerCase() === t.toLowerCase()) === i)
    .slice(0, 3);

  const href = `/blog-details/${blog._id}`;

  return (
    <Box component="article" className="ink-bm-card">
      <Box className="ink-bm-cover">
        {blog.image ? (
          <img src={blog.image} alt="" loading="lazy" decoding="async" />
        ) : (
          <Box className="ink-bm-cover-fallback" aria-hidden="true" />
        )}
        <Box className="ink-bm-cover-scrim" aria-hidden="true" />

        <Box
          component="button"
          type="button"
          className="ink-bm-bm is-on"
          onClick={() => onRemove(blog._id)}
          disabled={busy}
          aria-pressed="true"
          aria-label={`Remove ${title} from your reading list`}
          title="Remove from your reading list"
        >
          <BookmarkIcon />
        </Box>
      </Box>

      <Box className="ink-bm-body">
        {pills.length > 0 && (
          <Box className="ink-bm-pills">
            {pills.map((pill) => (
              <Box component="span" className="ink-bm-pill" key={pill}>
                {pill}
              </Box>
            ))}
          </Box>
        )}

        <Typography component="h3" className="ink-bm-title">
          <Link className="ink-bm-title-link" to={href}>
            {title}
          </Link>
        </Typography>

        {excerpt && <Typography className="ink-bm-excerpt">{excerpt}</Typography>}

        <Box className="ink-bm-author">
          <UserAvatar src={blog.user?.profile_image} name={author} sx={{ width: 26, height: 26 }} />
          <Box className="ink-bm-author-text">
            <Typography component="span" className="ink-bm-author-name">
              {author}
            </Typography>
            {meta && (
              <Typography component="span" className="ink-bm-author-date">{meta}</Typography>
            )}
          </Box>
        </Box>

        {/* Visual affordance only — the stretched title link is the real
            destination, so this is aria-hidden rather than a fake button. */}
        <Box className="ink-bm-readmore" aria-hidden="true">
          Read more <span className="ink-bm-readmore-arrow">→</span>
        </Box>
      </Box>
    </Box>
  );
};

export default BookmarkCard;
