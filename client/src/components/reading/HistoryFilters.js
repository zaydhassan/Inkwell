import React from "react";
import { Box, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
// The bar's styles travel with the bar. Imported here rather than pasted
// into each page's stylesheet, so Reading History and Bookmarks render the
// same component with the same rules.
import "../../styles/ink-filters.css";

/* ─────────────────────────────────────────────────────────────────────
   Reading History — filter bar.

   ONE control row: the tabs on the left, the search field and the sort
   select on the right (they stack on narrow screens). The row sits
   directly under the compact stats strip so the article grid stays close
   to the top of the page.

   Five tabs, every one of them backed by a real query:

     All · Articles · Saved · Topics · Writers

   "Articles" is the reader's actual reading — rows where `progress > 0`,
   i.e. they scrolled into the article rather than only opening it. It is a
   genuine subset of "All" (the three seeded rows at 0 drop out), applied
   server-side by getReadingHistory's `articles` filter, so the totals and
   pagination stay truthful. A tab that re-listed everything "All" already
   shows would have been decoration, and the named constraint was "Do not
   create decorative tabs."

   Every tab is applied SERVER-side rather than by filtering the loaded
   page, so the totals, the pagination and the empty state all stay
   truthful. Search reuses the app-wide `q` handling (parsePagination) — no
   second search system — and the sort options are exactly the four
   orderings the view row supports.

   The bar is generic — tabs, sorts, placeholder and the labels a screen
   reader hears all come in as props. Reading History passes nothing and so
   keeps the defaults below; the Bookmarks page passes its own tab set
   (which has a different, equally real, fourth facet). One bar, not two
   hand-matched copies of the same markup.
   ───────────────────────────────────────────────────────────────────── */

export const TABS = [
  { key: "all", label: "All" },
  { key: "articles", label: "Articles" },
  { key: "saved", label: "Saved" },
  { key: "topic", label: "Topics" },
  { key: "writer", label: "Writers" },
];

export const SORTS = [
  { key: "recent", label: "Most recent" },
  { key: "oldest", label: "Oldest first" },
  { key: "progress", label: "Furthest through" },
  { key: "unfinished", label: "Barely started" },
];

const HistoryFilters = ({
  tab,
  onTab,
  query,
  onQuery,
  sort,
  onSort,
  topics = [],
  writers = [],
  topic,
  writer,
  onPick,
  // Defaults reproduce this page's own bar exactly; callers with a different
  // vocabulary override only what they need.
  tabs = TABS,
  sorts = SORTS,
  placeholder = "Search your reading history...",
  searchLabel = "Search your reading history",
  filterLabel = "Filter reading history",
  emptyDrill = "they appear once you’ve read something",
}) => {
  const drill = tab === "topic" || tab === "writer";
  const options = tab === "topic" ? topics : writers;
  const selected = tab === "topic" ? topic : writer;

  return (
    <Box className="ink-rh-filters">
      {/* One row: filters left, search + sort right. */}
      <Box className="ink-rh-filters-row">
        <Box className="ink-rh-tabs" role="tablist" aria-label={filterLabel}>
          {tabs.map((t) => (
            <Box
              component="button"
              type="button"
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={`ink-rh-tab${tab === t.key ? " is-active" : ""}`}
              onClick={() => onTab(t.key)}
            >
              {t.label}
            </Box>
          ))}
        </Box>

        <Box className="ink-rh-controls">
          <Box className="ink-rh-searchwrap">
            <SearchIcon className="ink-rh-searchicon" fontSize="small" aria-hidden="true" />
            <input
              type="search"
              className="ink-rh-search"
              placeholder={placeholder}
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              aria-label={searchLabel}
            />
            {query && (
              <Box
                component="button"
                type="button"
                className="ink-rh-searchclear"
                onClick={() => onQuery("")}
                aria-label="Clear search"
              >
                <CloseIcon fontSize="inherit" />
              </Box>
            )}
          </Box>

          <Box className="ink-rh-sort">
            <label htmlFor="ink-rh-sort">Sort by</label>
            <select id="ink-rh-sort" value={sort} onChange={(e) => onSort(e.target.value)}>
              {sorts.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </Box>
        </Box>
      </Box>

      {/* Drill-down for the two "browse by" tabs — real values with real
          whole-history counts, so a reader can see where to go next. */}
      {drill && (
        <Box className="ink-rh-drill">
          {options.length === 0 ? (
            <Typography className="ink-rh-drill-empty">
              {tab === "topic" ? `No topics yet — ${emptyDrill}.` : `No writers yet — ${emptyDrill}.`}
            </Typography>
          ) : (
            <>
              <Typography className="ink-rh-drill-label">
                {tab === "topic" ? "Filter by topic" : "Filter by writer"}
              </Typography>
              <Box className="ink-rh-chips">
                {options.map((o) => {
                  const value = tab === "topic" ? o.name : o.id;
                  const on = selected === value;
                  return (
                    <Box
                      component="button"
                      type="button"
                      key={value}
                      className={`ink-rh-chip${on ? " is-on" : ""}`}
                      aria-pressed={on}
                      onClick={() => onPick(on ? "" : value)}
                    >
                      {tab === "writer" && o.avatar && (
                        <img className="ink-rh-chip-avatar" src={o.avatar} alt="" loading="lazy" />
                      )}
                      <span className="ink-rh-chip-name">{o.name}</span>
                      <span className="ink-rh-chip-count">{o.count}</span>
                    </Box>
                  );
                })}
              </Box>
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

export default HistoryFilters;
