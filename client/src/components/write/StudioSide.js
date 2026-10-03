import React from "react";
import { motion } from "framer-motion";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import TuneIcon from "@mui/icons-material/Tune";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunchOutlined";
import CloseIcon from "@mui/icons-material/Close";
import GridViewIcon from "@mui/icons-material/GridView";
import ArticleIcon from "@mui/icons-material/Article";
import { Link } from "react-router-dom";

/* ─────────────────────────────────────────────────────────────────────
   The studio's right panel — one <aside>, four tabs, slot-fed.

   Write with AI   — the copilot (the default tab)
   Details         — category + tags (the existing DetailsPanel)
   SEO             — draft diagnostics (local computation, not AI)
   Publish         — cover / schedule / checklist (the existing panels)

   The tabbed content arrives as ready-built React nodes (`aiEl`, …) so the
   panel container stays dumb: the page owns the state every panel needs.
   The active underline is one absolutely-positioned bar that slides via
   framer-motion's shared `layoutId` instead of being per-tab styled.

   On ≤1023 the page's CSS re-homes this same card into a bottom drawer
   (single DOM instance, two shells), so tab state survives the switch.
   The drawer's grabber row then also carries the rail tools that only
   make sense on a phone — templates, the writer's blog list — and the
   close affordance (the page renders the backdrop behind it).
   ───────────────────────────────────────────────────────────────────── */

const TABS = [
  { id: "ai", label: "Write with AI", icon: AutoAwesomeIcon },
  { id: "details", label: "Details", icon: TuneIcon },
  { id: "seo", label: "SEO", icon: QueryStatsIcon },
  { id: "publish", label: "Publish", icon: RocketLaunchIcon },
];

const PANELS = { ai: "Copilot", details: "DetailsPanel", seo: "SeoPanel", publish: "PublishPanel" };

const StudioSide = ({
  activeTab,
  onChangeTab,
  aiEl,
  detailsEl,
  seoEl,
  publishEl,
  onCloseDrawer,
  onTemplates,
}) => (
  <aside className="ist-side" aria-label="Writing studio panels">
    <div className="ist-drawer-bar">
      <span className="ist-drawer-grab" aria-hidden="true" />
      <span className="ist-drawer-title">Writing tools</span>
      <Link to="/my-blogs" className="ist-drawer-quick" aria-label="My blogs">
        <ArticleIcon />
      </Link>
      <button type="button" className="ist-drawer-quick" onClick={onTemplates} aria-label="Templates">
        <GridViewIcon />
      </button>
      <button type="button" className="ist-drawer-quick" onClick={onCloseDrawer} aria-label="Close panel">
        <CloseIcon />
      </button>
    </div>

    <div className="ist-side-head">
      <div className="ist-tabs" role="tablist" aria-label="Studio panels">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`ist-tab-${id}`}
            aria-selected={activeTab === id}
            aria-controls={`ist-panel-${id}`}
            className={`ist-tab${activeTab === id ? " is-active" : ""}`}
            onClick={() => onChangeTab(id)}
          >
            <Icon className={id === "ai" ? "ist-tab-spark" : undefined} />
            {label}
            {activeTab === id ? (
              <motion.span layoutId="ist-tab-underline" className="ist-tab-underline" aria-hidden="true" />
            ) : null}
          </button>
        ))}
      </div>
    </div>

    <div className="ist-side-scroll">
      <div
        id={`ist-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`ist-tab-${activeTab}`}
        className="ist-panel-slot"
        data-panel={PANELS[activeTab]}
      >
        {activeTab === "ai"
          ? aiEl
          : activeTab === "details"
          ? detailsEl
          : activeTab === "seo"
          ? seoEl
          : publishEl}
      </div>
    </div>
  </aside>
);

export default StudioSide;