import React from "react";
import { Box } from "@mui/material";

// Shared responsive blog-card grid. Intrinsic — 3 across on a wide desktop,
// 2 on a tablet, 1 on a phone — with no breakpoint at all, so it stays right
// inside whichever Container width the caller uses.
//
// The floor is sized for the widest caller (Container maxWidth="lg", ~1152px
// of content): three 300px tracks plus the 24px gaps need 948px, and a fourth
// column would need 1272px, so a wide screen keeps its three. `min(300px,
// 100%)` keeps the track from exceeding the container on a 320px phone, which
// is what would otherwise scroll the page.
//
// `auto-fill` rather than `auto-fit`: auto-fit collapses the tracks a short
// row leaves empty and stretches the remaining cards to fill the row; the
// counted grid this replaces left the gap in place.
const BlogGrid = ({ children, sx }) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))",
      gap: 3,
      ...sx,
    }}
  >
    {children}
  </Box>
);

export default BlogGrid;