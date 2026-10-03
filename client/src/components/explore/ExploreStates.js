import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Box } from "@mui/material";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import SearchOffRounded from "@mui/icons-material/SearchOffRounded";
import CloudOffRounded from "@mui/icons-material/CloudOffRounded";
import EditNoteOutlined from "@mui/icons-material/EditNoteOutlined";
import { InkGhostButton, InkPrimaryButton } from "../ink";

/* ─────────────────────────────────────────────────────────────────────
   InkWell Explore — the two non-happy states.

   They are separate components because they mean opposite things: an error is
   "we failed, try again", an empty result is "there is genuinely nothing here"
   and retrying would be pointless. Collapsing them into one "no results" panel
   (which is what the old page did — any failure rendered "No blogs found") is
   exactly the bug worth not repeating: it tells the reader an empty catalog
   when the truth is a failed request.

   Neither state ever prints the server's message. The reader gets the page's
   own copy; the raw error stays in the console.
   ───────────────────────────────────────────────────────────────────── */

/* A failed request. Offers the one action that can plausibly fix it. */
export const ExploreError = ({ onRetry }) => (
  <Box className="ink-explore-state" role="alert">
    <span className="ink-explore-state-icon" aria-hidden="true">
      <CloudOffRounded sx={{ fontSize: 26 }} />
    </span>
    <h2 className="ink-explore-state-title">Couldn&apos;t load stories.</h2>
    <p className="ink-explore-state-copy">
      Something went wrong while fetching the latest stories. Check your connection and try
      again.
    </p>
    <InkGhostButton onClick={onRetry}>Try again</InkGhostButton>
  </Box>
);

/* A successful request that matched nothing. Two different nothings, so two
   different lines: filters that excluded everything, vs. an empty catalog. */
export const ExploreEmpty = ({ isFiltered, query, onClearFilters }) => {
  const navigate = useNavigate();
  const isLogin = useSelector((state) => state.auth.isLogin);

  return (
    <Box className="ink-explore-state">
      <span className="ink-explore-state-icon" aria-hidden="true">
        {isFiltered ? (
          <SearchOffRounded sx={{ fontSize: 26 }} />
        ) : (
          <EditNoteOutlined sx={{ fontSize: 26 }} />
        )}
      </span>

      <h2 className="ink-explore-state-title">
        {isFiltered ? (
          <>No stories matched {query ? `“${query}”` : "this filter"}.</>
        ) : (
          <>No stories here yet.</>
        )}
      </h2>

      <p className="ink-explore-state-copy">
        {isFiltered
          ? "Try a different search, or browse another category — the library is growing every day."
          : "Be the first writer to share something with the InkWell community."}
      </p>

      <Box className="ink-explore-state-actions">
        {isFiltered ? (
          <>
            <InkGhostButton onClick={onClearFilters}>Clear filters</InkGhostButton>
            <InkPrimaryButton
              onClick={() => navigate(isLogin ? "/create-blog" : "/register")}
              endIcon={<ArrowForwardRounded sx={{ fontSize: 19 }} />}
            >
              Start writing
            </InkPrimaryButton>
          </>
        ) : (
          <InkPrimaryButton
            onClick={() => navigate(isLogin ? "/create-blog" : "/register")}
            endIcon={<ArrowForwardRounded sx={{ fontSize: 19 }} />}
          >
            Start writing
          </InkPrimaryButton>
        )}
      </Box>
    </Box>
  );
};
