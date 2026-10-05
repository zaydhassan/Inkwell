import React from "react";
import { Box, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";

/* ─────────────────────────────────────────────────────────────────────
   Reading History — filter bar.

   Five tabs, every one of them backed by a real query:

     All · Unfinished · Saved · Topics · Writers

   The brief listed "Articles" in place of "Unfinished"; on a page where
   every row IS an article, that tab would have filtered nothing and been
   pure decoration, so it was replaced with the one state the data can
   genuinely distinguish. The named constraint was "Do not create
   decorative tabs."

   The label is "Unfinished" rather than "In progress" on purpose: the
   filter is `progress < 100`, which also contains articles the reader
   opened but never scrolled into (a stored 0, drawn on the card as a
   plain "Read" action rather than a 0% bar). Calling those "in progress"
   would overstate them, so the tab is named for exactly what it holds.

   Every tab is applied SERVER-side (see getReadingHistory's `filter`
   param) rather than by filtering the loaded page, so the totals, the
   pagination and the empty state all stay truthful. Search reuses the
   app-wide `q` handling (parsePagination) — no second search system — and
   the sort options are exactly the four orderings the view row supports.
   ───────────────────────────────────────────────────────────────────── */

export const TABS = [
  { key: "all", label: "All" },
  { key: "unfinished", label: "Unfinished" },
  { key: "saved", label: "Saved" },
  { key: "topic", label: "Topics" },
  { key: "writer", label: "Writers" },
];

export const SORTS = [
  { key: "recent", label: "Newest first" },
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
}) => {
  const drill = tab === "topic" || tab === "writer";
  const options = tab === "topic" ? topics : writers;
  const selected = tab === "topic" ? topic : writer;

  return (
    <Box className="ink-rh-filters">
      <Box className="ink-rh-filters-row">
        <Box className="ink-rh-tabs" role="tablist" aria-label="Filter reading history">
          {TABS.map((t) => (
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

        <Box className="ink-rh-sort">
          <label htmlFor="ink-rh-sort">Sort</label>
          <select id="ink-rh-sort" value={sort} onChange={(e) => onSort(e.target.value)}>
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </Box>
      </Box>

      <Box className="ink-rh-searchwrap">
        <SearchIcon className="ink-rh-searchicon" fontSize="small" aria-hidden="true" />
        <input
          type="search"
          className="ink-rh-search"
          placeholder="Search your reading history..."
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          aria-label="Search your reading history"
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

      {/* Drill-down for the two "browse by" tabs — real values with real
          whole-history counts, so a reader can see where to go next. */}
      {drill && (
        <Box className="ink-rh-drill">
          {options.length === 0 ? (
            <Typography className="ink-rh-drill-empty">
              {tab === "topic"
                ? "No topics yet — they appear once you’ve read something."
                : "No writers yet — they appear once you’ve read something."}
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
