import React from "react";
import { Box, Typography, Stack } from "@mui/material";

// A premium, on-brand vector logo for Inkwell — a charcoal gradient badge
// carrying a quill glyph, paired with a styled "Inkwell" wordmark. Used across
// the Navbar, Footer, and auth split-screen so the brand mark is consistent
// everywhere. Pure vector/CSS — no image files are referenced or inspected.
//
// Props:
//   variant    "full" (mark + wordmark) | "mark" | "wordmark"   default "full"
//   size       badge edge length in px                          default 40
//   tone       "auto" (theme-aware) | "light" (on dark panel)   default "auto"
//   showTagline  bool                                         default false
//   tagline    override the small caption                     default "Write · Share · Earn"
//   onClick    makes the whole mark a pointer
//   ...rest    spread onto the root (aria-label, role, etc.)

const Quill = ({ sx }) => (
  <Box
    component="svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    sx={{ width: "55%", height: "55%", color: "#fff", ...sx }}
    aria-hidden="true"
  >
    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
    <line x1="16" y1="8" x2="2" y2="22" />
    <line x1="17.5" y1="15" x2="9" y2="15" />
  </Box>
);

const BrandLogo = ({
  variant = "full",
  size = 40,
  tone = "auto",
  showTagline = false,
  tagline = "Write · Share · Inspire",
  onClick,
  sx,
  ...rest
}) => {
  const onDark = tone === "light";
  const wordColor = onDark ? "#fff" : "text.primary";
  const taglineColor = onDark ? "rgba(255,255,255,0.72)" : "text.secondary";

  const mark = (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        background: "linear-gradient(135deg, #2A2A2A 0%, #111111 55%, #000000 100%)",
        boxShadow: "0 6px 18px rgba(17,17,17,0.30)",
        border: "1px solid rgba(255,255,255,0.20)",
        position: "relative",
        overflow: "hidden",
        "&::after": {
          // soft top-left sheen for depth
          content: '""',
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 45%)",
          pointerEvents: "none",
        },
      }}
    >
      <Quill />
    </Box>
  );

  const wordmark = (
    <Box sx={{ lineHeight: 1 }}>
      <Typography
        sx={{
          fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
          fontWeight: 800,
          fontSize: size * 0.46,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          color: wordColor,
          display: "inline-flex",
          alignItems: "baseline",
        }}
      >
        Ink<span style={{ color: "var(--accent)" }}>well</span>
      </Typography>
      {showTagline && (
        <Typography
          sx={{
            fontFamily: '"Inter", sans-serif',
            fontWeight: 600,
            fontSize: size * 0.17,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: taglineColor,
            mt: 0.5,
          }}
        >
          {tagline}
        </Typography>
      )}
    </Box>
  );

  if (variant === "mark") {
    return (
      <Box onClick={onClick} sx={sx} {...rest}>
        {mark}
      </Box>
    );
  }

  if (variant === "wordmark") {
    return (
      <Box onClick={onClick} sx={{ cursor: onClick ? "pointer" : "inherit", ...sx }} {...rest}>
        {wordmark}
      </Box>
    );
  }

  return (
    <Stack
      direction="row"
      spacing={1.1}
      alignItems="center"
      onClick={onClick}
      sx={{ cursor: onClick ? "pointer" : "inherit", ...sx }}
      {...rest}
    >
      {mark}
      {wordmark}
    </Stack>
  );
};

export default BrandLogo;