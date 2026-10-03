import React from "react";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LinkIcon from "@mui/icons-material/Link";
import WritePanel from "./WritePanel";
import { InkField } from "../ink";

/* ─────────────────────────────────────────────────────────────────────
   Cover image — a URL field or an upload, plus a live preview.

   The upload zone is a <label> with a transparent file input stretched over
   it, so the input is the real click AND keyboard target (a bare <label>
   takes no focus). The ink focus ring then lands on the zone itself via
   `:focus-within` in CreateBlog.css.

   The size/type hint is copy only. The limit is enforced server-side
   (config/upload.js) and a duplicate client-side guard would silently drift
   if MAX_UPLOAD_MB were ever raised.
   ───────────────────────────────────────────────────────────────────── */

const CoverPanel = ({
  useImageUrl,
  onUseImageUrl,
  imageUrl,
  onImageChange,
  uploadedImage,
  onFileChange,
  previewSrc,
  onRemoveCover,
  imageError,
}) => {
  const hasCover = Boolean(previewSrc || uploadedImage || imageUrl);

  return (
    <WritePanel
      id="cover"
      icon={<AddPhotoAlternateIcon sx={{ fontSize: 18 }} />}
      title="Cover image"
      meta={hasCover ? "Added" : "Required"}
    >
      <div className="ink-cover-modes" role="group" aria-label="Cover image source">
        <button
          type="button"
          className="ink-cover-mode"
          aria-pressed={useImageUrl}
          onClick={() => onUseImageUrl(true)}
        >
          <LinkIcon sx={{ fontSize: 15 }} />
          URL
        </button>
        <button
          type="button"
          className="ink-cover-mode"
          aria-pressed={!useImageUrl}
          onClick={() => onUseImageUrl(false)}
        >
          <CloudUploadIcon sx={{ fontSize: 15 }} />
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
        <label className="ink-cover-drop">
          <CloudUploadIcon className="ink-cover-drop-icon" sx={{ fontSize: 26 }} />
          <span className="ink-cover-drop-title">
            {uploadedImage ? uploadedImage.name : "Choose an image"}
          </span>
          <span className="ink-cover-drop-hint">
            {uploadedImage ? "Click to replace" : "PNG, JPG, WebP or GIF · Max 5MB"}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            aria-label="Choose a cover image"
          />
        </label>
      )}

      {previewSrc ? (
        <div className="ink-cover-preview">
          <img
            src={previewSrc}
            alt="Cover preview"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <button type="button" className="ink-cover-remove" onClick={onRemoveCover}>
            Remove
          </button>
        </div>
      ) : null}

      {imageError ? (
        <p className="ink-panel-error" role="alert">
          {imageError}
        </p>
      ) : null}
    </WritePanel>
  );
};

export default CoverPanel;
