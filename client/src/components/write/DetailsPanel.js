import React, { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import DescriptionIcon from "@mui/icons-material/Description";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SubjectIcon from "@mui/icons-material/Subject";
import FolderIcon from "@mui/icons-material/Folder";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import CloseIcon from "@mui/icons-material/Close";
import WritePanel from "./WritePanel";
import { EASE } from "../ink/tokens";

/* ─────────────────────────────────────────────────────────────────────
   Details — the article-metadata workspace.

   Category, tags, and a live read of what the draft currently is (length,
   read time, and where it sits). Laid out as one compact column with the
   section's own rhythm, so the panel reads as metadata rather than as a
   settings form.

   Two things this file is careful about:

   1. THE PILLS CARRY THEIR OWN RESET. `ist-cat-pill` is declared with
      `appearance: none` and `font: inherit`, and it is deliberately NOT
      called `ink-pill` — Explore.css owns a top-level `.ink-pill` rule for
      the filter row, and a bare <button> with no base rule of its own falls
      back to the UA's white buttonface, black text and outset border. That
      fallback is exactly what was rendering here before.

   2. THE TAG VALUE STAYS A COMMA-SEPARATED STRING. The chips are only a
      view of `tags`; every edit is written straight back through
      `onTagsChange` in the shape the page already sends to the API
      (`inputs.tags` → split(",") → JSON array), so the payload is
      untouched. `onTagsChange` is CreateBlog's generic `handleChange`, which
      reads `name` and `value` off the event, so the emit mirrors a real
      input event.
   ───────────────────────────────────────────────────────────────────── */

const GOAL_PRESETS = [500, 800, 1200, 2000];

const DetailsPanel = ({
  categories = [],
  category,
  onPickCategory,
  categoryError,
  tags,
  onTagsChange,
  wordCount = 0,
  readingTime = 1,
}) => {
  const [draft, setDraft] = useState("");
  const [goal, setGoal] = useState(800);
  const inputRef = useRef(null);
  const reduce = useReducedMotion();

  // The parsed view of the stored comma-separated string.
  const list = (tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const write = (next) =>
    onTagsChange({ target: { name: "tags", value: next.join(", ") } });

  // Enter and comma both land here. A duplicate is dropped rather than
  // reported — nothing was lost, so there is nothing to warn about.
  const commit = () => {
    const next = draft.trim();
    setDraft("");
    if (!next) return;
    if (list.some((t) => t.toLowerCase() === next.toLowerCase())) return;
    write([...list, next]);
  };

  const removeAt = (index) => write(list.filter((_, i) => i !== index));

  const onTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !draft && list.length) {
      // The familiar tag-field gesture: an empty field eats the last chip.
      removeAt(list.length - 1);
    }
  };

  const pct = goal > 0 ? Math.min(100, Math.round((wordCount / goal) * 100)) : 0;

  return (
    <WritePanel
      id="details"
      icon={<DescriptionIcon sx={{ fontSize: 18 }} />}
      title="Details"
      meta={category || "Required"}
    >
      <div className="ist-det">
        {/* ── Category ─────────────────────────────────────────────── */}
        <div className="ist-det-block">
          <span className="ist-det-label" id="ist-cat-label">
            Category
          </span>
          <div className="ist-cat-pills" role="group" aria-labelledby="ist-cat-label">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                className={`ist-cat-pill${category === c ? " is-on" : ""}`}
                aria-pressed={category === c}
                onClick={() => onPickCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
          {categoryError ? (
            <p className="ist-det-error" role="alert">
              {categoryError}
            </p>
          ) : null}
        </div>

        {/* ── Tags ─────────────────────────────────────────────────── */}
        <div className="ist-det-block">
          <label className="ist-det-label" htmlFor="ist-tag-input">
            Tags
          </label>
          {/* The whole box is the hit target, so a click anywhere in it puts
              the caret in the field rather than doing nothing. */}
          <div
            className="ist-tag-box"
            onClick={() => inputRef.current?.focus()}
          >
            <AnimatePresence initial={false}>
              {list.map((tag, i) => (
                <motion.span
                  key={tag}
                  className="ist-tag-chip"
                  initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                  transition={{ duration: reduce ? 0 : 0.16, ease: EASE }}
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    className="ist-tag-x"
                    aria-label={`Remove tag ${tag}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAt(i);
                    }}
                  >
                    <CloseIcon />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
            <input
              ref={inputRef}
              id="ist-tag-input"
              className="ist-tag-input"
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onTagKeyDown}
              // Committing on blur means a tag someone typed but never
              // confirmed is kept instead of vanishing with the caret.
              onBlur={commit}
              placeholder={list.length ? "" : "writing, craft, habits"}
              aria-describedby="ist-tag-hint"
              autoComplete="off"
            />
          </div>
          <p className="ist-tag-hint" id="ist-tag-hint">
            Press Enter or comma to add a tag.
          </p>
        </div>

        {/* ── Article metadata ─────────────────────────────────────── */}
        {/* Every value here is read off the live draft — nothing is a
            placeholder. */}
        <div className="ist-det-block ist-det-meta">
          <span className="ist-det-label">Article metadata</span>
          <dl className="ist-det-rows">
            <div className="ist-det-row">
              <dt>
                <AccessTimeIcon />
                Reading time
              </dt>
              <dd>
                <motion.span
                  key={readingTime}
                  initial={{ opacity: 0.35 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: reduce ? 0 : 0.18 }}
                >
                  {readingTime} min
                </motion.span>
              </dd>
            </div>

            <div className="ist-det-row">
              <dt>
                <SubjectIcon />
                Word count
              </dt>
              <dd>
                <motion.span
                  key={wordCount}
                  initial={{ opacity: 0.35 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: reduce ? 0 : 0.18 }}
                >
                  {wordCount.toLocaleString()}
                </motion.span>
              </dd>
            </div>

            <div className="ist-det-row">
              <dt>
                <FolderIcon />
                Category
              </dt>
              <dd className={category ? undefined : "is-empty"}>
                {category || "Not set"}
              </dd>
            </div>

            <div className="ist-det-row">
              <dt>
                <LocalOfferIcon />
                Tags
              </dt>
              <dd className={list.length ? undefined : "is-empty"}>
                {list.length || "None"}
              </dd>
            </div>
          </dl>
        </div>

        {/* ── Writing goal ─────────────────────────────────────────── */}
        {/* Optional by the brief, and it earns its place: it is driven by the
            same live word count above, and it is the one readout that says
            something the other three cannot — how far through the draft is. */}
        <div className="ist-det-block ist-det-goal">
          <div className="ist-det-goal-head">
            <span className="ist-det-label">Writing goal</span>
            <span className="ist-det-goal-count">
              {wordCount.toLocaleString()} / {goal.toLocaleString()}
            </span>
          </div>

          <div
            className="ist-goal-bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label={`Writing goal: ${wordCount} of ${goal} words`}
          >
            <span className="ist-goal-fill" style={{ width: `${pct}%` }} />
          </div>

          <div className="ist-goal-presets" role="group" aria-label="Writing goal target">
            {GOAL_PRESETS.map((g) => (
              <button
                key={g}
                type="button"
                className={`ist-goal-preset${g === goal ? " is-on" : ""}`}
                aria-pressed={g === goal}
                onClick={() => setGoal(g)}
              >
                {g.toLocaleString()}
              </button>
            ))}
          </div>

          {pct >= 100 ? <p className="ist-goal-done">Goal reached.</p> : null}
        </div>
      </div>
    </WritePanel>
  );
};

export default DetailsPanel;
