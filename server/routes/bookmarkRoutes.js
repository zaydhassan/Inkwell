const express = require("express");
const { authenticateUser } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { bookmarkSchema } = require("../validators/schemas");
const {
  toggleBookmark,
  getBookmarks,
  getBookmarkedIds,
  getReadingHistory,
  getReadingHistorySummary,
  getReadingProgress,
  saveReadingProgress,
} = require("../controllers/bookmarkController");

// Bookmarks. Static segments (/toggle, /ids) are registered before any
// /:param route so they can't be shadowed (same class of bug we fixed on
// userRoutes for /all-users).
const router = express.Router();
router.post("/toggle", authenticateUser, validate(bookmarkSchema), toggleBookmark);
router.get("/ids", authenticateUser, getBookmarkedIds);
router.get("/", authenticateUser, getBookmarks);

// Reading history is a distinct resource, so it gets its own mounted base path
// (/api/v1/reading-history) but lives here next to bookmarks for locality.
const readingHistoryRouter = express.Router();
readingHistoryRouter.get("/", authenticateUser, getReadingHistory);
// Static before parameterised, same as the bookmark router above.
readingHistoryRouter.get("/summary", authenticateUser, getReadingHistorySummary);
// The reader page reports scroll depth here; the stored value is the furthest
// point reached, so this is safe to call repeatedly and out of order. The
// matching GET lets the same page offer to resume where the reader left off.
readingHistoryRouter.get("/:blogId/progress", authenticateUser, getReadingProgress);
readingHistoryRouter.patch("/:blogId/progress", authenticateUser, saveReadingProgress);

module.exports = { router, readingHistoryRouter };