import React, { useEffect } from "react";
import CloseIcon from "@mui/icons-material/Close";
import UserAvatar from "../UserAvatar";

/* ─────────────────────────────────────────────────────────────────────
   Draft preview — a full-viewport reader's-eye view of the current draft.

   Purely a local render of page state (title, cover, category, byline, the
   Quill HTML the writer is looking at), so it never drifts from what would
   be submitted. The HTML is the editor's own output, displayed only here;
   the persisted article is sanitized server-side before any reader sees it.

   Escape and the backdrop both close; the draft keeps autosaving under it.
   ───────────────────────────────────────────────────────────────────── */

const PreviewOverlay = ({
  open,
  onClose,
  title,
  category,
  coverSrc,
  username,
  profileImage,
  descriptionHtml,
  wordCount,
  readingTime,
}) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ist-preview" role="dialog" aria-modal="true" aria-label="Draft preview">
      <div className="ist-preview-scroll">
        <div className="ist-preview-article">
          <button
            type="button"
            className="ist-preview-close"
            onClick={onClose}
            aria-label="Close preview (Esc)"
          >
            <CloseIcon />
            <span>Close</span>
          </button>

          {coverSrc ? (
            <div className="ist-preview-cover">
              <img src={coverSrc} alt="Draft cover preview" />
            </div>
          ) : null}

          {category ? <span className="ist-preview-category">{category}</span> : null}

          <h1 className="ist-preview-title">{title || "Untitled draft"}</h1>

          <div className="ist-preview-byline">
            <UserAvatar src={profileImage} name={username} sx={{ width: 30, height: 30, fontSize: 14 }} />
            <span className="ist-preview-name">{username || "You"}</span>
            <span aria-hidden="true">·</span>
            <span>
              {wordCount} words · {readingTime} min read
            </span>
          </div>

          <div className="ist-preview-divider" aria-hidden="true" />

          <div
            className="ist-preview-body"
            /* The writer's own editor HTML (Quill), shown locally only. */
            dangerouslySetInnerHTML={{ __html: descriptionHtml || "" }}
          />
        </div>
      </div>
    </div>
  );
};

export default PreviewOverlay;