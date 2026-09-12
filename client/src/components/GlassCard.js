import React, { forwardRef } from "react";
import { Card } from "@mui/material";
import { useTheme } from "@mui/material/styles";

// A translucent "glass" surface: blurred backdrop + hairline border + soft
// shadow. Optional `glowOnHover` swaps in the charcoal lift shadow and a
// small upward nudge — the signature Modern-SaaS hover affordance.
const GlassCard = forwardRef(function GlassCard(
  { glowOnHover = false, sx, children, ...props },
  ref
) {
  const theme = useTheme();
  return (
    <Card
      ref={ref}
      variant="glass"
      sx={{
        transition: "transform .25s ease, box-shadow .25s ease",
        ...(glowOnHover && {
          cursor: "default",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: theme.customShadows?.cardHover,
          },
        }),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Card>
  );
});

export default GlassCard;