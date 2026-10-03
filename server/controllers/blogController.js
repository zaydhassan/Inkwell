const blogModel = require("../models/blogModel");
const userModel = require("../models/userModel");
const mongoose= require("mongoose");
const Tag = require("../models/Tag");
const BlogTag = require("../models/BlogTag");
const Comment = require("../models/commentModel");
const Like = require("../models/likeModel");
const BlogView = require("../models/blogViewModel");
const Bookmark = require("../models/bookmarkModel");
const Notification = require("../models/notificationModel");
const { awardActivity } = require("../utils/points");
const { createNotification } = require("../utils/notify");
const BlogRevision = require("../models/blogRevisionModel");
const { parsePagination, paginateMeta } = require("../utils/pagination");
const { sanitizeHtml } = require("../utils/sanitize");
const { recordWords, countWords } = require("../utils/writing");
const { notifyFollowersOfNewPost } = require("../utils/followNotify");
const { fileToUrl } = require("../config/upload");

// Trending is now computed from the REAL like / comment collections via
// $lookup, instead of sorting by the denormalized blog.likes / blog.comments
// arrays (which were removed — they were never kept in sync). Popularity =
// likeCount + commentCount + views.
exports.getTrendingBlogs = async (req, res) => {
  try {
    const trendingBlogs = await blogModel.aggregate([
      { $match: { status: "Published" } },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "blog_id",
          as: "likeDocs",
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "blog_id",
          as: "commentDocs",
        },
      },
      {
        $addFields: {
          likeCount: { $size: "$likeDocs" },
          commentCount: { $size: "$commentDocs" },
        },
      },
      { $sort: { likeCount: -1, commentCount: -1, views: -1, created_at: -1 } },
      { $limit: 5 },
      { $project: { likeDocs: 0, commentDocs: 0 } },
    ]);

    // Populate the author on the aggregation result (aggregate bypasses
    // Mongoose populate, so do it manually).
    await blogModel.populate(trendingBlogs, { path: "user", select: "username profile_image" });

    return res.status(200).json({ success: true, trending: trendingBlogs });
  } catch (error) {
    console.error("Error fetching trending blogs:", error.message);
    res.status(500).json({ success: false, message: "Error fetching trending blogs" });
  }
};

exports.getRecommendedBlogs = async (req, res) => {
  // Use the authenticated user; ignore the client-supplied :userId param.
  const userId = req.user._id;

  try {
    // Blogs the user has engaged with, derived from the real Like / Comment
    // collections (the old query used the removed blog.likes / blog.comments
    // arrays, which were stale and now gone).
    const [likedIds, commentedIds] = await Promise.all([
      Like.find({ user_id: userId }).distinct("blog_id"),
      Comment.find({ user_id: userId }).distinct("blog_id"),
    ]);
    const engagedIds = [...likedIds, ...commentedIds];

    let recommendedBlogs = [];
    if (engagedIds.length) {
      recommendedBlogs = await blogModel
        .find({ _id: { $in: engagedIds }, status: "Published" })
        .populate("user", "username profile_image")
        .limit(5);
    }

    if (recommendedBlogs.length === 0) {
      recommendedBlogs = await blogModel
        .find({ status: "Published" })
        .sort({ created_at: -1 })
        .populate("user", "username profile_image")
        .limit(5);
    }

    return res.status(200).json({ success: true, recommendations: recommendedBlogs });
  } catch (error) {
    console.error("Error fetching recommended blogs:", error.message);
    res.status(500).json({ success: false, message: "Error fetching recommended blogs." });
  }
};

// Tiny stopword list so title overlap counts meaningful words, not "the/a/and".
const TITLE_STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with",
  "is", "are", "at", "by", "from", "this", "that", "it", "as", "be", "your",
  "you", "how", "why", "what", "when", "into",
]);

// Tokenize a title into a Set of significant lowercase words (length >= 3,
// stopwords dropped). Used for lightweight title-keyword overlap scoring.
const titleTokens = (title) => {
  if (!title) return new Set();
  return new Set(
    String(title)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 3 && !TITLE_STOPWORDS.has(w))
  );
};

// Content-based "related posts" for the blog reader: score every published
// blog (except the current one) by shared tags (most important), same
// category, and title-keyword overlap, then return the top N. Unlike the
// existing getRecommendedBlogs (which is user-personalized by engagement),
// this is purely about the article itself, so it works for anonymous readers
// too. The catalog is small for a personal blog app, so in-memory scoring over
// a bounded recent window is plenty fast and avoids an aggregation pipeline.
exports.getRelatedBlogs = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid blog ID." });
    }

    const limit = Math.min(Number(req.query.limit) || 5, 10);

    const current = await blogModel.findById(id).populate("tags", "tag_name").lean();
    if (!current) {
      return res.status(404).json({ success: false, message: "Blog not found." });
    }

    const currentTagIds = new Set((current.tags || []).map((t) => String(t._id)));
    const currentTokens = titleTokens(current.title);
    const currentCategory = current.category;

    // Bounded candidate window: recent published blogs (excluding the current
    // one). 500 is far more than a personal blog will have and keeps scoring
    // cheap; raising it wouldn't change results meaningfully.
    const candidates = await blogModel
      .find({ status: "Published", _id: { $ne: id } })
      .sort({ created_at: -1 })
      .limit(500)
      .populate("user", "username profile_image")
      .populate("tags", "tag_name")
      .lean();

    const scored = candidates.map((b) => {
      let score = 0;
      // Shared tags carry the most weight — they're the author's own signal of
      // topical relevance.
      for (const t of b.tags || []) {
        if (currentTagIds.has(String(t._id))) score += 3;
      }
      if (currentCategory && b.category === currentCategory) score += 2;
      // Title keyword overlap is a weak tiebreaker for posts that share neither
      // tags nor category but are topically similar (e.g. "React hooks" vs
      // "Understanding React effects").
      if (currentTokens.size) {
        const tokens = titleTokens(b.title);
        let overlap = 0;
        for (const w of tokens) if (currentTokens.has(w)) overlap++;
        score += overlap;
      }
      return { blog: b, score };
    });

    // Highest score first; break ties by recency (newer wins) so a stale post
    // with a coincidental tag match doesn't outrank fresh, on-topic content.
    scored.sort((a, b) => b.score - a.score || (b.blog.created_at || 0) - (a.blog.created_at || 0));
    const related = scored.slice(0, limit).map((s) => s.blog);

    return res.status(200).json({ success: true, related });
  } catch (error) {
    console.error("Error fetching related blogs:", error.message);
    return res.status(500).json({ success: false, message: "Error fetching related blogs." });
  }
};

// ── Listing helpers ─────────────────────────────────────────────────────
// Blog documents carry no denormalized engagement counters (the old
// blog.likes / blog.comments arrays were removed because they were never kept
// in sync). Like and Comment live in their own collections, so attach real
// counts to a page of blogs with two grouped aggregations scoped to just that
// page's ids — O(1) queries per page instead of an N+1 per card.
const attachEngagementCounts = async (blogs) => {
  const ids = blogs.map((b) => b._id);
  if (!ids.length) return blogs;

  const countByBlog = async (Model) => {
    const rows = await Model.aggregate([
      { $match: { blog_id: { $in: ids } } },
      { $group: { _id: "$blog_id", count: { $sum: 1 } } },
    ]);
    return new Map(rows.map((r) => [String(r._id), r.count]));
  };

  const [likeMap, commentMap] = await Promise.all([countByBlog(Like), countByBlog(Comment)]);

  return blogs.map((blog) => {
    // toObject() first: a Mongoose document silently drops non-schema paths on
    // serialization, so the derived counters would never reach the client.
    const plain = blog.toObject ? blog.toObject() : blog;
    plain.likeCount = likeMap.get(String(plain._id)) || 0;
    plain.commentCount = commentMap.get(String(plain._id)) || 0;
    return plain;
  });
};

// Public listing search. A reader types a title word, a phrase from the body,
// a category, a tag or an author — so the $or covers all five. The tag and
// author arms need their own id lookups because MongoDB cannot run a regex
// against a populated field.
const buildListingSearch = async (searchRegex) => {
  if (!searchRegex) return null;
  const [userIds, tagIds] = await Promise.all([
    userModel.find({ username: searchRegex }).distinct("_id"),
    Tag.find({ tag_name: searchRegex }).distinct("_id"),
  ]);
  const or = [
    { title: searchRegex },
    { description: searchRegex },
    { category: searchRegex },
  ];
  if (userIds.length) or.push({ user: { $in: userIds } });
  if (tagIds.length) or.push({ tags: { $in: tagIds } });
  return or;
};

exports.getAllBlogsController = async (req, res) => {
  try {
    const { page, limit, skip, searchRegex } = parsePagination(req);
    const filter = { status: "Published" };
    const searchOr = await buildListingSearch(searchRegex);
    if (searchOr) filter.$or = searchOr;

    const [blogs, total] = await Promise.all([
      blogModel
        .find(filter)
        .populate({ path: "user", select: "username profile_image" })
        .populate("tags", "tag_name")
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      blogModel.countDocuments(filter),
    ]);

    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    return res.status(200).json({
      success: true,
      message: "All Blogs lists",
      blogs: await attachEngagementCounts(blogs),
      ...paginateMeta(page, limit, total),
    });
  } catch (error) {
    console.error("Error Fetching Blogs:", error);
    return res.status(500).json({
      success: false,
      message: "Error While Getting Blogs",
    });
  }
};

  exports.getBlogsByCategory = async (req, res) => {
    const category = req.params.category;
    try {
        const { page, limit, skip, searchRegex } = parsePagination(req);
        const filter = { category, status: "Published" };
        const searchOr = await buildListingSearch(searchRegex);
        if (searchOr) filter.$or = searchOr;
        const [blogs, total] = await Promise.all([
          blogModel
            .find(filter)
            .populate("user", "username profile_image")
            .populate("tags", "tag_name")
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit),
          blogModel.countDocuments(filter),
        ]);
        return res.status(200).json({ success: true, blogs: await attachEngagementCounts(blogs), ...paginateMeta(page, limit, total) });
    } catch (error) {
        console.error("Error fetching blogs by category:", error.message);
        res.status(500).json({ success: false, message: "Error fetching blogs by category." });
    }
};

// Public: browse blogs by tag. Accepts either a Tag ObjectId or a tag name.
exports.getBlogsByTag = async (req, res) => {
  const { tagId } = req.params;
  try {
    const { page, limit, skip, searchRegex } = parsePagination(req);
    let filter;
    if (mongoose.Types.ObjectId.isValid(tagId)) {
      filter = { tags: new mongoose.Types.ObjectId(tagId), status: "Published" };
    } else {
      const tag = await Tag.findOne({ tag_name: tagId });
      if (!tag) {
        return res.status(200).json({ success: true, blogs: [], ...paginateMeta(page, limit, 0) });
      }
      filter = { tags: tag._id, status: "Published" };
    }
    if (searchRegex) {
      const searchOr = await buildListingSearch(searchRegex);
      if (searchOr) filter.$or = searchOr;
    }

    const [blogs, total] = await Promise.all([
      blogModel
        .find(filter)
        .populate("tags", "tag_name")
        .populate("user", "username profile_image")
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      blogModel.countDocuments(filter),
    ]);
    return res.status(200).json({ success: true, blogs: await attachEngagementCounts(blogs), ...paginateMeta(page, limit, total) });
  } catch (error) {
    console.error("Error fetching blogs by tag:", error.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// Resolve a tags value (which may be an array of names, a JSON string of
// names, or an array of ObjectIds) into an array of Tag ObjectIds, creating
// any new tags as needed. Fixes the bug where sending tags as a JSON array
// silently produced [].
const resolveTagIds = async (tags) => {
  let parsed = tags;
  if (typeof tags === "string") {
    try {
      parsed = JSON.parse(tags);
    } catch {
      parsed = tags.split(",").map((t) => t.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(parsed)) parsed = [];

  return Promise.all(
    parsed.map(async (tagName) => {
      const name = String(tagName).trim();
      if (!name) return null;
      let tag = await Tag.findOne({ tag_name: name });
      if (!tag) tag = await Tag.create({ tag_name: name });
      return tag._id;
    })
  ).then((ids) => ids.filter(Boolean));
};

exports.createBlogController = async (req, res) => {
    try {
      // Cover image: an uploaded file wins; otherwise fall back to a client
      // pasted URL. fileToUrl handles both local disk and Cloudinary, and the
      // /schemas blogCreateSchema regex-validates that any pasted URL is an
      // http(s) URL — so neither a `javascript:`/`data:` URL nor a relative
      // path can reach the DB here.
      const uploadedImage = req.file ? fileToUrl(req.file) : req.body.image;
      const { title, category, tags, status = "Draft" } = req.body;
      // Sanitize rich text on write so stored XSS markup never reaches the DB.
      const description = sanitizeHtml(req.body.description);
      // The author is the authenticated user — never a body-supplied `user`.
      const authorId = req.user._id;

      if (!title || !description || !category) {
        return res.status(400).json({ success: false, message: "Please provide title, description and category." });
      }
      if (!uploadedImage) {
        return res.status(400).json({ success: false, message: "Image file is required." });
      }

      // Scheduled publish: a future `publishAt` means "hold this as a draft
      // and auto-publish at the given time." Stored as a Draft so it never
      // appears in public listings until promoted; earns no points up front
      // (the promotion sweep awards them when it goes live). A past/invalid
      // publishAt is rejected — use Publish instead.
      const publishAt = req.body.publishAt ? new Date(req.body.publishAt) : null;
      const isScheduled =
        publishAt && !Number.isNaN(publishAt.getTime()) && publishAt.getTime() > Date.now();
      if (req.body.publishAt && !isScheduled) {
        return res.status(400).json({ success: false, message: "Scheduled time must be a valid future date." });
      }

      const tagIds = await resolveTagIds(tags);
      const finalStatus = isScheduled ? "Draft" : (status || "Draft");

      const newBlog = new blogModel({
        title,
        description,
        image: uploadedImage,
        category,
        tags: tagIds,
        user: authorId,
        status: finalStatus,
        publishAt: isScheduled ? publishAt : null,
        views: 0,
      });

      const session = await mongoose.startSession();
      let publishDelta = null;
      try {
        session.startTransaction();
        await newBlog.save({ session });
        await Promise.all(
          tagIds.map(async (tagId) => {
            await new BlogTag({ blog_id: newBlog._id, tag_id: tagId }).save({ session });
          })
        );
        // Award publish points atomically with the blog creation when the
        // blog is published immediately. Scheduled posts (Drafts) earn nothing
        // now — the promotion sweep awards them when the post goes live.
        if (finalStatus === "Published") {
          publishDelta = await awardActivity(authorId, "publishArticle", 1, session);
        }

        await session.commitTransaction();
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }

      // Credit the author's daily writing ledger (streak + word-count goal).
      // Fire-and-forget after the commit so a ledger hiccup never blocks the
      // create. Counted once on creation; updates credit only the net delta.
      recordWords(authorId, countWords(title, description)).catch(() => {});

      // Alert the author's followers (in-app notification + email) only when
      // the post actually goes live now. Scheduled posts defer this to the
      // promotion sweep. Fire-and-forget after the commit.
      if (finalStatus === "Published") {
        notifyFollowersOfNewPost(authorId, newBlog).catch(() => {});
      }

      return res.status(201).json({
        success: true,
        message: isScheduled ? "Blog scheduled!" : "Blog Created!",
        newBlog,
        scheduled: isScheduled,
        points: publishDelta ? publishDelta.points : undefined,
        level: publishDelta ? publishDelta.level : undefined,
        badges: publishDelta ? publishDelta.badges : undefined,
        leveledUp: publishDelta ? publishDelta.leveledUp : false,
        newBadges: publishDelta ? publishDelta.newBadges : [],
      });
    } catch (error) {
      console.error("Create blog error:", error.message);
      return res.status(400).json({ success: false, message: "Error while creating blog." });
    }
};

exports.updateBlogController = async (req, res) => {
  try {
      const { id } = req.params;
      const { title, description, image, status, category, tags } = req.body;
      // Prefer a freshly uploaded file (parsed by multer) over a body-supplied
      // image URL; without this, an uploaded image on update was silently
      // dropped because the controller only read req.body.image. fileToUrl
      // resolves the URL for either local disk or Cloudinary. The blogUpdate
      // schema regex-validates any pasted URL is http(s) — no javascript:/
      // data:/relative-path can reach the DB.
      const uploadedImage = req.file ? fileToUrl(req.file) : image;
      // publishAt handling: an empty/null value clears any existing schedule.
      // A future date schedules the post (forces Draft if it isn't already, so
      // a scheduled post stays hidden until promoted). A past/invalid date is
      // rejected. "Publish now" is just status: "Published" + no publishAt,
      // handled by the existing publishingNow path below (which also clears
      // publishAt so an immediately-published post isn't later re-promoted).
      let publishAt = null;
      if (req.body.publishAt !== undefined && req.body.publishAt !== "" && req.body.publishAt !== null) {
        publishAt = new Date(req.body.publishAt);
        if (Number.isNaN(publishAt.getTime())) {
          return res.status(400).json({ success: false, message: "Scheduled time must be a valid date." });
        }
        if (publishAt.getTime() <= Date.now()) {
          return res.status(400).json({ success: false, message: "Scheduled time must be in the future." });
        }
      }

      const blog = await blogModel.findById(id);
      if (!blog) {
          return res.status(404).json({ success: false, message: "Blog not found." });
      }
      // Ownership: only the author (or an Admin) may edit.
      if (String(blog.user) !== String(req.user._id) && req.user.role !== "Admin") {
          return res.status(403).json({ success: false, message: "Not allowed to edit this blog." });
      }

      // Capture the PREVIOUS content (before any mutation below) so we can write
      // an "Auto" revision of it inside the save transaction — giving the writer
      // a one-click rollback to before-this-edit. Tags need their names, so
      // resolve them from the stored ObjectIds (the doc isn't populated here).
      const previousTitle = blog.title;
      const previousDescription = blog.description;
      const previousCategory = blog.category;
      let previousTagNames = [];
      if (Array.isArray(blog.tags) && blog.tags.length) {
        const prevTags = await Tag.find({ _id: { $in: blog.tags } }).select("tag_name -_id").lean();
        previousTagNames = prevTags.map((t) => t.tag_name);
      }
      // Word count of the PREVIOUS content, so the writing ledger only credits
      // NET new words on an edit (max(0, new - prev)) — re-saving an unchanged
      // post never inflates the streak/goal.
      const previousWords = countWords(previousTitle, previousDescription);

      if (title !== undefined) blog.title = title;
      if (description !== undefined) blog.description = sanitizeHtml(description);
      if (uploadedImage !== undefined && uploadedImage !== "") blog.image = uploadedImage;
      // A future publishAt => schedule: force Draft (hide until promoted) and
      // never award points here. Otherwise: honor status, clear any prior
      // schedule on explicit unschedule/publish-now so the sweep doesn't
      // re-touch it. publishAt omitted entirely preserves an existing schedule.
      const scheduling = publishAt !== null;
      const publishingNow =
        !scheduling &&
        status !== undefined &&
        status === "Published" &&
        blog.status !== "Published";
      if (scheduling) {
        blog.publishAt = publishAt;
        blog.status = "Draft";
      } else {
        if (req.body.publishAt !== undefined) blog.publishAt = null; // explicit unschedule
        if (status !== undefined) blog.status = status;
        if (publishingNow) blog.publishAt = null; // publish-now wins over a prior schedule
      }
      if (category !== undefined) blog.category = category;
      if (tags !== undefined) blog.tags = await resolveTagIds(tags);

      // Save the blog and award the publish points atomically: if the point
      // award fails, the status change rolls back too, so a "Published" blog
      // always has its points (and vice versa).
      const session = await mongoose.startSession();
      let publishDelta = null;
      try {
        await session.withTransaction(async () => {
          await blog.save({ session });
          if (publishingNow) {
            publishDelta = await awardActivity(req.user._id, "publishArticle", 1, session);
          }
          // Auto-snapshot of the PREVIOUS content, so the writer can roll back
          // to before this edit. Atomic with the update: if the save rolls back,
          // no orphan revision is left behind. Skipped only if the post had no
          // title previously (shouldn't happen for an existing blog).
          if (previousTitle) {
            await BlogRevision.create(
              [{
                blog: blog._id,
                author: req.user._id,
                title: previousTitle,
                description: previousDescription,
                category: previousCategory,
                tags: previousTagNames,
                label: "Auto",
              }],
              { session }
            );
          }
        });
      } finally {
        session.endSession();
      }

      // Credit only net-new words to the daily writing ledger (streak + goal).
      // Fire-and-forget after the commit; never blocks the update response.
      const newWords = countWords(blog.title, blog.description);
      const delta = Math.max(0, newWords - previousWords);
      if (delta > 0) recordWords(req.user._id, delta).catch(() => {});

      // A Draft→Published transition is a real publish: alert the author's
      // followers. Fire-and-forget after the commit.
      if (publishingNow) {
        notifyFollowersOfNewPost(req.user._id, blog).catch(() => {});
      }

      return res.status(200).json({
        success: true,
        message: scheduling ? "Blog scheduled!" : "Blog Updated!",
        blog,
        scheduled: scheduling,
        points: publishDelta ? publishDelta.points : undefined,
        level: publishDelta ? publishDelta.level : undefined,
        badges: publishDelta ? publishDelta.badges : undefined,
        leveledUp: publishDelta ? publishDelta.leveledUp : false,
        newBadges: publishDelta ? publishDelta.newBadges : [],
      });
  } catch (error) {
      console.error("Error updating blog:", error.message);
      return res.status(500).json({ success: false, message: "Error updating blog." });
  }
};

  exports.getUserDrafts = async (req, res) => {
    try {
        const { userId } = req.params;
        // A user may only read their own drafts (Admin may read anyone's).
        if (String(userId) !== String(req.user._id) && req.user.role !== "Admin") {
          return res.status(403).json({ success: false, message: "Not allowed." });
        }
        const drafts = await blogModel.find({ user: userId, status: "Draft" });

        res.status(200).json({ success: true, drafts });
    } catch (error) {
        console.error("Error retrieving drafts:", error.message);
        res.status(500).json({ success: false, message: "Error retrieving drafts." });
    }
};
  
  exports.getBlogByIdController = async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid blog ID." });
      }

      // Fetch WITHOUT incrementing views yet. We must gate visibility first:
      // a non-Published blog is only visible to its author (or an Admin).
      // Previously this incremented views and returned the blog unconditionally,
      // so any logged-in user could read someone else's Draft/Scheduled post by
      // its ID (an IDOR) — and that fetch also bumped the draft's view count.
      const blog = await blogModel
        .findById(id)
        .populate("user", "username profile_image");

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: "Blog not found with this ID.",
        });
      }

      const isOwner = req.user && String(req.user._id) === String(blog.user._id || blog.user);
      const isAuthorized = isOwner || req.user?.role === "Admin";

      // Hide non-published blogs from everyone but the author/Admin. Return 404
      // (not 403) so the existence of a private/draft post isn't leaked.
      if (blog.status !== "Published" && !isAuthorized) {
        return res.status(404).json({
          success: false,
          message: "Blog not found with this ID.",
        });
      }

      // Now that the caller is allowed to see it, count the view. Use `$inc` so
      // concurrent views don't lose increments. Draft/scheduled views by the
      // author are still counted (harmless, and useful for the author's own
      // analytics).
      await blogModel.updateOne({ _id: id }, { $inc: { views: 1 } });
      blog.views = (blog.views || 0) + 1;

      // For an authenticated reader, award `readArticle` points once per blog
      // (deduped by the BlogView unique index). Anonymous fetches skip this.
      if (req.user) {
        try {
          await BlogView.create({ blog_id: blog._id, user_id: req.user._id });
          // Insert succeeded → first view by this user → award points.
          // awardActivity is a no-op for Writers/Admins (readArticle is a
          // reader-only activity), so authors viewing their own posts earn 0.
          await awardActivity(req.user._id, "readArticle", 1);
        } catch (viewErr) {
          // 11000 = duplicate key → this user already viewed this blog. Skip
          // the award (they already got their points on the first view). Any
          // other error is logged but never blocks the read.
          if (viewErr?.code !== 11000) {
            console.error("BlogView record failed:", viewErr.message);
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: "Fetched single blog.",
        blog,
      });
    } catch (error) {
      console.error("Error fetching single blog:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error while getting single blog.",
      });
    }
  };
  
  exports.deleteBlogController = async (req, res) => {
    try {
      const blogId = req.params.id;
      
      if (!mongoose.Types.ObjectId.isValid(blogId)) {
        return res.status(400).json({ success: false, message: "Invalid blog ID" });
      }
  
      const blog = await blogModel.findById(blogId);
      if (!blog) {
        return res.status(404).json({ success: false, message: "Blog not found" });
      }
      // Ownership: only the author (or an Admin) may delete.
      if (String(blog.user) !== String(req.user._id) && req.user.role !== "Admin") {
        return res.status(403).json({ success: false, message: "Not allowed to delete this blog." });
      }

      // Cascade: remove the blog's comments, likes, bookmarks, notifications,
      // view rows, revision history and tag links so we don't leave orphaned
      // docs pointing at a deleted blog. (BlogRevision + BlogTag were missing
      // from this cascade — they leaked revisions and stale tag-join rows.)
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          await Comment.deleteMany({ blog_id: blog._id }).session(session);
          await Like.deleteMany({ blog_id: blog._id }).session(session);
          await Bookmark.deleteMany({ blog: blog._id }).session(session);
          await Notification.deleteMany({ blog: blog._id }).session(session);
          await BlogView.deleteMany({ blog_id: blog._id }).session(session);
          await BlogRevision.deleteMany({ blog: blog._id }).session(session);
          await BlogTag.deleteMany({ blog_id: blog._id }).session(session);
          await blogModel.deleteOne({ _id: blog._id }).session(session);
        });
      } finally {
        session.endSession();
      }

      return res.status(200).json({ success: true, message: "Blog Deleted Successfully!" });
    } catch (error) {
      console.error("Error deleting blog:", error.message);
      return res.status(500).json({ success: false, message: "Internal Server Error." });
    }
  };

  exports.userBlogController = async (req, res) => {
    try {
      // A user may only list their own blogs (Admin may list anyone's).
      if (String(req.params.id) !== String(req.user._id) && req.user.role !== "Admin") {
        return res.status(403).json({ success: false, message: "Not allowed." });
      }
      const user = await userModel.findById(req.params.id).select("username");
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "blogs not found with this id",
        });
      }
      // The user's blogs are sourced from the Blog collection (blogModel.user
      // is the source of truth) rather than the removed denormalized
      // user.blogs array. The response shape ({ userBlog: { blogs } }) is
      // preserved so the client needs no change.
      const blogs = await blogModel.find({ user: req.params.id }).sort({ created_at: -1 });
      return res.status(200).json({
        success: true,
        message: "user blogs",
        userBlog: { _id: user._id, username: user.username, blogs },
      });
    } catch (error) {
      console.error("Error in user blog:", error.message);
      return res.status(400).json({
        success: false,
        message: "error in user blog",
      });
    }
  };

// Scheduled-publish promotion sweep. Flips any "Draft" whose `publishAt` has
// passed to "Published", awarding the same publish points an immediate
// publish earns and notifying the author. Each promotion is an atomic
// conditional updateOne filtered by `status: "Draft"` — so even with multiple
// server instances running the sweep, exactly one instance wins the flip
// (modifiedCount === 1) and awards points + notifies; the others match zero
// docs and do nothing. No double-award, no double follower email. Each post
// runs in its own transaction so one failure never blocks the others.
exports.promoteScheduledBlogs = async () => {
  try {
    const due = await blogModel.find({
      status: "Draft",
      publishAt: { $ne: null, $lte: new Date() },
    });

    if (!due.length) return 0;

    let promoted = 0;
    for (const blog of due) {
      const session = await mongoose.startSession();
      try {
        let flipped = false;
        const ownerId = blog.user;
        await session.withTransaction(async () => {
          // Atomically Draft→Published ONLY if still a Draft. A concurrent
          // instance (or a re-run) that already promoted this post matches
          // zero docs here → no award, no notification.
          const result = await blogModel.updateOne(
            { _id: blog._id, status: "Draft" },
            { $set: { status: "Published", publishAt: null } },
            { session }
          );
          flipped = result.modifiedCount === 1;
          if (!flipped) return;
          // Award publish points now that the post is actually live (a
          // scheduled create deferred these until publication time).
          await awardActivity(ownerId, "publishArticle", 1, session);
          await createNotification(
            {
              recipient: ownerId,
              actor: null,
              type: "scheduledPublished",
              blog: blog._id,
              text: `Your scheduled post "${blog.title}" is now live.`,
            },
            session
          );
        });
        if (flipped) {
          // Now live — alert the author's followers (in-app + email). Fetch the
          // promoted doc so followers see the Published state.
          const fresh = await blogModel.findById(blog._id);
          notifyFollowersOfNewPost(ownerId, fresh).catch(() => {});
          promoted++;
        }
      } catch (err) {
        console.error(`Scheduled promotion failed for blog ${blog._id}:`, err.message);
      } finally {
        session.endSession();
      }
    }

    if (promoted) console.log(`Scheduled publisher: promoted ${promoted} post(s).`);
    return promoted;
  } catch (error) {
    console.error("Scheduled promotion error:", error.message);
    return 0;
  }
};
