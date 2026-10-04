import moment from "moment";
import { readingTime, stripHtml } from "./sanitize";

/* ─────────────────────────────────────────────────────────────────────
   Blog document → story-card props.

   The single mapper the story grids share (Home's "Fresh Ink", Explore's
   featured/latest rows, the trending rail), so the same post renders
   identically wherever it appears and a field added to one grid lands on all
   of them.

   The rule it enforces: a property is set only when the API actually sent the
   data for it. `likes`/`comments` are left undefined when the endpoint did not
   aggregate counts, which the card renders as "no figure" rather than as a
   zero or an invented number. Same for `views`.
   ───────────────────────────────────────────────────────────────────── */

/* Up to two initials for the avatar disc — "Maya Chen" → "MC". */
export const initialsOf = (name) =>
  String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

/* Initials discs for authors with no uploaded picture. All six are warm or
   neutral, so a mixed feed stays inside the editorial palette instead of
   scattering saturated hues through the grid. */
const GRADIENTS = [
  "linear-gradient(135deg,#7C2D12,#B45309)",
  "linear-gradient(135deg,#9A3412,#C2410C)",
  "linear-gradient(135deg,#78350F,#A16207)",
  "linear-gradient(135deg,#44403C,#78716C)",
  "linear-gradient(135deg,#5C4033,#8A6B4F)",
  "linear-gradient(135deg,#6B3A1F,#B45309)",
];

/* Stable per-name pick, so an author keeps the same disc colour across the
   grid, the sidebar and every reload. */
export const gradientFor = (seed) => {
  const s = String(seed || "");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return GRADIENTS[h % GRADIENTS.length];
};

/* A blog as the API returns it → the props `InkStoryCard` expects.

   `includeReadingTime` is false for listing payloads that strip the body (the
   trending aggregation returns an excerpt, not the full description), because
   a reading time guessed from a truncated excerpt would be a lie. */
export const toStoryCard = (blog, { includeReadingTime = true } = {}) => {
  if (!blog) return null;

  const author = blog.user?.username || "Unknown";
  const category = blog.category || "";
  const description = blog.description || "";

  return {
    id: blog._id,
    title: stripHtml(blog.title),
    excerpt: stripHtml(description),
    image: blog.image || "",
    category,
    author,
    initials: initialsOf(author),
    avatar: blog.user?.profile_image || "",
    // The uploaded picture may be missing or broken; the disc is the fallback.
    avatarGradient: gradientFor(author),
    date: moment(blog.created_at).isValid() ? moment(blog.created_at).format("MMM D") : "",
    ...(includeReadingTime && description ? { readingTime: readingTime(description) } : {}),
    // Only present when a listing endpoint aggregated them — see the note above.
    ...(typeof blog.likeCount === "number" ? { likes: blog.likeCount } : {}),
    ...(typeof blog.commentCount === "number" ? { comments: blog.commentCount } : {}),
    tags: (blog.tags || [])
      .map((t) => (typeof t === "string" ? t : t?.tag_name))
      .filter(Boolean)
      // Tagging a post with its own category is common, and the category
      // already has a badge of its own — showing it twice reads as a bug.
      .filter((t) => t.toLowerCase() !== category.toLowerCase()),
  };
};

export default toStoryCard;
