import React from "react";
import SearchIcon from "@mui/icons-material/QueryStats";

/* ─────────────────────────────────────────────────────────────────────
   SEO tab — honest draft diagnostics.

   Every line is computed locally from the real draft state (title length,
   body length, tag count, cover, category) against widely-cited editorial
   rules of thumb. NOTHING here is AI-generated and nothing is sent
   anywhere: these are the same checks the writer would do by hand, done
   invisibly, so the panel may say "computed from your draft" truthfully.
   ───────────────────────────────────────────────────────────────────── */

const STATE_COPY = {
  good: "Good",
  warn: "Worth fixing",
  info: "Optional",
};

const SeoPanel = ({ title, wordCount, readingTime, tags, category, hasCover }) => {
  const titleLen = (title || "").trim().length;
  const tagList = (tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const checks = [
    {
      label: "Title length",
      state: titleLen === 0 ? "info" : titleLen >= 30 && titleLen <= 65 ? "good" : "warn",
      value: titleLen ? `${titleLen} characters` : "No title yet",
      note:
        titleLen === 0
          ? "Search results show a page by its title first."
          : "30–65 characters fits search results without truncation.",
    },
    {
      label: "Article length",
      state: wordCount >= 300 ? "good" : wordCount > 0 ? "warn" : "info",
      value: wordCount ? `${wordCount} words · ~${readingTime} min read` : "No content yet",
      note: "Longer drafts give search engines more to work with; 300+ is a healthy floor.",
    },
    {
      label: "Tags",
      state: tagList.length >= 3 && tagList.length <= 5 ? "good" : tagList.length ? "warn" : "info",
      value: tagList.length ? `${tagList.length} tag${tagList.length === 1 ? "" : "s"}` : "None",
      note: "3–5 specific tags help related-post matching; too many dilute them.",
    },
    {
      label: "Category",
      state: category ? "good" : "warn",
      value: category || "Not chosen",
      note: "A single category keeps the post findable in its section.",
    },
    {
      label: "Cover image",
      state: hasCover ? "good" : "warn",
      value: hasCover ? "Added" : "Missing",
      note: "Posts with covers earn the featured and cards slots with an image.",
    },
  ];

  return (
    <div className="ist-seo" role="region" aria-label="SEO diagnostics">
      <div className="ist-seo-head">
        <SearchIcon className="ist-seo-icon" />
        <div>
          <p className="ist-seo-title">Draft diagnostics</p>
          <p className="ist-side-note">
            Computed from your draft — no AI, nothing sent anywhere.
          </p>
        </div>
      </div>

      <ul className="ist-seo-list">
        {checks.map((c) => (
          <li key={c.label} className={`ist-seo-item is-${c.state}`}>
            <span className="ist-seo-state-dot" aria-hidden="true" />
            <div className="ist-seo-body">
              <p className="ist-seo-item-title">
                {c.label}
                <span className="ist-seo-state-word">{STATE_COPY[c.state]}</span>
              </p>
              <p className="ist-seo-item-value">{c.value}</p>
              <p className="ist-seo-item-note">{c.note}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SeoPanel;