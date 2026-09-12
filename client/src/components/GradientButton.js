import React from "react";
import { Button } from "@mui/material";

// The primary CTA: a charcoal 135° gradient button with the theme's
// `variant="gradient"` override baked in. All props pass through to MUI
// Button, so it's a drop-in replacement.
const GradientButton = ({ children, sx, ...props }) => (
  <Button variant="gradient" sx={sx} {...props}>
    {children}
  </Button>
);

export default GradientButton;