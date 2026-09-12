import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  IconButton,
  Popover,
  Stack,
} from "@mui/material";
import ListIcon from "@mui/icons-material/List";
import GlassCard from "./GlassCard";
import { onActivate } from "../utils/a11y";

// Build a URL-safe, stable id from heading text. Collisions are disambiguated
// with a numeric suffix so two "Conclusion" headings get distinct anchors.
const slugify = (text, seen) => {
  const base = String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
  let id = base;
  let n = 1;
  while (seen.has(id)) id = `${base}-${n++}`;
  seen.add(id);
  return id;
};

// Sticky table of contents built from the article's h2/h3 headings.
// Desktop: a sticky sidebar GlassCard. Mobile: a list-icon button that opens a
// Popover (a permanent sidebar would eat too much vertical space on phones).
//
// `contentRef` points at the `.blog-content` element; `ready` flips true once
// the article HTML has been injected so we query after render, not before.
const TableOfContents = ({ contentRef, ready }) => {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const observerRef = useRef(null);

  // (Re)build the heading list + IntersectionObserver whenever the article is
  // (re)loaded. Each heading gets a stable id so anchor scrolling works.
  useEffect(() => {
    if (!ready || !contentRef?.current) return;
    const el = contentRef.current;
    const nodes = Array.from(el.querySelectorAll("h2, h3"));
    const seen = new Set();
    const items = nodes.map((node) => {
      const text = node.textContent?.trim() || "";
      const id = node.id || slugify(text, seen);
      node.id = id;
      return { id, text, level: node.tagName.toLowerCase() };
    });
    setHeadings(items);

    if (observerRef.current) observerRef.current.disconnect();
    const observer = new IntersectionObserver(
      (entries) => {
        // The heading closest to the top of the viewport that is currently
        // intersecting is the "active" one.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );
    nodes.forEach((n) => observer.observe(n));
    observerRef.current = observer;

    return () => observer.disconnect();
  }, [ready, contentRef]);

  const scrollToHeading = (id) => {
    const target = contentRef?.current?.querySelector(`#${CSS.escape(id)}`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    // Offset for the sticky navbar so the heading isn't hidden under it.
    setTimeout(() => window.scrollBy({ top: -80, behavior: "smooth" }), 200);
    setAnchorEl(null);
  };

  if (headings.length === 0) return null;

  // A render function, not an inline component — an inline `<List />` would
  // remount (and drop scroll state) on every render.
  const renderList = () => (
    <Stack spacing={0.5}>
      {headings.map((h) => (
        <Box
          key={h.id}
          role="button"
          tabIndex={0}
          onClick={() => scrollToHeading(h.id)}
          onKeyDown={onActivate(() => scrollToHeading(h.id))}
          sx={{
            cursor: "pointer",
            pl: h.level === "h3" ? 2.5 : 0,
            py: 0.5,
            color: activeId === h.id ? "primary.main" : "text.secondary",
            fontWeight: activeId === h.id ? 700 : 500,
            fontSize: h.level === "h3" ? "0.82rem" : "0.9rem",
            borderLeft: (t) =>
              h.level === "h2"
                ? `2px solid ${activeId === h.id ? t.palette.primary.main : "transparent"}`
                : "none",
            transition: "color .2s ease",
            "&:hover": { color: "primary.main" },
          }}
        >
          {h.text}
        </Box>
      ))}
    </Stack>
  );

  return (
    <>
      {/* Desktop sticky sidebar */}
      <Box
        sx={{
          display: { xs: "none", md: "block" },
          position: "sticky",
          top: 88,
        }}
      >
        <GlassCard sx={{ p: 2.5 }}>
          <Typography variant="overline" sx={{ color: "text.secondary" }}>
            On this page
          </Typography>
          <Box sx={{ mt: 1, maxHeight: "70vh", overflowY: "auto" }}>
            {renderList()}
          </Box>
        </GlassCard>
      </Box>

      {/* Mobile popover trigger */}
      <Box sx={{ display: { xs: "flex", md: "none" }, justifyContent: "flex-end", mb: 1 }}>
        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-label="Table of contents"
          sx={{ borderRadius: 999, bgcolor: "background.glass", border: (t) => `1px solid ${t.palette.divider}` }}
        >
          <ListIcon />
        </IconButton>
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{ paper: { sx: { p: 2, width: 280, maxWidth: "90vw", borderRadius: 3 } } }}
        >
          <Typography variant="overline" sx={{ color: "text.secondary" }}>On this page</Typography>
          <Box sx={{ mt: 1, maxHeight: "60vh", overflowY: "auto" }}>
            {renderList()}
          </Box>
        </Popover>
      </Box>
    </>
  );
};

export default TableOfContents;