/* ─────────────────────────────────────────────────────────────────────
   The InkWell category set.

   One list, shared by the pages that let a writer pick a category and the
   pages that let a reader filter by one. Category is a free-text field on the
   blog schema (no enum server-side), so these names are the contract: a story
   filed under a name that is not in this list would be browsable but would
   have no pill of its own. Keep the two in step.
   ───────────────────────────────────────────────────────────────────── */

export const CATEGORIES = [
  "Technology",
  "Education",
  "Health",
  "Entertainment",
  "Food",
  "Business",
  "Social Media",
  "Travel",
  "News",
];

/* The Explore sidebar and filter row lead with "All"; every other entry is a
   real category. Exported ready-to-render so no page has to build it twice. */
export const CATEGORY_FILTERS = ["All", ...CATEGORIES];

export default CATEGORIES;
