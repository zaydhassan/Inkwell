import React from "react";
import { Box } from "@mui/material";

/* ─────────────────────────────────────────────────────────────────────
   InkWell labelled field — label above, control, hint or error below.

   A plain <input>/<textarea> with a CSS class rather than an MUI TextField,
   for the same reason InkButton is a plain <button>: no specificity fight
   against MUI's theme-injected classes, and identical rendering whichever
   MUI theme is active. Labels are uppercased by CSS.

   `multiline` swaps the control to a <textarea>; everything else — label,
   hint, error, a11y wiring — behaves identically.
   ───────────────────────────────────────────────────────────────────── */

const InkField = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  type = "text",
  multiline = false,
  rows = 3,
  error,
  hint,
  autoComplete,
  required,
  placeholder,
  sx,
}) => {
  const id = `ink-field-${name}`;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <Box className="ink-field" sx={sx}>
      <Box component="label" className="ink-field-label" htmlFor={id}>
        {label}
      </Box>

      <Box
        component={multiline ? "textarea" : "input"}
        id={id}
        name={name}
        className={multiline ? "ink-textarea" : "ink-field-control"}
        {...(multiline ? { rows } : { type })}
        value={value ?? ""}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        // Only set while invalid, so the red border rule never fires on a
        // field the user hasn't touched yet.
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
      />

      {/* `role="alert"` so a validation failure is announced, not just shown. */}
      {error ? (
        <Box component="p" id={`${id}-error`} className="ink-field-error" role="alert">
          {error}
        </Box>
      ) : hint ? (
        <Box component="p" id={`${id}-hint`} className="ink-field-hint">
          {hint}
        </Box>
      ) : null}
    </Box>
  );
};

export default InkField;
