import React from "react";
import { Link } from "react-router-dom";
import { CATEGORY_FILTERS } from "../../data/categories";

/* ─────────────────────────────────────────────────────────────────────
   InkWell Explore — the category filter row.

   Real <Link>s, not buttons: "All" goes to /explore and every other pill to
   /category/:name, which is the route the app already had. Filtering therefore
   lives in the URL — a filtered view is shareable, bookmarkable and survives a
   refresh, and the browser's Back button steps back out of a filter the way a
   reader expects. The page reads the active category from the route, so the
   pills and the sidebar can never disagree with the grid.

   The row scrolls horizontally on narrow screens rather than wrapping into a
   ragged block, and the scrollbar is hidden (see Explore.css) because the
   cut-off pill at the edge already signals there is more.
   ───────────────────────────────────────────────────────────────────── */

const CategoryFilters = ({ active = "" }) => (
  <nav className="ink-explore-filters" aria-label="Filter stories by category">
    <ul className="ink-explore-filters-list">
      {CATEGORY_FILTERS.map((label) => {
        const isAll = label === "All";
        const isActive = isAll ? !active : active.toLowerCase() === label.toLowerCase();

        return (
          <li key={label}>
            <Link
              to={isAll ? "/explore" : `/category/${encodeURIComponent(label)}`}
              className={`ink-pill${isActive ? " ink-pill--active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  </nav>
);

export default CategoryFilters;
