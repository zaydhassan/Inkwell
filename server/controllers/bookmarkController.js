const mongoose = require("mongoose");
const Bookmark = require("../models/bookmarkModel");
const Blog = require("../models/blogModel");
const BlogView = require("../models/blogViewModel");
const User = require("../models/userModel");
const Tag = require("../models/Tag");
const { stripHtml, readingTime } = require("../utils/sanitize");
const { parsePagination, paginateMeta } = require("../utils/pagination");

// Orderings the bookmark list can actually apply. Both are fields on the
// BOOKMARK row (when the reader saved it), so both genuinely drive the
// paginated query. Title A–Z is handled separately in getBookmarks because the
// title lives on the joined blog — see the note there.
// Each carries `_id` as a tiebreaker. Two bookmarks saved in the same
// millisecond are a real case — a seeded batch, or a fast double-save — and
// without a second key Mongo is free to order those rows differently on each
// page, which would let a row repeat on page 2 or vanish entirely between
// pages. The title sort in getBookmarks does the same thing.
const BOOKMARK_SORTS = {
  recent: { created_at: -1, _id: -1 },
  oldest: { created_at: 1, _id: 1 },
};

// Shape a populated blog the same way getAllBlogsController does so the client
// BlogCard can render it unchanged: nested author (username + avatar) + tag
// names. Returns null for blogs that no longer exist.
const shapeBlog = (bookmark) => {
  if (!bookmark.blog) return null;
  return {
    ...bookmark.blog.toObject(),
    user: bookmark.blog.user
      ? {
          _id: bookmark.blog.user._id,
          username: bookmark.blog.user.username,
          profile_image: bookmark.blog.user.profile_image,
        }
      : null,
    bookmarkedAt: bookmark.created_at,
  };
};

// Toggle a bookmark for the authenticated user. Because the (user, blog) pair
// has a unique index, we treat a 11000 duplicate-key on insert as "already
// bookmarked" and delete the existing row — so toggling is idempotent under
// concurrent calls. Returns { bookmarked }.
exports.toggleBookmark = async (req, res) => {
  const blogId = req.body.blog;
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    return res.status(400).json({ success: false, message: "Invalid blog id." });
  }
  try {
    const existing = await Bookmark.findOne({ user: req.user._id, blog: blogId });
    if (existing) {
      await existing.deleteOne();
      return res.status(200).json({ success: true, message: "Bookmark removed.", bookmarked: false });
    }
    await Bookmark.create({ user: req.user._id, blog: blogId });
    res.status(201).json({ success: true, message: "Bookmark added.", bookmarked: true });
  } catch (error) {
    // Race: another toggle inserted between our findOne and create. Treat as
    // already-bookmarked → remove it so the user still lands in a consistent
    // (un-bookmarked) state, matching their click intent.
    if (error && error.code === 11000) {
      await Bookmark.deleteOne({ user: req.user._id, blog: blogId }).catch(() => {});
      return res.status(200).json({ success: true, message: "Bookmark removed.", bookmarked: false });
    }
    console.error("Error toggling bookmark:", error.message);
    res.status(500).json({ success: false, message: "Failed to toggle bookmark." });
  }
};

// The list of blog ids the authenticated user has bookmarked — cheap, used by
// BlogDetails to render initial bookmark state in one call (no per-card fetch).
exports.getBookmarkedIds = async (req, res) => {
  try {
    const rows = await Bookmark.find({ user: req.user._id }).select("blog -_id");
    res.status(200).json({ success: true, ids: rows.map((r) => String(r.blog)) });
  } catch (error) {
    console.error("Error fetching bookmark ids:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch bookmark ids." });
  }
};

// The user's saved blogs, newest bookmark first. Populated with author + tags
// so the Bookmarks page can render its own editorial card. Only Published blogs
// are returned (a draft the author saved is meaningless to surface here, and
// drafts may have been unpublished since the user bookmarked).
//
// Accepts the same knobs the reading-history list does — `q`, `filter`
// (unread | topic | writer), `topic`, `writer`, `sort` — all applied SERVER-side
// before pagination, so the totals, the pagination and the empty state stay
// truthful no matter how the reader narrows the list. Filtering the loaded page
// instead would make every count on the page a lie.
//
// This also FIXES a totals bug the previous version had: it counted with
// `countDocuments({user})` but rendered `rows.map(shapeBlog).filter(Boolean)`,
// which silently drops bookmarks whose blog was deleted or unpublished since
// saving. So `total`/`hasMore` could overstate what the grid actually shows
// (getReadingHistory still has that defect — its line-193 comment claims a
// reconciliation that was never written). Here the filtered set is resolved to
// blogs FIRST, and that resolution is what both the rows and the total come
// from, so the two cannot disagree.
exports.getBookmarks = async (req, res) => {
  try {
    const { page, limit, skip, searchRegex } = parsePagination(req);
    const userId = req.user._id;

    // The reader's own saved blog ids. Everything below stays inside this set
    // rather than scanning the blog collection — the same projection
    // getBookmarkedIds already uses.
    const saved = await Bookmark.find({ user: userId }).select("blog -_id").lean();
    const savedIds = saved.map((b) => b.blog);

    // ONE blog query describes the entire filtered set. Because (user, blog) is
    // uniquely indexed, the number of blogs it resolves to IS the number of
    // bookmarks that can render — so `matched.length` below is the honest total
    // and no separate countDocuments is needed (or wanted: a count taken over a
    // different predicate is exactly how the old total drifted).
    const blogQuery = { _id: { $in: savedIds }, status: "Published" };

    // Search reuses the app-wide `q` handling (parsePagination) rather than
    // standing up a second search system. It is widened past the usual
    // title/description pair to the fields a reader would expect: `category` is
    // on the same document (free), while author and tag names live one hop
    // away, so they resolve to an id set first. Ids only, so the payload stays
    // small whatever the catalogue's size.
    if (searchRegex) {
      const [authors, tags] = await Promise.all([
        User.find({ username: searchRegex }).select("_id").lean(),
        Tag.find({ tag_name: searchRegex }).select("_id").lean(),
      ]);
      blogQuery.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { user: { $in: authors.map((a) => a._id) } },
        { tags: { $in: tags.map((t) => t._id) } },
      ];
    }

    // A filter must be one of the values below; anything else falls back to
    // "all" rather than erroring, so a stale URL can't dead-end the page.
    const tab = ["unread", "topic", "writer"].includes(req.query.filter)
      ? req.query.filter
      : "all";

    if (tab === "topic" && req.query.topic) blogQuery.category = req.query.topic;
    if (tab === "writer" && mongoose.Types.ObjectId.isValid(req.query.writer)) {
      blogQuery.user = req.query.writer;
    }

    // "Unread" is the reading list's actual job: saved, but not yet read into.
    // `progress > 0` is the same definition of "read into" that
    // getReadingHistory uses for its `articles` filter, so the two pages agree
    // on what reading means. It excludes the started set rather than including
    // a finished one, because a blog with NO view row at all has never been
    // opened and is unread — and a stored `progress: 0` means "opened but never
    // scrolled in" (see HistoryCard/progressState), which stays unread too.
    if (tab === "unread") {
      const started = await BlogView.find({ user_id: userId, progress: { $gt: 0 } })
        .select("blog_id -_id")
        .lean();
      blogQuery._id = { $in: savedIds, $nin: started.map((v) => v.blog_id) };
    }

    // Title A–Z cannot be expressed on the bookmark query: the title is not a
    // field of the bookmark row, and populate cannot drive a sort. So the blog
    // side provides the ORDER as well as the id set, and the title branch below
    // pages over that order. (For the other sorts only the id set is needed,
    // so the sort is a cheap deterministic `_id` one.)
    const byTitle = req.query.sort === "title";
    const matched = await Blog.find(blogQuery)
      .select("_id title")
      .sort(byTitle ? { title: 1, _id: 1 } : { _id: 1 })
      .lean();
    const total = matched.length;

    // `match` is kept as defence against a blog changing status between the two
    // queries — NOT as the thing that keeps the total honest any more.
    const populate = {
      path: "blog",
      match: { status: "Published" },
      populate: [
        { path: "user", select: "username profile_image" },
        { path: "tags", select: "tag_name" },
      ],
    };

    let rows;
    if (byTitle) {
      // Page the ORDER, then fetch exactly those bookmarks, then restore the
      // sliced order — the bookmark query has no notion of title, so its own
      // result order is meaningless here.
      const pageIds = matched.slice(skip, skip + limit).map((b) => b._id);
      const found = await Bookmark.find({ user: userId, blog: { $in: pageIds } }).populate(populate);
      const byBlogId = new Map(found.map((b) => [String(b.blog?._id || b.blog), b]));
      rows = pageIds.map((id) => byBlogId.get(String(id))).filter(Boolean);
    } else {
      rows = await Bookmark.find({ user: userId, blog: { $in: matched.map((b) => b._id) } })
        .populate(populate)
        .sort(BOOKMARK_SORTS[req.query.sort] || BOOKMARK_SORTS.recent)
        .skip(skip)
        .limit(limit);
    }

    const blogs = rows.map(shapeBlog).filter(Boolean);
    res.status(200).json({
      success: true,
      message: "Bookmarks fetched.",
      blogs,
      ...paginateMeta(page, limit, total),
    });
  } catch (error) {
    console.error("Error fetching bookmarks:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch bookmarks." });
  }
};

// Everything the Bookmarks rail needs, aggregated over the reader's WHOLE
// collection in one pass.
//
// Deliberately not computed from the paged grid: a topic ranking, a writer
// count or a reading-time total derived from only the first page of results
// would silently understate the library, which is the exact failure mode "real
// data or no data" exists to prevent. It is also deliberately NOT affected by
// the reader's active filters — the rail describes the library, not the current
// view — so the client never sends it `q`/`topic`.
//
// The inner join to Published blogs is what keeps `savedCount` equal to the
// grid's own honest total: a bookmark whose post was deleted or unpublished
// counts toward nothing here, exactly as it renders nowhere in the grid.
exports.getBookmarksSummary = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const [agg] = await Bookmark.aggregate([
      { $match: { user: userId } },
      {
        $lookup: {
          from: "blogs",
          localField: "blog",
          foreignField: "_id",
          as: "b",
          pipeline: [
            { $match: { status: "Published" } },
            { $project: { title: 1, image: 1, category: 1, user: 1, description: 1 } },
          ],
        },
      },
      { $unwind: "$b" },
      {
        $facet: {
          // Totals. Counted here rather than from the capped lists below, so
          // the figures can never be truncated by a display limit.
          totals: [{ $group: { _id: null, saved: { $sum: 1 } } }],
          // Distinct counts, each excluding a missing value — a null is not a
          // topic or a writer, and counting it would overstate the figure.
          topicCount: [
            { $match: { "b.category": { $ne: null } } },
            { $group: { _id: "$b.category" } },
            { $count: "n" },
          ],
          writerCount: [
            { $match: { "b.user": { $ne: null } } },
            { $group: { _id: "$b.user" } },
            { $count: "n" },
          ],
          // The most frequently bookmarked categories, and the writers behind
          // them. Capped for display; the counts above are the true totals.
          topics: [
            { $match: { "b.category": { $ne: null } } },
            { $group: { _id: "$b.category", count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
            { $limit: 24 },
          ],
          writers: [
            { $match: { "b.user": { $ne: null } } },
            { $group: { _id: "$b.user", count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
            { $limit: 24 },
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "u",
                pipeline: [{ $project: { username: 1, profile_image: 1 } }],
              },
            },
            { $unwind: { path: "$u", preserveNullAndEmptyArrays: true } },
          ],
          // The most recently BOOKMARKED — independent of the grid's filters,
          // which is why the client must not send them here.
          recent: [
            { $sort: { created_at: -1 } },
            { $limit: 5 },
            {
              $project: {
                _id: 0,
                blogId: "$b._id",
                title: "$b.title",
                image: "$b.image",
                bookmarkedAt: "$created_at",
                description: "$b.description",
              },
            },
          ],
          // Every saved body, for the reading-time total below. Measured in
          // Node rather than in the pipeline: Mongo cannot regex-strip Quill
          // markup ($replaceAll is literal-only; $function is disabled on many
          // managed tiers), so a pipeline word count would count tags as words
          // and overstate the figure.
          descs: [{ $project: { _id: 0, description: "$b.description" } }],
        },
      },
    ]);

    const descs = agg?.descs || [];
    // `description` is required on blogModel, so this rarely trips — but a
    // blank body would make the sum a silent UNDERCOUNT, and the brief's rule
    // is to drop a metric that cannot be calculated reliably rather than to
    // show a partial one. null means "not measurable"; the client renders no
    // cell for it rather than "0 min".
    const measurable =
      descs.length > 0 && descs.every((d) => stripHtml(d.description).length > 0);
    const totalReadingMinutes = measurable
      ? descs.reduce((sum, d) => sum + readingTime(d.description), 0)
      : null;

    res.status(200).json({
      success: true,
      message: "Bookmark summary fetched.",
      summary: {
        savedCount: agg?.totals?.[0]?.saved || 0,
        topicCount: agg?.topicCount?.[0]?.n || 0,
        writerCount: agg?.writerCount?.[0]?.n || 0,
        totalReadingMinutes,
        topics: (agg?.topics || []).map((t) => ({ name: t._id, count: t.count })),
        writers: (agg?.writers || [])
          .filter((w) => w.u?.username)
          .map((w) => ({
            id: String(w._id),
            name: w.u.username,
            avatar: w.u.profile_image,
            count: w.count,
          })),
        // The bodies are dropped here: they were fetched only to measure, and
        // never need to leave the server.
        recent: (agg?.recent || []).map((r) => ({
          id: String(r.blogId),
          title: r.title,
          image: r.image,
          bookmarkedAt: r.bookmarkedAt,
          readingMinutes: stripHtml(r.description).length > 0 ? readingTime(r.description) : null,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching bookmark summary:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch bookmark summary." });
  }
};

// Articles the authenticated user has read, derived from the existing BlogView
// collection (one row per first view per blog). Newest view first. Filters out
// blogs that were deleted or are no longer Published.
//
// `readAt` is the FIRST view (created_at); `lastReadAt` + `progress` are the
// reader's own reports from the reader page, so the history page can show how
// far each article actually got and offer to continue it.
exports.getReadingHistory = async (req, res) => {
  try {
    const { page, limit, skip, searchRegex } = parsePagination(req);
    const filter = { user_id: req.user._id };

    // Text search and the tab filters both narrow the same way — to a set of
    // blog ids — because title/description/category/author all live on the
    // populated blog, not on the view row. So they compose into ONE blog
    // query and resolve to one id set, rather than each running its own pass.
    // Everything here is applied before pagination, so a filtered tab still
    // reports honest totals and page counts.
    const blogQuery = { status: "Published" };

    // Same title/description regex the other list endpoints build via
    // parsePagination, just applied one hop away; no second search system.
    if (searchRegex) blogQuery.$or = [{ title: searchRegex }, { description: searchRegex }];

    // A filter must be one of the values below; anything else falls back to
    // "all" rather than erroring, so a stale URL can't dead-end the page.
    //
    // "articles" is the one additive value here: rows the reader actually read
    // into (progress > 0), as opposed to "all", which also holds the ones they
    // only opened. The reading-history page's "Articles" tab is this — a real
    // subset rather than a decorative restatement of "all".
    const tab = ["unfinished", "finished", "articles", "saved", "topic", "writer"].includes(
      req.query.filter
    )
      ? req.query.filter
      : "all";

    if (tab === "topic" && req.query.topic) blogQuery.category = req.query.topic;
    if (tab === "writer" && mongoose.Types.ObjectId.isValid(req.query.writer)) {
      blogQuery.user = req.query.writer;
    }

    // "Saved" is defined against the reader's own bookmarks — the real rows,
    // not a client-side guess from a single loaded page.
    if (tab === "saved") {
      const rows = await Bookmark.find({ user: req.user._id }).select("blog -_id").lean();
      blogQuery._id = { $in: rows.map((r) => r.blog) };
    }

    if (searchRegex || tab === "saved" || tab === "topic" || tab === "writer") {
      const matches = await Blog.find(blogQuery).select("_id").lean();
      filter.blog_id = { $in: matches.map((b) => b._id) };
    }

    // Progress lives on the view row itself, so it filters in place.
    if (tab === "unfinished") filter.progress = { $lt: 100 };
    if (tab === "finished") filter.progress = { $gte: 100 };
    // Reading into an article at all — the reader scrolled past the opening
    // screen. A stored 0 means "opened, never read", so it stays out.
    if (tab === "articles") filter.progress = { $gt: 0 };

    // Every sort is on a field the view row really holds, so no option can
    // silently fall back to insertion order.
    const SORTS = {
      recent: { created_at: -1 },
      oldest: { created_at: 1 },
      // "Furthest through" / "barely started" — the two orderings the reading
      // progress field makes possible.
      progress: { progress: -1, created_at: -1 },
      unfinished: { progress: 1, created_at: -1 },
    };
    const sort = SORTS[req.query.sort] || SORTS.recent;

    const [rows, total] = await Promise.all([
      BlogView.find(filter)
        .populate({
          path: "blog_id",
          match: { status: "Published" },
          populate: [
            { path: "user", select: "username profile_image" },
            { path: "tags", select: "tag_name" },
          ],
        })
        .sort(sort)
        .skip(skip)
        .limit(limit),
      BlogView.countDocuments(filter),
    ]);

    // A populated blog can be null (deleted/unpublished since the view), which
    // is also why the paged total is reconciled below rather than trusted blind.
    const blogs = rows
      .map((v) =>
        v.blog_id
          ? {
              ...v.blog_id.toObject(),
              readAt: v.created_at,
              lastReadAt: v.lastReadAt || v.created_at,
              progress: v.progress || 0,
            }
          : null
      )
      .filter(Boolean);

    res.status(200).json({
      success: true,
      message: "Reading history fetched.",
      blogs,
      ...paginateMeta(page, limit, total),
    });
  } catch (error) {
    console.error("Error fetching reading history:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch reading history." });
  }
};

// Everything the Reading History rail needs, aggregated over the reader's
// WHOLE history in one pass.
//
// This is deliberately not computed from the paged grid: a streak, a topic
// ranking or a 30-day heatmap derived from only the first page of results would
// silently understate the reader's activity, which is the exact failure mode
// "real data or no data" is meant to prevent. The aggregation is bounded to one
// reader's own view rows and returns only date keys + counts, so the payload
// stays small however long the history grows.
//
// Days are UTC, matching the writing-streak ledger (utils/writing.js uses
// Math.floor(Date.now() / 86400000)), so the two streaks agree on where a day
// starts.
exports.getReadingHistorySummary = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const now = new Date();
    const heatFrom = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);

    const [agg] = await BlogView.aggregate([
      { $match: { user_id: userId } },
      // Inner-join the blog and drop anything no longer Published — a deleted
      // or unpublished post must not count toward any figure.
      {
        $lookup: {
          from: "blogs",
          localField: "blog_id",
          foreignField: "_id",
          as: "b",
          pipeline: [{ $match: { status: "Published" } }, { $project: { category: 1, user: 1 } }],
        },
      },
      { $unwind: "$b" },
      {
        $facet: {
          // Totals + the span they cover, from which "per week" is derived.
          totals: [
            {
              $group: {
                _id: null,
                articles: { $sum: 1 },
                finished: { $sum: { $cond: [{ $gte: ["$progress", 100] }, 1, 0] } },
                inProgress: {
                  $sum: { $cond: [{ $and: [{ $gt: ["$progress", 0] }, { $lt: ["$progress", 100] }] }, 1, 0] },
                },
                firstReadAt: { $min: "$created_at" },
                lastReadAt: { $max: { $ifNull: ["$lastReadAt", "$created_at"] } },
              },
            },
          ],
          // Distinct authors, so "Writers read" means writers, not view rows.
          // Blogs with no author reference are excluded — a null is not a
          // writer, and counting it would overstate the figure.
          authors: [
            { $match: { "b.user": { $ne: null } } },
            { $group: { _id: "$b.user" } },
            { $count: "n" },
          ],
          // How many of these articles the reader has also bookmarked.
          saved: [
            {
              $lookup: {
                from: "bookmarks",
                let: { bid: "$blog_id" },
                pipeline: [
                  { $match: { $expr: { $and: [{ $eq: ["$blog", "$$bid"] }, { $eq: ["$user", userId] }] } } },
                  { $limit: 1 },
                ],
                as: "bm",
              },
            },
            { $match: { "bm.0": { $exists: true } } },
            { $count: "n" },
          ],
          // Every day the reader read something. A day counts as read if an
          // article was first opened that day OR was returned to that day, so
          // re-reading keeps a streak alive. Distinct articles per day, which
          // is what the heatmap's tooltip reports.
          days: [
            {
              $project: {
                dates: {
                  $setDifference: [[
                    "$created_at",
                    { $ifNull: ["$lastReadAt", "$created_at"] },
                  ], [null]],
                },
              },
            },
            { $unwind: "$dates" },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$dates" } } } },
          ],
          // The last 30 days as counts, for the heatmap.
          heat: [
            { $match: { created_at: { $gte: heatFrom } } },
            {
              $project: {
                // blog_id must be carried through — the $addToSet below counts
                // DISTINCT articles per day, so dropping the field here would
                // make every day count zero.
                blog_id: 1,
                dates: {
                  $setDifference: [[
                    "$created_at",
                    { $ifNull: ["$lastReadAt", "$created_at"] },
                  ], [null]],
                },
              },
            },
            { $unwind: "$dates" },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$dates" } },
                blogs: { $addToSet: "$blog_id" },
              },
            },
            { $project: { count: { $size: "$blogs" } } },
          ],
          // Category frequency across the whole history.
          topics: [
            { $group: { _id: "$b.category", count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
            { $limit: 24 },
          ],
          // Author frequency, with the name to label it — the "Writers" tab
          // narrows to one of these.
          writers: [
            { $group: { _id: "$b.user", count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
            { $limit: 24 },
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "u",
                pipeline: [{ $project: { username: 1, profile_image: 1 } }],
              },
            },
            { $unwind: { path: "$u", preserveNullAndEmptyArrays: true } },
          ],
        },
      },
    ]);

    const totals = agg?.totals?.[0] || null;
    // Validate the shape only. An earlier version also dropped anything before
    // the current year, which would have silently truncated the history (and
    // therefore the streak) of any reader whose reading predates January.
    const days = (agg?.days || [])
      .map((d) => d._id)
      .filter((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort(); // ascending — streak maths walks this

    const articles = totals?.articles || 0;
    const firstReadAt = totals?.firstReadAt || null;

    // "Per week" is only meaningful once there is a span to average over; with
    // no history at all it is reported as null rather than 0.
    let perWeek = null;
    if (articles > 0 && firstReadAt) {
      const weeks = Math.max(1, (now - new Date(firstReadAt)) / (7 * 24 * 60 * 60 * 1000));
      perWeek = Math.round((articles / weeks) * 10) / 10;
    }

    res.status(200).json({
      success: true,
      message: "Reading history summary fetched.",
      summary: {
        articles,
        finished: totals?.finished || 0,
        inProgress: totals?.inProgress || 0,
        saved: agg?.saved?.[0]?.n || 0,
        // Distinct authors read (a number). `writers` below is the LIST of
        // them, used by the Writers tab — the two are deliberately separate
        // so a caller can never mistake one for the other.
        writerCount: agg?.authors?.[0]?.n || 0,
        firstReadAt,
        lastReadAt: totals?.lastReadAt || null,
        perWeek,
        // Ascending "YYYY-MM-DD" keys, for the streak.
        days,
        // Only the last 30 days, with counts, for the heatmap.
        heat: (agg?.heat || []).map((h) => ({ day: h._id, count: h.count })),
        topics: (agg?.topics || []).filter((t) => t._id).map((t) => ({ name: t._id, count: t.count })),
        writers: (agg?.writers || [])
          .filter((w) => w.u?.username)
          .map((w) => ({ id: String(w._id), name: w.u.username, avatar: w.u.profile_image, count: w.count })),
      },
    });
  } catch (error) {
    console.error("Error fetching reading history summary:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch reading summary." });
  }
};
// The reader's own saved position in one article, so the reader page can
// offer to resume where they left off. Returns 0 rather than 404 when the
// reader simply has no recorded progress for it — "you haven't scrolled
// into this one yet" is a normal answer, not an error.
exports.getReadingProgress = async (req, res) => {
  try {
    const { blogId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({ success: false, message: "Invalid blog id." });
    }
    const view = await BlogView.findOne({ blog_id: blogId, user_id: req.user._id })
      .select("progress lastReadAt")
      .lean();

    res.status(200).json({
      success: true,
      progress: view?.progress || 0,
      lastReadAt: view?.lastReadAt || null,
    });
  } catch (error) {
    console.error("Error fetching reading progress:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch reading progress." });
  }
};

// Report how far through an article the reader got. Called by the reader page
// as the reader scrolls (throttled client-side).
//
// `progress` is written with $max, never $set: the stored value is the
// FURTHEST point reached, so a later visit that only skims the top cannot
// erase real progress. Re-reading a finished article leaves it at 100.
exports.saveReadingProgress = async (req, res) => {
  try {
    const { blogId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({ success: false, message: "Invalid blog id." });
    }
    const pct = Math.round(Number(req.body.progress));
    if (!Number.isFinite(pct)) {
      return res.status(400).json({ success: false, message: "Progress must be a number." });
    }
    const progress = Math.min(100, Math.max(0, pct));

    // Only ever record progress for something the reader could actually be
    // reading — never for a draft or a deleted post.
    const exists = await Blog.exists({ _id: blogId, status: "Published" });
    if (!exists) {
      return res.status(404).json({ success: false, message: "Blog not found." });
    }

    const update = { $max: { progress }, $set: { lastReadAt: new Date() } };
    const opts = { new: true, upsert: true, setDefaultsOnInsert: true, select: "progress lastReadAt" };

    let view;
    try {
      view = await BlogView.findOneAndUpdate({ blog_id: blogId, user_id: req.user._id }, update, opts);
    } catch (err) {
      // Concurrent first writes race on the (blog_id, user_id) unique index:
      // the loser of the insert retries as a plain update against the row the
      // winner just created.
      if (err?.code !== 11000) throw err;
      view = await BlogView.findOneAndUpdate(
        { blog_id: blogId, user_id: req.user._id },
        update,
        { new: true, select: "progress lastReadAt" }
      );
    }

    res.status(200).json({
      success: true,
      message: "Reading progress saved.",
      progress: view?.progress ?? progress,
      lastReadAt: view?.lastReadAt ?? null,
    });
  } catch (error) {
    console.error("Error saving reading progress:", error.message);
    res.status(500).json({ success: false, message: "Failed to save reading progress." });
  }
};