import React from "react";
import { Box } from "@mui/material";
import { Link } from "react-router-dom";
import EditNoteIcon from "@mui/icons-material/EditNote";
import GridViewIcon from "@mui/icons-material/GridView";
import ArticleIcon from "@mui/icons-material/Article";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DarkModeIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeIcon from "@mui/icons-material/WbSunnyOutlined";
import { InkFeather } from "../ink";
import { useColorMode } from "../../context/ThemeContext";

/* ─────────────────────────────────────────────────────────────────────
   Studio rail — the 72px column on the far left.

   A quiet instrument strip, NOT an admin sidebar: one icon per tool, no
   section labels, no chevrons, and a bottom corner left to the theme
   toggle. "Write" is this page; "AI Tools" focuses the copilot panel;
   "My Drafts" hands off to the writer's blog list.

   `onTemplates` / `onAiTools` are the page's own callbacks so the rail
   never needs to know where the copilot lives.
   ───────────────────────────────────────────────────────────────────── */

const RailItem = ({ as = "button", icon, label, active, onClick, to }) => {
  const Tag = to ? Link : as;
  const props = {
    className: `ist-rail-item${active ? " is-active" : ""}`,
    "aria-label": label,
    title: label,
  };
  if (onClick) props.onClick = onClick;
  if (to) props.to = to;

  return (
    <Tag {...props}>
      <span className="ist-rail-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="ist-rail-label" aria-hidden="true">
        {label}
      </span>
    </Tag>
  );
};

const StudioRail = ({ active, onTemplates, onAiTools }) => {
  const { toggleTheme, isDarkMode } = useColorMode();

  return (
    <nav className="ist-rail" aria-label="Writing studio tools">
      <Link to="/" className="ist-rail-logo" aria-label="InkWell home">
        <InkFeather sx={{ fontSize: 26 }} />
      </Link>

      <div className="ist-rail-items">
        <RailItem icon={<EditNoteIcon />} label="Write" active={active === "write"} />
        <RailItem icon={<GridViewIcon />} label="Templates" onClick={onTemplates} />
        <RailItem icon={<ArticleIcon />} label="My Drafts" to="/my-blogs" />
        <RailItem icon={<AutoAwesomeIcon />} label="AI Tools" onClick={onAiTools} />
      </div>

      <Box className="ist-rail-bottom">
        <button
          type="button"
          className="ist-rail-item"
          onClick={toggleTheme}
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          title="Toggle theme"
        >
          <span className="ist-rail-icon" aria-hidden="true">
            {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </span>
        </button>
      </Box>
    </nav>
  );
};

export default StudioRail;