import React from "react";
import { Link } from "react-router-dom";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import { CATEGORIES } from "../../data/categories";

/* ─────────────────────────────────────────────────────────────────────
   InkWell Explore — "Browse categories", as compact pills.

   One wrapping pill per category instead of a bulleted row list: the card
   stays at a magazine-column height and reads as navigation, not as an
   admin menu. Every pill is a real link to /category/:name, so this is a
   second route into the same filtered view the top filter row offers,
   kept in step through the shared CATEGORIES list (no second hard-coded
   array to drift), and the grid still updates from the route — which is
   the one source of truth for the active filter. "View all" clears the
   filter by going back to /explore.

   No per-category counts. The API can only give those one request at a
   time, and a hard-coded or partially-loaded number would be worse than
   no number.
   ───────────────────────────────────────────────────────────────────── */

const CategorySidebar = ({ active = "" }) => (
  <section className="ink-side-card ink-surface" aria-labelledby="ink-browse-head">
    <header className="ink-side-head">
      <div className="ink-side-head-titles">
        <span className="ink-side-eyebrow" id="ink-browse-head">
          Browse
        </span>
        <h2 className="ink-side-title">Categories</h2>
      </div>
      <Link to="/explore" className="ink-side-more">
        View all
        <ArrowForwardRounded />
      </Link>
    </header>

    <ul className="ink-cat-pills">
      {CATEGORIES.map((name) => {
        const isActive = active.toLowerCase() === name.toLowerCase();
        return (
          <li key={name}>
            <Link
              to={`/category/${encodeURIComponent(name)}`}
              className={`ink-cat-pill${isActive ? " ink-cat-pill--active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              {name}
            </Link>
          </li>
        );
      })}
    </ul>
  </section>
);

export default CategorySidebar;