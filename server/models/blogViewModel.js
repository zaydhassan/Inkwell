const mongoose = require("mongoose");

// Records that a given authenticated user has viewed a given blog. The unique
// compound index below means a (blog, user) pair can exist at most once, so we
// can attempt an insert and treat the 11000 duplicate-key error as "already
// viewed" — that's how `getBlogByIdController` awards `readArticle` points only
// on a reader's FIRST view of each blog, while still counting every fetch in
// `blog.views` (anonymous + repeat views increment the counter but earn no
// points). Anonymous (no req.user) views are not recorded here.
const blogViewSchema = new mongoose.Schema(
  {
    blog_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
      index: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    // How far through the article body the reader actually got (0–100),
    // reported by the reader's own scroll maths (components/ReadingProgress).
    // It is the FURTHEST point reached, never the latest: the reader writes it
    // with $max, so scrolling back to the top (or opening the article and
    // leaving immediately) can't erase the progress a previous visit earned.
    // 0 means "opened but never scrolled into the body", which is a real state
    // and is rendered as a plain "Read on <date>" rather than a 0% bar.
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // The most recent visit, as opposed to `created_at` (the FIRST view).
    // Together they let the history page separate "when you read it" from
    // "when you last came back to it".
    lastReadAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

// One view record per (blog, user). Enforced at the DB so concurrent first-view
// requests can't both award points.
blogViewSchema.index({ blog_id: 1, user_id: 1 }, { unique: true });

const BlogView = mongoose.model("BlogView", blogViewSchema);

module.exports = BlogView;