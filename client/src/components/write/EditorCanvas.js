import React from "react";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import ImageIcon from "@mui/icons-material/ImageOutlined";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import UserAvatar from "../UserAvatar";
import { StreakChip } from "../WritingStreak";
import VoiceDock from "./VoiceDock";
import { InkField } from "../ink";

/* ─────────────────────────────────────────────────────────────────────
   The writing canvas — the hero of the page.

   From top to bottom: the cover row (an "Add a cover image" pill that
   expands into a compact URL/upload picker, or the cover itself as a
   band), the borderless headline, the live byline, and then the Quill
   mount — whose injected toolbar gets the floating, sticky-pill skin in
   page CSS. The dictation dock floats at the canvas's bottom-left.

   The Quill mount is the `<div ref={quillRef}>` below. Quill turns that
   element into `.ql-container.ql-snow` and injects its toolbar as a
   sibling immediately BEFORE it — which keeps the toolbar inside this
   same canvas subtree, so the page-scoped skin applies. Nothing here
   wraps or re-parents the editor; the page still owns all of it.

   `immersive` is the distraction-free mode: the page hides the rail and
   the panel when it's on; the canvas itself only swaps the toggle icon.

   `previewSrc` is already resolved by the page — the URL string when the
   writer typed one, the blob: URL when they picked a file — so the band
   renders whichever cover is real.
   ───────────────────────────────────────────────────────────────────── */

const CoverQuickStrip = ({
  useImageUrl,
  onUseImageUrl,
  imageUrl,
  onImageChange,
  uploadedImage,
  onFileChange,
  onRemoveCover,
}) => (
  <div className="ist-cover-strip">
    <div className="ink-cover-modes" role="group" aria-label="Cover image source">
      <button
        type="button"
        className="ink-cover-mode"
        aria-pressed={useImageUrl}
        onClick={() => onUseImageUrl(true)}
      >
        URL
      </button>
      <button
        type="button"
        className="ink-cover-mode"
        aria-pressed={!useImageUrl}
        onClick={() => onUseImageUrl(false)}
      >
        Upload
      </button>
    </div>

    {useImageUrl ? (
      <InkField
        label="Image URL"
        name="image"
        value={imageUrl}
        onChange={onImageChange}
        placeholder="https://…"
      />
    ) : (
      <label className="ink-cover-drop ist-cover-drop--compact">
        <span className="ink-cover-drop-title">
          {uploadedImage ? uploadedImage.name : "Choose an image"}
        </span>
        <span className="ink-cover-drop-hint">
          {uploadedImage ? "Click to replace" : "PNG, JPG, WebP or GIF · Max 5MB"}
        </span>
        <input type="file" accept="image/*" onChange={onFileChange} aria-label="Choose a cover image" />
      </label>
    )}

    <div className="ist-cover-strip-foot">
      <button type="button" className="ist-cover-strip-ghost" onClick={onRemoveCover}>
        Remove cover
      </button>
    </div>
  </div>
);

const EditorCanvas = ({
  quillRef,
  title,
  onTitleChange,
  onTitleBlur,
  titleError,
  username,
  profileImage,
  wordCount,
  readingTime,
  descriptionError,
  listening,
  onToggleDictation,
  immersive,
  onToggleImmersive,
  coverOpen,
  onToggleCover,
  previewSrc,
  uploadedImage,
  useImageUrl,
  onUseImageUrl,
  imageUrl,
  onImageChange,
  onFileChange,
  onRemoveCover,
  imageError,
  onOpenAi,
}) => {
  // "Add a cover" only offers a picker when there is no cover to show; once
  // one exists the pill flips to "Cover added" and the band renders it.
  const hasCover = Boolean(previewSrc || uploadedImage);

  return (
    <section className={`ist-canvas${immersive ? " is-immersive" : ""}`} aria-label="Writing canvas">
      {/* ── Canvas top row: cover affordance + immersion ───────────── */}
      <div className="ist-canvas-toprow">
        <button
          type="button"
          className={`ist-cover-pill${hasCover ? " ist-cover-pill--set" : ""}`}
          onClick={onToggleCover}
          aria-expanded={coverOpen}
        >
          {hasCover ? (
            <ImageIcon className="ist-cover-pill-icon" />
          ) : (
            <AddAPhotoIcon className="ist-cover-pill-icon" />
          )}
          {hasCover ? "Cover added" : "Add a cover image"}
        </button>

        <button
          type="button"
          className="ist-immersive-toggle"
          onClick={onToggleImmersive}
          aria-pressed={immersive}
          aria-label={immersive ? "Exit distraction-free mode" : "Enter distraction-free mode"}
          title={immersive ? "Exit distraction-free mode" : "Write distraction-free"}
        >
          {immersive ? <CloseFullscreenIcon /> : <OpenInFullIcon />}
        </button>
      </div>

      {coverOpen ? (
        <CoverQuickStrip
          useImageUrl={useImageUrl}
          onUseImageUrl={onUseImageUrl}
          imageUrl={imageUrl}
          onImageChange={onImageChange}
          uploadedImage={uploadedImage}
          onFileChange={onFileChange}
          onRemoveCover={onRemoveCover}
        />
      ) : null}

      {imageError ? (
        <p className="ink-write-error ist-canvas-error-inset" role="alert">
          {imageError}
        </p>
      ) : null}

      {/* ── The cover band: the chosen image, at full canvas width ────── */}
      {hasCover && previewSrc ? (
        <div className="ist-cover-band">
          <img
            src={previewSrc}
            alt="Selected cover"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </div>
      ) : null}

      {/* ── Headline ────────────────────────────────────────────────── */}
      <div className="ist-title-block">
        <input
          className="ist-title"
          name="title"
          type="text"
          value={title}
          onChange={onTitleChange}
          onBlur={onTitleBlur}
          placeholder="Write a captivating title..."
          aria-label="Blog title"
          aria-invalid={titleError ? "true" : undefined}
          aria-describedby={titleError ? "ink-title-error" : undefined}
        />
        {titleError ? (
          <p id="ink-title-error" className="ink-write-error" role="alert">
            {titleError}
          </p>
        ) : null}

        <div className="ist-byline">
          <UserAvatar
            src={profileImage}
            name={username}
            sx={{ width: 26, height: 26, fontSize: 13 }}
          />
          <span className="ist-byline-name">{username || "You"}</span>
          <span className="ist-byline-dot" aria-hidden="true">
            ·
          </span>
          <span className="ist-byline-meta">
            {wordCount > 0 ? `${wordCount} words · ${readingTime} min read` : "Draft"}
          </span>
        </div>
      </div>

      {/* ── Quill mounts here; its toolbar injects just above ─────────── */}
      <div ref={quillRef} className="ist-editor" />

      {/* Quill shows its own "Start writing your story…" placeholder inside
          the editor; this helper under it is the AI nudge — visible only
          while the draft is empty. */}
      {wordCount === 0 ? (
        <p className="ist-editor-helper">
          Bring your ideas to life. You can also{" "}
          <button type="button" className="ist-editor-helper-link" onClick={onOpenAi}>
            use AI to help you write
          </button>
          , edit, or brainstorm.
        </p>
      ) : null}

      {descriptionError ? (
        <p className="ink-write-error" role="alert">
          {descriptionError}
        </p>
      ) : null}

      <VoiceDock listening={listening} onToggle={onToggleDictation} />

      {/* Autosave truth lives in the top bar's chip; this foot keeps only the
          streak chip. (A right-side "draft saves locally" note used to sit here
          and the floating AI pill parked on top of it.) */}
      <div className="ist-canvas-foot">
        <StreakChip tone="ink" />
      </div>
    </section>
  );
};

export default EditorCanvas;