import React from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import BookmarksIcon from "@mui/icons-material/Bookmarks";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import { EASE } from "../ink/tokens";

/* ─────────────────────────────────────────────────────────────────────
   Research Sources — real results, never invented ones.

   Every entry here came back from a search provider, and every URL was
   re-validated as http(s) before it reached this component. When no search
   provider is configured the card says so and shows an empty list — there
   is no mock, sample, or plausible-looking fallback, because a fabricated
   citation is worse than no citation.

   "Insert citation" builds the anchor locally from the returned URL and
   only on the writer's click; the model is never asked to write it.
   ───────────────────────────────────────────────────────────────────── */

const SNAP = { duration: 0.22, ease: EASE };

const ResearchSources = ({
  sources,
  busy,
  error,
  configured,
  savedUrls,
  onRetry,
  onInsertCitation,
  onToggleSave,
}) => {
  const visible = sources || [];

  // Nothing to say yet: no run has happened and the provider is ready.
  if (!busy && !error && visible.length === 0) return null;

  const copyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Copy failed — your browser blocked clipboard access.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SNAP}>
      {busy ? (
        <div className="ist-sources-status" role="status">
          <span className="ist-thinking-dot" aria-hidden="true" />
          Searching the web…
        </div>
      ) : null}

      {/* Unconfigured is a distinct state from "the search failed": one is a
          missing key, the other a bad day at the provider. */}
      {!busy && error ? (
        error === "unconfigured" || configured === false ? (
          <div className="ist-ai-offline" role="status">
            <CloudOffIcon className="ist-ai-offline-icon" />
            <div className="ist-ai-offline-text">
              <strong>Research is unavailable.</strong>
              <span>No search provider is configured on this server.</span>
            </div>
          </div>
        ) : (
          <div className="ist-ai-error" role="alert">
            <p className="ist-ai-error-title">InkWell AI couldn't complete that request.</p>
            <p className="ist-ai-error-note">Your draft is safe.</p>
            <button type="button" className="ist-suggest-ghost" onClick={onRetry}>
              <RefreshIcon />
              Try again
            </button>
          </div>
        )
      ) : null}

      {!busy && visible.length > 0 ? (
        <>
          <p className="ist-ai-eyebrow">
            <ManageSearchIcon className="ist-sources-eyebrow-icon" />
            Sources found
          </p>
          <div className="ist-sources">
            {visible.map((source, i) => {
              const isSaved = Boolean(savedUrls?.[source.url]);
              return (
                <motion.article
                  key={source.url}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...SNAP, delay: Math.min(i * 0.04, 0.2) }}
                  className="ist-source"
                >
                  <h4 className="ist-source-title">{source.title}</h4>
                  <p className="ist-source-meta">
                    {source.publisher ? <span>{source.publisher}</span> : null}
                    {source.publishedDate ? <span>{source.publishedDate}</span> : null}
                  </p>
                  {source.explanation || source.snippet ? (
                    <p className="ist-source-snippet">{source.explanation || source.snippet}</p>
                  ) : null}
                  <p className="ist-source-url">{source.url}</p>
                  <div className="ist-source-actions">
                    <a
                      className="ist-suggest-ghost"
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <OpenInNewIcon />
                      Open
                    </a>
                    <button
                      type="button"
                      className="ist-suggest-ghost"
                      onClick={() => onInsertCitation(source)}
                    >
                      <FormatQuoteIcon />
                      Insert citation
                    </button>
                    <button
                      type="button"
                      className="ist-suggest-ghost"
                      onClick={() => onToggleSave(source)}
                      aria-pressed={isSaved}
                    >
                      {isSaved ? <BookmarksIcon /> : <BookmarkBorderIcon />}
                      {isSaved ? "Saved" : "Save"}
                    </button>
                    <button
                      type="button"
                      className="ist-suggest-ghost"
                      onClick={() => copyUrl(source.url)}
                      aria-label={`Copy link to ${source.title}`}
                    >
                      <ContentCopyIcon />
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
          <button type="button" className="ist-sources-again" onClick={onRetry}>
            <RefreshIcon />
            Search again
          </button>
        </>
      ) : null}
    </motion.div>
  );
};

export default ResearchSources;
