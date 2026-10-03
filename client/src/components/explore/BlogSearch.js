import React, { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import SearchRounded from "@mui/icons-material/SearchRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";

/* ─────────────────────────────────────────────────────────────────────
   InkWell Explore — the search field.

   A plain <input> on the shared tokens, not an MUI TextField, so it renders
   identically whichever MUI theme is active (this page is always dark).

   The field is fully controlled and the *page* owns the debounce: each
   keystroke updates local state instantly, and the hook sends one request once
   typing settles. That is why the value lives on `value`/`onChange` here
   rather than in local state.

   ── The ⌘K chip ──────────────────────────────────────────────────────
   The chip is a real <button>, not decoration: clicking it focuses the field.

   The keyboard shortcut is claimed while this page is mounted. That IS a
   deliberate, route-scoped override — the app's command palette owns ⌘K
   globally (components/CommandPalette.js), and on Explore the reader's intent
   for that shortcut is "search the catalog", which is this field. The handler
   runs in the capture phase and stops propagation so the palette does not also
   toggle open behind the field. The palette is untouched everywhere else, and
   is still reachable here from the navbar's search icon; `/` works as a
   second, non-conflicting way to reach the field.
   ───────────────────────────────────────────────────────────────────── */

// ⌘ on Apple hardware, Ctrl everywhere else. Used only for the chip's label —
// the handler accepts either modifier.
const IS_APPLE =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform || "");

const BlogSearch = ({ value, onChange, resultCount, loading, scopeLabel }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    const focusField = () => inputRef.current?.focus();

    const onKeyDown = (e) => {
      const isShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      // `/` only when the reader is not already typing somewhere — otherwise it
      // would be swallowed from every other input on the page.
      const isSlash =
        e.key === "/" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName || "") &&
        !e.target?.isContentEditable;

      if (isShortcut) {
        e.preventDefault();
        // Keeps the global command palette from opening on this route only.
        e.stopPropagation();
        // If the field already has focus, the shortcut hands focus back to the
        // page rather than trapping the reader in the input.
        if (document.activeElement === inputRef.current) inputRef.current.blur();
        else focusField();
      } else if (isSlash) {
        e.preventDefault();
        focusField();
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);

  const clear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div className="ink-explore-search-wrap">
      <Box className="ink-explore-search" sx={{ maxWidth: 700 }}>
        <SearchRounded className="ink-explore-search-icon" aria-hidden="true" />

        <input
          ref={inputRef}
          type="search"
          className="ink-explore-search-input"
          placeholder="Search blogs, topics, or authors..."
          aria-label="Search blogs, topics, or authors"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && value) {
              e.stopPropagation();
              clear();
            }
          }}
        />

        {value ? (
          <Box
            component="button"
            type="button"
            className="ink-explore-search-clear"
            onClick={clear}
            aria-label="Clear search"
          >
            <CloseRounded sx={{ fontSize: 18 }} />
          </Box>
        ) : (
          // Hidden from assistive tech: the same shortcut is announced by the
          // button's own label below, and screen readers do not need the glyph.
          <Box
            component="button"
            type="button"
            className="ink-explore-search-kbd"
            onClick={() => inputRef.current?.focus()}
            aria-label={`Focus search (${IS_APPLE ? "Command" : "Control"} K)`}
          >
            <span aria-hidden="true">{IS_APPLE ? "⌘" : "Ctrl"}</span>
            <span aria-hidden="true">K</span>
          </Box>
        )}
      </Box>

      {/* One polite line under the field: what the search is doing, and how
          much it found — counted by the server, not by the cards on screen, so
          it stays right as the grid pages in. Silent until there is something
          true to say, and it never claims "no matches" while a request is
          still in flight. */}
      {value.trim() && (
        <p className="ink-explore-search-status" role="status">
          {loading
            ? "Searching…"
            : resultCount > 0
            ? `${resultCount} ${resultCount === 1 ? "story" : "stories"} matching “${value.trim()}”${
                scopeLabel ? ` ${scopeLabel}` : ""
              }`
            : `No stories match “${value.trim()}”${scopeLabel ? ` ${scopeLabel}` : ""}`}
        </p>
      )}
    </div>
  );
};

export default BlogSearch;
