const mongoose = require("mongoose");
const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const Reward = require("../models/rewardModel");
const PointEvent = require("../models/pointEventModel");
// Supporting collections for the leaderboard's per-user figures. The board has
// always ranked on points alone; the redesigned tables also show stories,
// reads, likes, followers and topic mix, and each of those is counted here
// from its own collection rather than approximated.
const Blog = require("../models/blogModel");
const Like = require("../models/likeModel");
const Follow = require("../models/followModel");
const BlogView = require("../models/blogViewModel");
const {
  publicUser,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
} = require("../utils/tokenUtils");
const { getLevel, getBadges } = require("../utils/points");

// The multer configuration that used to live here is gone — uploads now go
// through the shared, hardened config in ../config/upload (mounted on the
// route). This controller only reads the already-validated req.file and
// resolves its public URL via fileToUrl (works for both local disk and
// Cloudinary — the old hand-built `${protocol}://${host}/uploads/<name>`
// broke under Cloudinary, where the URL is a full CDN URL, not a local path).
const { fileToUrl } = require("../config/upload");
exports.uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  return res.status(200).json({
    success: true,
    message: "Image uploaded successfully",
    imageUrl: fileToUrl(req.file),
  });
};
exports.registerController = async (req, res) => {
  try {
    const { username, email, password, bio, profile_image } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    }

    // Role is intentionally NOT accepted from the client — that was a
    // self-privilege-escalation vector. New users are always Readers; only
    // an Admin can promote via the protected update endpoint.
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userModel.create({
      username,
      email,
      password: hashedPassword,
      role: "Reader",
      bio,
      profile_image,
    });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    return res.status(201).json({
      success: true,
      message: "New user created",
      user: publicUser(user),
      accessToken,
    });
  } catch (error) {
    // Duplicate-key race on the email unique index → friendly 409.
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "A user with this email already exists" });
    }
    console.error("Register error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Error creating user" });
  }
};

exports.updateUser = async (req, res) => {
  const { userId } = req.params;
  const { username, email, bio, profile_image, password } = req.body;

  // Ownership: a user may only edit their own profile. Admins may edit
  // anyone. Role is never accepted from the body here — promotion must go
  // through a dedicated admin endpoint (not yet wired).
  if (req.user.role !== "Admin" && String(userId) !== String(req.user._id)) {
    return res
      .status(403)
      .json({ success: false, message: "You can only update your own profile." });
  }

  try {
    const updatedFields = { username, email, bio, profile_image };
    // Drop undefined keys so we don't clobber existing values with null.
    Object.keys(updatedFields).forEach(
      (k) => updatedFields[k] === undefined && delete updatedFields[k]
    );

    if (password && password.trim() !== "") {
      updatedFields.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await userModel.findByIdAndUpdate(userId, updatedFields, {
      new: true,
    });

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: publicUser(updatedUser),
    });
  } catch (error) {
    console.error("Update user error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Error updating user" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    // select:false on the model already hides the hash; -password is
    // defense-in-depth in case that ever changes.
    const users = await userModel.find({}).select("-password");
    return res.status(200).json({
      userCount: users.length,
      success: true,
      message: "all users data",
      users,
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Error fetching users" });
  }
};

exports.loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Explicitly select the hash (the model hides it by default).
    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      // Deliberately generic — don't reveal whether the email exists.
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // OAuth-only accounts have no password — they must sign in via Google.
    // bcrypt.compare on a null hash would throw, so guard explicitly.
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: "This account uses Google. Please continue with Google.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: publicUser(user),
      accessToken,
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Error during login" });
  }
};

// Mint a new access token from the httpOnly refresh-token cookie.
exports.refreshTokenController = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Refresh token required." });
    }

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch (err) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired refresh token." });
    }

    const user = await userModel.findById(payload.sub);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User no longer exists." });
    }

    const accessToken = signAccessToken(user);
    // Rotate the refresh token to detect reuse.
    const newRefresh = signRefreshToken(user);
    res.cookie("refreshToken", newRefresh, refreshCookieOptions);

    return res
      .status(200)
      .json({ success: true, accessToken, user: publicUser(user) });
  } catch (error) {
    console.error("Refresh error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Error refreshing token." });
  }
};

// Clear the refresh-token cookie. The client drops its access token.
exports.logoutController = async (req, res) => {
  try {
    res.clearCookie("refreshToken", { path: "/api/v1/user" });
    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Error logging out" });
  }
};

exports.listRewards = async (req, res) => {
    console.log("Fetching rewards..."); 

    try {
        const rewards = await Reward.find({});
        console.log("Rewards found:", rewards);
        res.json({ success: true, rewards });
    } catch (error) {
        console.error("Error fetching rewards:", error);
        res.status(500).json({ success: false, message: "Failed to list rewards", error });
    }
};

exports.redeemPoints = async (req, res) => {
  const { rewardId } = req.body;
  // Always redeem for the authenticated user — never trust a body userId.
  const userId = req.user._id;

  try {
    if (!mongoose.Types.ObjectId.isValid(rewardId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid reward ID format" });
    }

    const reward = await Reward.findById(rewardId);
    if (!reward) {
      return res.status(404).json({ success: false, message: "Reward not found" });
    }

    // Atomic conditional decrement — the `{ points: { $gte: cost } }` filter is
    // the whole fix for the double-spend race the old read-check-save path had
    // (two concurrent redeems each passed the check, each decremented, balance
    // went negative). Only a doc that still has enough points at apply time is
    // touched; a concurrent redeem that already dropped the balance below the
    // cost matches zero docs and is rejected here.
    const updated = await userModel.findOneAndUpdate(
      { _id: userId, points: { $gte: reward.costInPoints } },
      {
        $inc: { points: -reward.costInPoints },
        $push: { redeemedRewards: { rewardId: reward._id } },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(400).json({ success: false, message: "Not enough points" });
    }

    // Recompute derived level/badges from the new total (targeted $set — only
    // those fields — so a concurrent award's points change isn't clobbered).
    const level = getLevel(updated.points);
    const badges = getBadges(updated.points);
    await userModel.updateOne({ _id: updated._id }, { $set: { level, badges } });

    // Best-effort audit ledger.
    try {
      await PointEvent.create({
        user: userId,
        activityType: "redeemReward",
        points: -reward.costInPoints,
      });
    } catch (ledgerErr) {
      console.error("Redemption ledger write failed:", ledgerErr.message);
    }

    res.status(200).json({
      success: true,
      message: "Reward redeemed successfully",
      pointsLeft: updated.points,
      level,
      badges,
    });
  } catch (error) {
    console.error("Error redeeming points:", error.message);
    res.status(500).json({ success: false, message: "Error redeeming points" });
  }
};

// getLevel / getBadges and the client-triggered updateUserPoints /
// updateLikePoints controllers have been removed. Points are now awarded
// server-side by utils/points.js inside the like / comment / publish flows
// (those endpoints were trivially farmable — a user could POST
// update-points in a loop to gain unlimited points).

// ── Leaderboard enrichment ───────────────────────────────────────────────
//
// Ranking is unchanged: all-time reads the denormalized `points` total off the
// user doc, a windowed period sums the append-only PointEvent ledger. What
// follows only supplies the *supporting* figures the board's tables show —
// stories, reads, likes, followers, momentum and topic mix — and every one of
// them is counted fresh from its own collection. Nothing is estimated: a user
// with no posts reports 0 stories, not a plausible-looking placeholder, and a
// window with no activity returns an empty list for the UI to state honestly.

const LEADERBOARD_LIMIT = 10;

// The rolling window a period maps to, or null for all-time. Deliberately a
// rolling window (now − 7d / 30d) and not a calendar week/month: it is the
// arithmetic the board has always used, and the page's own copy promises
// "the last 30 / 7 days" rather than a calendar boundary.
const LEADERBOARD_WINDOW_DAYS = { week: 7, month: 30 };
const periodSince = (periodKey) =>
  LEADERBOARD_WINDOW_DAYS[periodKey]
    ? new Date(Date.now() - LEADERBOARD_WINDOW_DAYS[periodKey] * 24 * 60 * 60 * 1000)
    : null;

// Fields the board returns per user. Projected explicitly so the all-time
// branch (which reads whole user docs) can never leak an email or any other
// non-display field into a public-ish response.
const BOARD_FIELDS = "username role profile_image level badges points";

// Writers: published story count and total reads come from one pass over their
// blogs (reads is the denormalized `views` counter those posts already carry),
// likes come from the Like collection joined through the liked post's author,
// and followers from the Follow graph. `topCategory` — the author's beat — is
// derived by counting per category and taking the largest, which the sort +
// $first pair below does without a second round trip.
const writerMetrics = async (userIds) => {
  const metrics = new Map(
    userIds.map((id) => [String(id), { stories: 0, reads: 0, likes: 0, followers: 0, topCategory: "" }])
  );
  if (userIds.length === 0) return metrics;

  const [blogRows, likeRows, followerRows] = await Promise.all([
    Blog.aggregate([
      { $match: { user: { $in: userIds }, status: "Published" } },
      {
        $group: {
          _id: { user: "$user", category: "$category" },
          count: { $sum: 1 },
          reads: { $sum: { $ifNull: ["$views", 0] } },
        },
      },
      { $sort: { count: -1 } },
      {
        $group: {
          _id: "$_id.user",
          topCategory: { $first: "$_id.category" },
          stories: { $sum: "$count" },
          reads: { $sum: "$reads" },
        },
      },
    ]),
    Like.aggregate([
      { $lookup: { from: "blogs", localField: "blog_id", foreignField: "_id", as: "blog" } },
      { $unwind: "$blog" },
      { $match: { "blog.user": { $in: userIds } } },
      { $group: { _id: "$blog.user", likes: { $sum: 1 } } },
    ]),
    Follow.aggregate([
      { $match: { followee: { $in: userIds } } },
      { $group: { _id: "$followee", followers: { $sum: 1 } } },
    ]),
  ]);

  for (const row of blogRows) {
    const entry = metrics.get(String(row._id));
    if (entry) {
      entry.stories = row.stories;
      entry.reads = row.reads;
      entry.topCategory = row.topCategory || "";
    }
  }
  for (const row of likeRows) {
    const entry = metrics.get(String(row._id));
    if (entry) entry.likes = row.likes;
  }
  for (const row of followerRows) {
    const entry = metrics.get(String(row._id));
    if (entry) entry.followers = row.followers;
  }

  return metrics;
};

// Readers own no posts, so stories and likes received would be meaningless
// columns for them. The honest read-side figures are how many articles they
// have actually read (BlogView holds one row per (blog, user) pair) and how
// many people follow them.
const readerMetrics = async (userIds) => {
  const metrics = new Map(userIds.map((id) => [String(id), { reads: 0, followers: 0 }]));
  if (userIds.length === 0) return metrics;

  const [readRows, followerRows] = await Promise.all([
    BlogView.aggregate([
      { $match: { user_id: { $in: userIds } } },
      { $group: { _id: "$user_id", reads: { $sum: 1 } } },
    ]),
    Follow.aggregate([
      { $match: { followee: { $in: userIds } } },
      { $group: { _id: "$followee", followers: { $sum: 1 } } },
    ]),
  ]);

  for (const row of readRows) {
    const entry = metrics.get(String(row._id));
    if (entry) entry.reads = row.reads;
  }
  for (const row of followerRows) {
    const entry = metrics.get(String(row._id));
    if (entry) entry.followers = row.followers;
  }

  return metrics;
};

// Momentum, not a manufactured percentage: the writers who earned the most
// points over the last seven days, with the real number of points they earned
// in that window. A growth ratio against the *previous* window is deliberately
// not returned — on a young ledger the base is frequently a handful of points,
// so "+300%" would be arithmetic noise dressed up as a trend.
const RISING_WINDOW_DAYS = 7;
const risingWriters = async (limit = 4) => {
  const since = new Date(Date.now() - RISING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  return PointEvent.aggregate([
    { $match: { created_at: { $gte: since } } },
    { $group: { _id: "$user", points: { $sum: "$points" } } },
    { $match: { points: { $gt: 0 } } },
    { $sort: { points: -1 } },
    // Headroom: the top of the ledger is a mix of roles, so take more than we
    // need before filtering down to writers.
    { $limit: limit * 4 },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    { $match: { "user.role": "Writer" } },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        points: 1,
        username: "$user.username",
        profile_image: "$user.profile_image",
        level: "$user.level",
      },
    },
  ]);
};

// Real published-article counts per category over the active window. An empty
// window returns an empty list — the card states that rather than padding it.
const topTopics = async (since, limit = 6) => {
  const match = { status: "Published" };
  if (since) match.created_at = { $gte: since };
  return Blog.aggregate([
    { $match: match },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: limit },
    { $project: { _id: 0, category: "$_id", count: 1 } },
  ]);
};

exports.getLeaderboard = async (req, res) => {
  try {
    const period = (req.query.period || "all").toLowerCase();
    const valid = { all: "all", week: "week", month: "month" };
    const periodKey = valid[period] || "all";
    const since = periodSince(periodKey);

    let writers;
    let readers;

    if (!since) {
      // All-time: the denormalized totals straight off the user docs (served
      // by the compound {role, points} index).
      [writers, readers] = await Promise.all([
        userModel
          .find({ role: "Writer", points: { $gt: 0 } })
          .select(BOARD_FIELDS)
          .sort({ points: -1 })
          .limit(LEADERBOARD_LIMIT)
          .lean(),
        userModel
          .find({ role: "Reader", points: { $gt: 0 } })
          .select(BOARD_FIELDS)
          .sort({ points: -1 })
          .limit(LEADERBOARD_LIMIT)
          .lean(),
      ]);
    } else {
      // Time-windowed: sum the ledger over the window and join the user for
      // display fields. One pipeline per role rather than a single shared one:
      // a common $limit can be swallowed by the busier role and starve the
      // other board entirely.
      const windowed = (role) =>
        PointEvent.aggregate([
          { $match: { created_at: { $gte: since } } },
          { $group: { _id: "$user", points: { $sum: "$points" } } },
          { $match: { points: { $gt: 0 } } },
          { $sort: { points: -1 } },
          { $limit: LEADERBOARD_LIMIT * 4 },
          { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
          { $unwind: "$user" },
          { $match: { "user.role": role } },
          { $limit: LEADERBOARD_LIMIT },
          {
            $project: {
              _id: 1,
              points: 1,
              username: "$user.username",
              role: "$user.role",
              profile_image: "$user.profile_image",
              level: "$user.level",
              badges: "$user.badges",
            },
          },
        ]);

      [writers, readers] = await Promise.all([windowed("Writer"), windowed("Reader")]);
    }

    // Supporting figures for the boards' tables and rail cards. These are
    // independent of each other and of the ranking, so they all go out at once.
    const [writerStats, readerStats, rising, topics] = await Promise.all([
      writerMetrics(writers.map((u) => u._id)),
      readerMetrics(readers.map((u) => u._id)),
      risingWriters(),
      topTopics(since),
    ]);

    res.json({
      success: true,
      topWriters: writers.map((u) => ({ ...u, ...(writerStats.get(String(u._id)) || {}) })),
      topReaders: readers.map((u) => ({ ...u, ...(readerStats.get(String(u._id)) || {}) })),
      risingWriters: rising,
      topTopics: topics,
      period: periodKey,
      windowDays: since ? LEADERBOARD_WINDOW_DAYS[periodKey] : null,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ success: false, message: "Error fetching leaderboard" });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({
      success: true,
      user: {
        points: user.points,
        level: user.level,
        badges: user.badges
      }
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ success: false, message: "Error fetching user data" });
  }
};