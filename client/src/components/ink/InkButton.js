import React from "react";
import { Box } from "@mui/material";
import { INK } from "./tokens";

/* ─────────────────────────────────────────────────────────────────────
   InkWell buttons + badge.

   `InkButton` is a plain <button> (or an <a>/router <Link> via `as`)
   rather than an MUI Button, for two reasons: the styling then lives
   entirely in one CSS rule set with no specificity fight against MUI's
   theme-injected variant classes, and — more importantly — the buttons
   render identically on the always-dark editorial pages regardless of
   which MUI theme is active. Nothing here reads `t.palette.*`.

   Labels are uppercased by CSS to match the brief ("START WRITING →").
   ───────────────────────────────────────────────────────────────────── */

export const InkButton = ({
  children,
  variant = "primary",
  size = "medium",
  as,
  startIcon,
  endIcon,
  className = "",
  sx,
  style,
  ...props
}) => {
  const Component = as || "button";
  // `type` only makes sense on a real button; spreading it onto an <a>
  // would emit an invalid attribute.
  const typeProp = Component === "button" ? { type: props.type || "button" } : {};
  const { type, ...rest } = props;

  return (
    <Box
      component={Component}
      className={`ink-btn ink-btn-${variant} ${className}`.trim()}
      sx={{
        ...(size === "large" ? { minHeight: 54, px: 3, fontSize: "0.86rem" } : {}),
        ...sx,
      }}
      style={style}
      {...typeProp}
      {...rest}
    >
      {/* startIcon/endIcon: MUI-Button-style slots, laid out by .ink-btn's flex
          gap. Rendered as children rather than forwarded, so they never leak
          onto the DOM as invalid attributes. */}
      {startIcon}
      {children}
      {endIcon}
    </Box>
  );
};

/* The primary CTA — orange fill, dark ink text. */
export const InkPrimaryButton = (props) => <InkButton variant="primary" {...props} />;

/* The secondary CTA — transparent with a hairline border. */
export const InkGhostButton = (props) => <InkButton variant="ghost" {...props} />;

/* ── Badge ─────────────────────────────────────────────────────────── */
export const InkBadge = ({ children, tone = "neutral", sx }) => (
  <Box
    component="span"
    className={`ink-badge${tone === "accent" ? " ink-badge-accent" : ""}`}
    sx={sx}
  >
    {children}
  </Box>
);

/* A tiny meta row item (reading time, likes, comments) used on story cards.
   `muted` drops the icon+value to the secondary tone for meta that isn't
   about engagement. */
export const InkMeta = ({ icon, children, sx }) => (
  <Box
    component="span"
    sx={{
      display: "inline-flex",
      alignItems: "center",
      gap: 0.5,
      fontSize: "0.76rem",
      fontWeight: 600,
      color: INK.text3,
      "& svg": { fontSize: 15 },
      ...sx,
    }}
  >
    {icon}
    {children}
  </Box>
);

export default InkButton;
