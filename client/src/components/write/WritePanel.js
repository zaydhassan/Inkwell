import React, { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/* ─────────────────────────────────────────────────────────────────────
   One collapsible panel in the Create Blog sidebar.

   The sidebar is deliberately NOT four detached cards — that is what makes
   a publishing column read as an admin form. Panels are a single continuous
   column separated by hairlines, each with a small-caps title, an optional
   right-hand status word, and a chevron.

   The body toggles with the `hidden` attribute rather than a height
   animation: an animated container needs `overflow: hidden`, which would
   clip the ink focus ring (`outline` + offset) on every control inside it.
   The chevron still rotates, so the state change is legible without it.
   ───────────────────────────────────────────────────────────────────── */

const WritePanel = ({ id, icon, title, meta, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`ink-panel${open ? " is-open" : ""}`}>
      <h2 className="ink-panel-heading">
        <button
          type="button"
          className="ink-panel-head"
          aria-expanded={open}
          aria-controls={`${id}-body`}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="ink-panel-head-icon" aria-hidden="true">
            {icon}
          </span>
          <span className="ink-panel-title">{title}</span>
          {meta ? <span className="ink-panel-meta">{meta}</span> : null}
          <span className="ink-panel-chevron" aria-hidden="true">
            <ExpandMoreIcon sx={{ fontSize: 18 }} />
          </span>
        </button>
      </h2>

      <div id={`${id}-body`} className="ink-panel-body" hidden={!open}>
        {children}
      </div>
    </section>
  );
};

export default WritePanel;
