import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import LocalFireDepartmentRounded from "@mui/icons-material/LocalFireDepartmentRounded";
import FavoriteBorderRounded from "@mui/icons-material/FavoriteBorderRounded";
import ChatBubbleOutlineRounded from "@mui/icons-material/ChatBubbleOutlineRounded";
import { toStoryCard } from "../../utils/blogCard";

/* ─────────────────────────────────────────────────────────────────────
   InkWell Explore — the trending rail.

   Ranked by the server (/api/v1/blog/trending orders by likes, then comments,
   then views, then recency) and limited to five. Every number shown here is
   counted from the real Like and Comment collections — the rail never guesses,
   and a story with no likes simply shows no like count rather than a zero.
   That is also why the order is not re-sorted in the browser: the client has
   only the counts the server sent, so re-ranking here could contradict the
   ranking that produced this list.

   Each row is rank → 42px cover → title → author · counts. The covers are the
   story's actual uploaded image, never a stand-in when the real one exists;
   when a story has none (or the image fails to load) the 42px column stays —
   the author's initials on their deterministic warm tile — so rows never
   collapse into ragged, half-media lines. Every figure and image here belongs
   to a real post; nothing is drawn that the server did not send.

   Each row is a real <a> (via the router) so the rail behaves like a list of
   links — openable in a new tab, reachable by keyboard. "View all" returns to
   the whole library: there is no standalone trending page, so that link goes
   somewhere real.
   ───────────────────────────────────────────────────────────────────── */

const RANK = ["01", "02", "03", "04", "05"];

/* One row's 42px cover. A failed image swaps to the mono tile rather than
   leaving a broken-image glyph inside the rail — the local state is per row,
   so only the broken cover falls back. Alt text is empty on purpose: the
   adjacent title carries the meaning, the thumbnail is atmosphere. */
const TrendThumb = ({ post }) => {
  const [broken, setBroken] = useState(false);

  if (!post.image || broken) {
    return (
      <span
        className="ink-trend-thumb"
        style={{ background: post.avatarGradient }}
        aria-hidden="true"
      >
        <span className="ink-trend-mono">{post.initials}</span>
      </span>
    );
  }

  return (
    <span className="ink-trend-thumb" aria-hidden="true">
      <img src={post.image} alt="" loading="lazy" onError={() => setBroken(true)} />
    </span>
  );
};

const TrendingBlogs = ({ items = [], loading = false }) => {
  const navigate = useNavigate();
  const posts = items.map((b) => toStoryCard(b, { includeReadingTime: false }));

  return (
    <section className="ink-side-card ink-surface" aria-labelledby="ink-trending-head">
      <header className="ink-side-head">
        <span className="ink-side-eyebrow ink-side-eyebrow--trend" id="ink-trending-head">
          {/* The ember effect (opacity pulse); freezes under reduced motion. */}
          <LocalFireDepartmentRounded className="ink-pulse" />
          Trending
        </span>
        <Link to="/explore" className="ink-side-more">
          View all
          <ArrowForwardRounded />
        </Link>
      </header>

      {loading ? (
        // Placeholder rows at the real row geometry — thumbnail column
        // included — so the card does not resize when the list lands.
        <ul className="ink-trend-list" aria-hidden="true">
          {RANK.map((r) => (
            <li key={r} className="ink-trend-row ink-trend-row--ghost">
              <span className="ink-trend-rank">{r}</span>
              <span className="ink-trend-thumb ink-ghost-thumb" />
              <span className="ink-ghost-lines">
                <span className="ink-ghost-line" style={{ width: "82%" }} />
                <span className="ink-ghost-line" style={{ width: "48%" }} />
              </span>
            </li>
          ))}
        </ul>
      ) : posts.length === 0 ? (
        // The rail is secondary — when there is nothing to rank it says so
        // quietly instead of rendering an error the reader cannot act on.
        <p className="ink-side-note">
          Nothing is trending yet. The first stories to gather likes will show up here.
        </p>
      ) : (
        <ul className="ink-trend-list">
          {posts.map((post, i) => (
            <li key={post.id}>
              <a
                href={`/blog-details/${post.id}`}
                className="ink-trend-row"
                onClick={(e) => {
                  // Left click stays a client-side route change; modified clicks
                  // (new tab, new window) keep the browser's own behaviour.
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                  e.preventDefault();
                  navigate(`/blog-details/${post.id}`);
                }}
              >
                <span className="ink-trend-rank">{RANK[i] || "—"}</span>
                <TrendThumb post={post} />
                <span className="ink-trend-body">
                  <span className="ink-trend-title">{post.title}</span>
                  <span className="ink-trend-meta">
                    <span className="ink-trend-author">{post.author}</span>
                    {typeof post.likes === "number" && (
                      <span className="ink-trend-stat">
                        <FavoriteBorderRounded />
                        {post.likes}
                      </span>
                    )}
                    {typeof post.comments === "number" && (
                      <span className="ink-trend-stat">
                        <ChatBubbleOutlineRounded />
                        {post.comments}
                      </span>
                    )}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default TrendingBlogs;