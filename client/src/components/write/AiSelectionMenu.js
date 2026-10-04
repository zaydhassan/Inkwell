import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import CloseIcon from "@mui/icons-material/Close";
import { aiActionIcon } from "./aiActionIcons";

/* ─────────────────────────────────────────────────────────────────────
   The text-selection AI menu.

   A small floating toolbar that appears when the writer highlights text.
   It is rendered through a PORTAL onto document.body — deliberately never
   inside the Quill root, because anything inside .ql-editor is content as
   far as Quill is concerned (it would be parsed into the document and
   fire spurious text-change events).

   Two things make it safe for the selection it acts on:
     - mousedown anywhere in the menu is prevented, so clicking an entry
       cannot blur the editor or collapse the highlight before the action
       is dispatched. The parent already stored the range.
     - the parent is the single source of truth for that range (selRangeRef),
       so even if the live selection has moved, the action still edits the
       text the writer highlighted.

   On touch devices an anchored popover fights the native selection handles,
   so it renders as a fixed bottom bar instead ([data-coarse]).
   ───────────────────────────────────────────────────────────────────── */

const GAP = 10;
const MARGIN = 12;

const AiSelectionMenu = ({ anchor, actions, onAction, onClose }) => {
  const menuRef = useRef(null);
  const [pos, setPos] = useState(null);
  // A parameterised action (Change Tone, Simplify) swaps the list for a row
  // of choices; picking one dispatches with that choice.
  const [paramAction, setParamAction] = useState(null);
  const coarse =
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(pointer: coarse)").matches
      : false;

  // A new selection is a new context — never carry a half-chosen tone over.
  useEffect(() => {
    setParamAction(null);
  }, [anchor?.index, anchor?.length]);

  // Place above the selection, clamped into the viewport; flip below when
  // there isn't room above. Measure-then-place keeps it off-screen for at
  // most one frame.
  useLayoutEffect(() => {
    if (!anchor || coarse) return;
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const left = Math.max(
      MARGIN,
      Math.min(anchor.x - rect.width / 2, window.innerWidth - rect.width - MARGIN)
    );
    let top = anchor.y - rect.height - GAP;
    if (top < MARGIN) top = anchor.y + GAP + 22;
    setPos({ top, left });
  }, [anchor, coarse, paramAction]);

  // Focus the first entry so the keyboard can drive it immediately.
  useEffect(() => {
    if (!anchor || coarse) return;
    menuRef.current?.querySelector("button.ist-sel-item")?.focus();
  }, [anchor, coarse, paramAction]);

  // Escape closes from anywhere; a pointerdown outside the menu (i.e. the
  // writer clicked back into the page) closes it too.
  useEffect(() => {
    if (!anchor) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    const onPointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [anchor, onClose]);

  if (!anchor) return null;

  const moveFocus = (dir) => {
    const items = [...(menuRef.current?.querySelectorAll("button.ist-sel-item") || [])];
    if (!items.length) return;
    const idx = items.indexOf(document.activeElement);
    const next = idx === -1 ? 0 : (idx + dir + items.length) % items.length;
    items[next].focus();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      moveFocus(1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      moveFocus(-1);
    }
  };

  const body = paramAction ? (
    <div className="ist-sel-params" role="radiogroup" aria-label={paramAction.param.label}>
      <p className="ist-sel-param-label">{paramAction.param.label}</p>
      <div className="ist-sel-param-chips">
        {paramAction.param.options.map((option) => (
          <button
            key={option.id}
            type="button"
            className="ist-param-chip"
            onClick={() => onAction(paramAction.id, option)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <button type="button" className="ist-sel-cancel" onClick={() => setParamAction(null)}>
        Back
      </button>
    </div>
  ) : (
    <div className="ist-sel-list">
      {actions.map((action) => {
        const Icon = aiActionIcon(action.id);
        return (
          <button
            key={action.id}
            type="button"
            className="ist-sel-item"
            onClick={() => {
              if (action.param) setParamAction(action);
              else onAction(action.id);
            }}
          >
            <Icon className="ist-sel-icon" />
            {action.title}
          </button>
        );
      })}
    </div>
  );

  return createPortal(
    <div
      ref={menuRef}
      className="ist-sel-menu"
      data-coarse={coarse ? "" : undefined}
      style={coarse ? undefined : { top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
      role="toolbar"
      aria-label="AI actions for the selected text"
      aria-orientation="horizontal"
      // The editor must not lose the selection before the click lands.
      onMouseDown={(e) => e.preventDefault()}
      onKeyDown={onKeyDown}
    >
      <span className="ist-sel-brand" aria-hidden="true">✦</span>
      {body}
      <button type="button" className="ist-sel-close" onClick={onClose} aria-label="Close AI menu">
        <CloseIcon />
      </button>
    </div>,
    document.body
  );
};

export default AiSelectionMenu;
