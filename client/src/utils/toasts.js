import React from "react";
import toast from "react-hot-toast";

/* ─────────────────────────────────────────────────────────────────────
   Unique toast notifications — one visual identity per event.

   Every toast carries its own tinted emoji badge so "logged in", "blog
   published", "bookmarked", … are distinguishable at a glance, rendered on
   the theme's glass surface (the global <Toaster> toastOptions in App.js
   supply the card styling via the CSS-variable layer in index.css, so
   light/dark both look right automatically).

   Call sites should use these helpers instead of raw toast.success() so
   event toasts stay consistent app-wide. Errors keep the standard red
   icon via plain toast.error() — already themed by the global options.
   ───────────────────────────────────────────────────────────────────── */

// Rounded badge behind each emoji — flips with the theme like every token.
const Badge = ({ children }) => (
  <span
    aria-hidden="true"
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 30,
      height: 30,
      borderRadius: 10,
      background: "var(--accent-soft)",
      border: "1px solid var(--divider)",
      fontSize: 15,
      lineHeight: 1,
      flexShrink: 0,
    }}
  >
    {children}
  </span>
);

// kind → [emoji, default message (string or fn), duration?]
const PRESETS = {
  login: ["👋", (name) => (name ? `Welcome back, ${name}!` : "Welcome back!"), 4000],
  logout: ["🌙", "Signed out. See you soon!", 4000],
  register: ["🎉", "Account created — welcome to Inkwell!", 4200],
  published: ["🚀", "Blog published! It's live now.", 4000],
  draft: ["📝", "Draft saved. Finish it anytime."],
  scheduled: ["📅", (when) => `Scheduled for ${when} — we'll publish it automatically.`],
  updated: ["✏️", "Blog updated."],
  deleted: ["🗑️", "Blog deleted."],
  profile: ["✨", "Profile updated.", 4000],
  reward: ["🎁", "Reward redeemed! Check your profile.", 4200],
  bookmark: ["🔖", (saved) => (saved ? "Saved to your bookmarks." : "Removed from bookmarks.")],
  comment: ["💬", "Comment posted."],
  commentUpdated: ["💬", "Comment updated."],
  commentDeleted: ["💬", "Comment deleted."],
  reply: ["💬", "Reply posted."],
  follow: ["🤝", (following) => (following ? "You're now following this writer." : "Unfollowed.")],
  goal: ["🎯", "Daily writing goal updated."],
  export: ["📄", (fmt) => `${fmt} downloaded.`],
  reset: ["📧", "Reset link sent — check your inbox.", 4200],
  contact: ["📬", "Message sent! We'll reply within 24 hours.", 4200],
};

const fire = (kind, message) => {
  const [emoji, defaultMessage, duration] = PRESETS[kind];
  toast(message ?? (typeof defaultMessage === "function" ? defaultMessage() : defaultMessage), {
    icon: <Badge>{emoji}</Badge>,
    ...(duration ? { duration } : {}),
  });
};

/* ── Auth ─────────────────────────────────────────────────────────── */
export const toastLogin = (name) =>
  fire("login", name ? PRESETS.login[1](name) : undefined);

export const toastLogout = () => fire("logout");
export const toastRegister = () => fire("register");
export const toastResetLink = () => fire("reset");

/* ── Blogs ────────────────────────────────────────────────────────── */
export const toastPublished = () => fire("published");
export const toastDraft = () => fire("draft");
export const toastScheduled = (when) => fire("scheduled", PRESETS.scheduled[1](when));
export const toastUpdated = () => fire("updated");
export const toastDeleted = () => fire("deleted");

/* ── Engagement ───────────────────────────────────────────────────── */
export const toastBookmarked = (saved) => fire("bookmark", PRESETS.bookmark[1](saved));
export const toastComment = () => fire("comment");
export const toastCommentUpdated = () => fire("commentUpdated");
export const toastCommentDeleted = () => fire("commentDeleted");
export const toastReply = () => fire("reply");
export const toastFollow = (following) => fire("follow", PRESETS.follow[1](following));

/* ── Account & misc ───────────────────────────────────────────────── */
export const toastProfileUpdated = () => fire("profile");
export const toastReward = () => fire("reward");
export const toastGoal = () => fire("goal");
export const toastExport = (format) => fire("export", PRESETS.export[1](format));
export const toastContactSent = () => fire("contact");