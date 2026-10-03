import React from "react";
import ChecklistIcon from "@mui/icons-material/Checklist";
import CheckIcon from "@mui/icons-material/Check";
import WritePanel from "./WritePanel";

/* ─────────────────────────────────────────────────────────────────────
   Publishing checklist.

   Every line is the *real* state of the form — `items` is computed in
   CreateBlog.js from the same four validation rules `handleBlogAction`
   applies before it will submit (title ≥2 chars, category chosen, cover
   present, body non-empty after tags are stripped). Nothing here invents a
   progress notion of its own, and nothing here can gate the submit: it only
   reports what the submit would say.

   The tick is decorative, so the state is also given as text for screen
   readers — a coloured box alone conveys nothing without sight.
   ───────────────────────────────────────────────────────────────────── */

const ChecklistPanel = ({ items }) => {
  const done = items.filter((item) => item.done).length;

  return (
    <WritePanel
      id="checklist"
      icon={<ChecklistIcon sx={{ fontSize: 18 }} />}
      title="Publishing checklist"
      meta={`${done}/${items.length}`}
    >
      <ul className="ink-check-list">
        {items.map((item) => (
          <li key={item.label} className={`ink-check${item.done ? " is-done" : ""}`}>
            <span className="ink-check-box" aria-hidden="true">
              <CheckIcon sx={{ fontSize: 13 }} />
            </span>
            {item.label}
            <span className="ink-write-sr">{item.done ? "— done" : "— not yet"}</span>
          </li>
        ))}
      </ul>

      <p className="ink-panel-hint">
        The same four checks that have to pass before this post can be published.
      </p>
    </WritePanel>
  );
};

export default ChecklistPanel;
