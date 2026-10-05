import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ReplyIcon from "@mui/icons-material/Reply";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ScheduleIcon from "@mui/icons-material/Schedule";
import BoltIcon from "@mui/icons-material/Bolt";
import NotificationsIcon from "@mui/icons-material/Notifications";

/* ─────────────────────────────────────────────────────────────────────
   InkWell Activity — the reading layer for a notification document.

   Everything here is a pure function of one notification as the API
   already returns it ({ _id, type, text, read, created_at, actor, blog }).
   Nothing invents content: `describe()` prefers the server's own `text`
   and only composes a sentence when the server deliberately left it empty
   (like/comment/reply carry no text — see notify.js call sites), using the
   populated actor + blog the endpoint already sends.

   TYPE SET is closed and mirrors the model enum exactly — there is no
   `mention` type in this backend, so there is no Mentions filter. Filters
   are derived from the types that actually exist.
   ───────────────────────────────────────────────────────────────────── */

/* kind → which filter a notification answers to, and how much visual weight
   it earns. Priority: 1 milestone, 2 conversation, 3 story, 4 follower,
   5 reaction, 6 system. */
export const TYPES = {
  like: { Icon: FavoriteBorderIcon, label: "Reaction", kind: "reaction", priority: 5 },
  comment: { Icon: ChatBubbleOutlineIcon, label: "Comment", kind: "conversation", priority: 2 },
  reply: { Icon: ReplyIcon, label: "Reply", kind: "conversation", priority: 2 },
  follow: { Icon: PersonAddAlt1Icon, label: "New follower", kind: "follower", priority: 4 },
  badge: { Icon: MilitaryTechIcon, label: "Badge", kind: "milestone", priority: 1 },
  levelUp: { Icon: EmojiEventsIcon, label: "Level up", kind: "milestone", priority: 1 },
  /* The only `system` notification this app writes is the daily writing-goal
     achievement (`🎯 You hit your N-word daily writing goal!`), so it is
     treated as a milestone rather than a generic platform notice — that is
     what the data is, regardless of the type's name. */
  system: { Icon: AutoAwesomeIcon, label: "Writing goal", kind: "milestone", priority: 1 },
  newPost: { Icon: BoltIcon, label: "New post", kind: "story", priority: 3 },
  scheduledPublished: { Icon: ScheduleIcon, label: "Scheduled", kind: "story", priority: 3 },
};

const FALLBACK = { Icon: NotificationsIcon, label: "Activity", kind: "system", priority: 6 };

export const meta = (type) => TYPES[type] || FALLBACK;

/* Filters map 1:1 onto kinds the backend actually produces. `all` and
   `unread` are the two cross-cutting ones. */
export const FILTERS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "milestone", label: "Milestones" },
  { id: "conversation", label: "Conversations" },
  { id: "reaction", label: "Reactions" },
  { id: "follower", label: "Followers" },
];

export const matchesFilter = (n, filter) => {
  if (filter === "all") return true;
  if (filter === "unread") return !n.read;
  return meta(n.type).kind === filter;
};

/* Server-side `text` for like/comment/reply is intentionally empty; the
   sentences below are assembled from the same populated fields the API
   already returns. The others (badge/levelUp/system/newPost/scheduled)
   carry their own copy, which we strip of its leading emoji so the icon
   slot is the only glyph. */
const LEAD_GLYPH = /^[\p{Extended_Pictographic}️‍⃣\s]+/u;
export const bodyText = (n) => String(n.text || "").replace(LEAD_GLYPH, "").trim();

export const describe = (n) => {
  const actor = n.actor?.username || "";
  switch (n.type) {
    case "like":
      return actor ? `${actor} liked your story` : "Someone liked your story";
    case "comment":
      return actor ? `${actor} commented on your story` : "Someone commented on your story";
    case "reply":
      return actor ? `${actor} replied to your comment` : "Someone replied to your comment";
    case "follow":
      return actor ? `${actor} started following you` : "You have a new follower";
    default:
      // badge / levelUp / system / newPost / scheduledPublished all carry text.
      return bodyText(n) || (actor ? `${actor} interacted with your work` : "New activity");
  }
};

/* Related content — the blog the notification is about, when it has one.
   Rendered as a quoted second line, or omitted entirely. */
export const related = (n) => n.blog?.title || "";

/* Where a row goes when clicked. Only ever a route that exists. A row with
   no destination (a new follower has no public profile page in this app)
   is still clickable — it just marks itself read without navigating. */
export const destination = (n) => {
  if (n.blog?._id) return `/blog-details/${n.blog._id}`;
  if (n.type === "badge" || n.type === "levelUp") return "/rewards";
  return null;
};

/* ── Time ───────────────────────────────────────────────────────────── */

export const relativeTime = (dateStr) => {
  const then = new Date(dateStr).getTime();
  if (!Number.isFinite(then)) return "";
  const m = Math.floor((Date.now() - then) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d === 1 ? "" : "s"} ago`;
  return new Date(then).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export const GROUP_ORDER = ["Today", "Yesterday", "This week", "Earlier"];

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

export const groupLabel = (dateStr) => {
  const day = startOfDay(dateStr);
  if (!Number.isFinite(day)) return "Earlier";
  const diff = Math.round((startOfDay(Date.now()) - day) / 86400000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return "This week";
  return "Earlier";
};

/* Buckets an already-filtered list into the four named groups, in order,
   dropping empty ones — so the feed never prints a heading with nothing
   under it. */
export const groupByDay = (items) => {
  const buckets = new Map(GROUP_ORDER.map((label) => [label, []]));
  for (const n of items) buckets.get(groupLabel(n.created_at))?.push(n);
  return GROUP_ORDER.filter((label) => buckets.get(label).length).map((label) => ({
    label,
    items: buckets.get(label),
  }));
};

/* ── Summary ────────────────────────────────────────────────────────── */

/* Tiles for the summary strip. `unread` is the exact server-side total; the
   rest are counts over the notifications currently loaded. Only kinds with a
   non-zero count are returned, so the strip can never assert a false zero for
   activity that merely sits on a later page. */
export const summarise = (list, unreadCount) => {
  const tiles = [];
  if (unreadCount > 0) tiles.push({ id: "unread", label: "Unread", value: unreadCount });
  const byKind = { milestone: 0, conversation: 0, reaction: 0, follower: 0 };
  for (const n of list) {
    const k = meta(n.type).kind;
    if (k in byKind) byKind[k] += 1;
  }
  const LABELS = {
    milestone: "Milestones",
    conversation: "Conversations",
    reaction: "Reactions",
    follower: "Followers",
  };
  for (const k of ["milestone", "conversation", "reaction", "follower"]) {
    if (byKind[k] > 0) tiles.push({ id: k, label: LABELS[k], value: byKind[k] });
  }
  return tiles.slice(0, 5);
};
