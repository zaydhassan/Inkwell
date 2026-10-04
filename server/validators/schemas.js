// Zod schemas for request validation. Validating on the server is the real
// defense — client checks are convenience only. Each schema also coerces
// (e.g. lowercases email) so controllers can trust the shape.
const { z } = require("zod");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const email = z.string().trim().email("Invalid email").max(254).toLowerCase();

// New accounts must use a reasonably strong password. Existing legacy users
// logging in are validated leniently (loginSchema) so we don't lock them out.
const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_ -]+$/, "Username may only contain letters, numbers, spaces, _ and -"),
  email,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
  bio: z.string().max(500).optional(),
  profile_image: z.string().max(2048).optional(),
});

const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required").max(128),
});

// Google (Firebase) OAuth token exchange — the client posts the Firebase ID
// token from signInWithPopup; the server verifies it with firebase-admin.
const googleAuthSchema = z.object({
  idToken: z.string().min(1, "ID token is required"),
});

const updateUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_ -]+$/)
    .optional(),
  email: z.string().trim().email().max(254).toLowerCase().optional(),
  bio: z.string().max(500).optional(),
  profile_image: z.string().max(2048).optional(),
  password: z.string().min(8).max(128).optional(),
});

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email,
  message: z.string().trim().min(1, "Message is required").max(5000),
});

const newsletterSchema = z.object({
  email,
});

const commentSchema = z.object({
  content: z.string().trim().min(1, "Comment cannot be empty").max(5000),
  blog_id: z.string().regex(objectIdRegex, "Invalid blog id"),
});

// A cover-image URL supplied via the "use image URL" mode (no file upload).
// Restricted to http(s) so a `javascript:`/`data:` URL or a relative path
// can't be stored as a blog's cover image (which is rendered in <img> across
// the site). Empty/absent is allowed — the controller requires an image via
// either a file upload or this field.
const imageUrl = z
  .string()
  .max(2048)
  .regex(/^https?:\/\/.+/i, "Image URL must start with http:// or https://")
  .optional();

// Blog create uses multipart/form-data, so all text fields arrive as strings.
// NOTE: the validate middleware replaces req.body with the Zod-parsed value,
// and Zod strips unknown keys by default — so every field the controller reads
// MUST be declared here, or it's silently dropped on create. (tags/image/
// publishAt were missing from an earlier version and were being stripped.)
const blogCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required"),
  category: z.string().trim().min(1).max(50),
  status: z.enum(["Draft", "Published"]).optional(),
  image: imageUrl,
  tags: z.string().optional(),
  publishAt: z.string().optional(),
});

// Blog update: all fields optional (partial update). Mirrors the create
// schema's image-URL rule so a pasted cover URL on edit is also constrained to
// http(s). Applied on the PUT /update-blog route (previously unvalidated).
const blogUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  category: z.string().trim().min(1).max(50).optional(),
  status: z.enum(["Draft", "Published"]).optional(),
  image: imageUrl,
  publishAt: z.union([z.string(), z.null()]).optional(),
  tags: z.string().optional(),
});

// Admin role change. The role enum matches userModel.
const promoteUserSchema = z.object({
  role: z.enum(["Reader", "Writer", "Admin"]),
});

// Bookmark toggle — only the blog id is client-supplied; the user comes from
// auth middleware.
const bookmarkSchema = z.object({
  blog: z.string().regex(objectIdRegex, "Invalid blog id"),
});

// ── InkWell AI ────────────────────────────────────────────────────────
// The AI proxy spends a paid key, so the length caps here are cost guards:
// they bound the most tokens a single request can bill. Note the house
// gotcha — Zod strips unknown keys, so every field aiController reads must
// be declared, or it vanishes before the controller sees it.
const aiHistoryItemSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(8000),
});

const aiCompleteSchema = z.object({
  system: z.string().max(8000).optional().default(""),
  prompt: z.string().trim().min(1, "prompt is required").max(20000),
  history: z.array(aiHistoryItemSchema).max(30).optional().default([]),
  action: z.string().max(60).optional(), // diagnostics only
  maxTokens: z.number().int().min(64).max(4096).optional(),
  temperature: z.number().min(0).max(2).optional(),
});

const aiResearchSchema = z.object({
  query: z.string().trim().min(3, "query is required").max(500),
  context: z.string().max(8000).optional().default(""),
  count: z.number().int().min(1).max(8).optional().default(5),
});

module.exports = {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  updateUserSchema,
  contactSchema,
  newsletterSchema,
  commentSchema,
  blogCreateSchema,
  blogUpdateSchema,
  promoteUserSchema,
  bookmarkSchema,
  aiCompleteSchema,
  aiResearchSchema,
};