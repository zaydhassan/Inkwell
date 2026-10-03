import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { InkBadge, InkGhostButton, InkSectionHead } from "../ink";

/* ─────────────────────────────────────────────────────────────────────
   "Your stories" — the three most recent posts, drafts included. Sits between
   Rewards and Settings so the six mandated sections keep their order.

   Deliberately NOT `InkStoryCard`. That card is built for Home's curated demo
   shape — `post.id`, `post.isDemo`, `post.initials`, `post.author`,
   `post.date`, `post.likes` — none of which an API blog document carries, so
   it would render a blank byline and link to `/blog-details/undefined`.

   Drafts link to the editor and published posts to the reader, because
   `/blog-details/:id` will not serve a draft.
   ───────────────────────────────────────────────────────────────────── */

const fmtDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

const YourStories = ({ posts = [] }) => {
  const shown = posts.slice(0, 3);
  if (!shown.length) return null;

  return (
    <section
      className="ink-profile-section ink-profile-section-wide"
      aria-label="Your stories"
    >
      <InkSectionHead
        eyebrow="From your desk"
        title="Your stories"
        size="compact"
        sx={{ mb: 3 }}
      />

      <ul className="ink-profile-stories">
        {shown.map((post) => {
          const isDraft = post.status !== "Published";
          return (
            <li className="ink-profile-story" key={post._id}>
              <div className="ink-profile-story-main">
                <h3 className="ink-profile-story-title">
                  <RouterLink to={isDraft ? `/edit-blog/${post._id}` : `/blog-details/${post._id}`}>
                    {post.title}
                  </RouterLink>
                </h3>
                <p className="ink-profile-story-meta">
                  {post.category && <span>{post.category}</span>}
                  <span>{fmtDate(post.created_at)}</span>
                </p>
              </div>

              <InkBadge tone={isDraft ? "neutral" : "accent"}>
                {isDraft ? "Draft" : "Published"}
              </InkBadge>
            </li>
          );
        })}
      </ul>

      <div className="ink-profile-stories-more">
        <InkGhostButton as={RouterLink} to="/my-blogs">
          All your stories →
        </InkGhostButton>
      </div>
    </section>
  );
};

export default YourStories;
