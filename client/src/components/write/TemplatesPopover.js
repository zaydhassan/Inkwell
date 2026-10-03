import React from "react";
import GridViewIcon from "@mui/icons-material/GridView";
import CloseIcon from "@mui/icons-material/Close";

/* ─────────────────────────────────────────────────────────────────────
   Templates popover — anchored to the rail's Templates tool.

   Six scaffolds the writer can pour into a blank draft. Purely client-side:
   each template is HTML that the page pastes into Quill at the caret (via
   clipboard.dangerouslyPasteHTML), so no backend system is involved and no
   draft is overwritten silently — pasting lands where the writer is.

   The popover is the studio's one "menu" surface, deliberately not a nav
   rail submenu pattern: it opens next to the rail and closes on Escape,
   outside click, or the rail button again.
   ───────────────────────────────────────────────────────────────────── */

export const TEMPLATES = [
  {
    id: "howto",
    title: "How-to guide",
    hint: "Steps a reader follows start to finish",
    html:
      "<h2>Why this matters</h2><p>Set up the problem this guide solves and who it is for.</p>" +
      "<h2>Before you start</h2><p>Tools, accounts and knowledge a reader needs.</p>" +
      "<h2>Step 1 — First move</h2><p>Describe the step and what a reader should see.</p>" +
      "<h2>Step 2 — Next move</h2><p>Continue the sequence.</p>" +
      "<h2>Where this takes you</h2><p>Close with the outcome and what to try next.</p>",
  },
  {
    id: "essay",
    title: "Personal essay",
    hint: "Narrative voice, reflective close",
    html:
      "<h2>The moment it started</h2><p>Open with a scene, not a summary.</p>" +
      "<h2>What I actually thought</h2><p>Lay out the expectations that came before.</p>" +
      "<h2>What changed</h2><p>Tell the turning point honestly.</p>" +
      "<h2>Where I landed</h2><p>Reflect without wrapping it too neatly.</p>",
  },
  {
    id: "listicle",
    title: "Listicle",
    hint: "Counted items, quick value",
    html:
      "<h2>The short version</h2><p>One line that tells a reader what they will get.</p>" +
      "<h2>1. First thing</h2><p>Why it earns the spot.</p>" +
      "<h2>2. Second thing</h2><p>And the next.</p>" +
      "<h2>3. Third thing</h2><p>Keep each point self-contained.</p>" +
      "<h2>The takeaway</h2><p>Tie the list together in one sentence.</p>",
  },
  {
    id: "review",
    title: "Review",
    hint: "Balanced verdict on a product or place",
    html:
      "<h2>The setup</h2><p>What it is, what you reviewed it for, how long you used it.</p>" +
      "<h2>What works</h2><p>The strengths, plainly.</p>" +
      "<h2>What doesn't</h2><p>The limitations, just as plainly.</p>" +
      "<h2>The verdict</h2><p>Who should buy, join, or skip — and why.</p>",
  },
  {
    id: "opinion",
    title: "Opinion piece",
    hint: "Thesis, argument, counterargument",
    html:
      "<h2>The claim</h2><p>State your position in one sentence.</p>" +
      "<h2>Why I hold it</h2><p>The strongest reasons, in order.</p>" +
      "<h2>The best objection</h2><p>Steel-man the other side before answering it.</p>" +
      "<h2>The takeaway</h2><p>What a reader should do with your argument.</p>",
  },
  {
    id: "news",
    title: "Announcement",
    hint: "What's new and why it matters",
    html:
      "<h2>What's new</h2><p>The change, in one sentence.</p>" +
      "<h2>Why it matters</h2><p>The reader's benefit, not the changelog.</p>" +
      "<h2>The details</h2><p>Dates, links, and anything a reader must do.</p>",
  },
];

const TemplatesPopover = ({ open, onClose, onPick }) => {
  if (!open) return null;

  return (
    <div className="ist-templates" role="dialog" aria-label="Draft templates">
      <div className="ist-templates-head">
        <p className="ist-templates-title">
          <GridViewIcon className="ist-templates-icon" />
          Start from a scaffold
        </p>
        <button type="button" className="ist-rail-x" onClick={onClose} aria-label="Close templates">
          <CloseIcon />
        </button>
      </div>
      <p className="ist-side-note">
        Poured into the editor where you left off — nothing is overwritten.
      </p>

      <ul className="ist-templates-list">
        {TEMPLATES.map((t) => (
          <li key={t.id}>
            <button type="button" className="ist-template" onClick={() => onPick(t)}>
              <span className="ist-template-title">{t.title}</span>
              <span className="ist-template-hint">{t.hint}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TemplatesPopover;