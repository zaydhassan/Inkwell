const express = require("express");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { authenticateUser } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { aiCompleteSchema, aiResearchSchema } = require("../validators/schemas");
const { getAiStatus, complete, research } = require("../controllers/aiController");

const router = express.Router();

/* The proxy spends a paid provider key, so requests are limited per user on
   top of the global per-IP apiLimiter. The limiter runs AFTER
   authenticateUser, so req.user is populated and the key is attributable;
   anonymous callers never get this far. (v8 requires ipKeyGenerator for the
   IP fallback so IPv6 clients can't trivially cycle addresses.) */
const userKey = (req) => (req.user?._id ? `u:${req.user._id}` : ipKeyGenerator(req.ip));

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKey,
  message: { success: false, message: "Too many AI requests. Please slow down." },
});

const researchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKey,
  message: { success: false, message: "Too many research requests. Please slow down." },
});

// Static literal first (house rule), public and cheap — booleans only.
router.get("/status", getAiStatus);

// Generation + research require an account: the route holds the real keys,
// so it must never be anonymously abusable.
router.post("/complete", authenticateUser, aiLimiter, validate(aiCompleteSchema), complete);
router.post("/research", authenticateUser, researchLimiter, validate(aiResearchSchema), research);

module.exports = router;
