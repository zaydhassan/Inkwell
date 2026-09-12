import React from "react";
import { Typography, Box } from "@mui/material";

// A consistent section header: a charcoal "eyebrow" overline, a display
// title, and an optional supporting line. `badge` renders a small vibrant
// accent dot beside the eyebrow for the SaaS "accent badge" touch.
const SectionHeading = ({ eyebrow, title, subtitle, badge = false, align = "left", sx }) => (
  <Box sx={{ mb: 3, textAlign: align, ...sx }}>
    {eyebrow && (
      <Typography
        variant="overline"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.75,
          color: "primary.main",
        }}
      >
        {badge && (
          <Box
            component="span"
            sx={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              bgcolor: "secondary.main",
              display: "inline-block",
            }}
          />
        )}
        {eyebrow}
      </Typography>
    )}
    <Typography variant="h3" component="h2" sx={{ mt: 0.5, color: "text.primary" }}>
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="subtitle1" sx={{ mt: 1, maxWidth: 640, mx: align === "center" ? "auto" : 0 }}>
        {subtitle}
      </Typography>
    )}
  </Box>
);

export default SectionHeading;