// Server-side HTML sanitization for stored rich text (blog descriptions).
// This is the durable fix for stored XSS: sanitize on WRITE so malicious
// markup never reaches the database, regardless of which client renders it.
// The client also sanitizes on render (utils/sanitize.js) as defense in depth.
//
// Uses isomorphic-dompurify (DOMPurify + jsdom) so the same sanitizer runs in
// Node. The config mirrors the client's so behavior is consistent.
const { sanitize } = require("isomorphic-dompurify");

const sanitizeHtml = (dirty) => {
  if (!dirty) return "";
  return sanitize(dirty, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["form", "input", "button", "style", "iframe", "object", "embed"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "style"],
  });
};

// Strip HTML tags from a rich-text body and return plain text. Used to
// measure a blog body without counting markup as words. A regex strip is
// safe here because the result is never rendered as HTML — it is only ever
// split into words.
const stripHtml = (html) => {
  if (!html) return "";
  return String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// Estimated reading time in minutes at 200 wpm, minimum 1.
//
// This deliberately mirrors `readingTime` in client/src/utils/sanitize.js
// term for term: the figure a card shows and the figure the summary totals
// must be the same measurement of the same field, or the rail would
// contradict the cards it sits beside.
//
// NOTE: an empty body still returns 1 (the client's minimum). Callers that
// need to know whether a body was actually measurable must test
// `stripHtml(body)` themselves — see getBookmarksSummary, which omits the
// total rather than summing these.
const readingTime = (html) => {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

module.exports = { sanitizeHtml, stripHtml, readingTime };