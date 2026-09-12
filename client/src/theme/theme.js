import { createTheme } from "@mui/material/styles";

// ─────────────────────────────────────────────────────────────────────
//  Inkwell design system — premium white editorial / charcoal monochrome.
//  One factory builds both the light and dark MUI themes from a shared
//  token set so the two modes never drift apart. The raw `.css` pages
//  read the same values through CSS custom properties (see index.css),
//  which mirror these tokens and switch on the `data-theme` attribute
//  set by ThemeContext.
// ─────────────────────────────────────────────────────────────────────

// Brand accent — charcoal. #111111 is the light-mode primary; #000000 is the
// deep hover/press tone. Dark mode inverts to a warm white #F5F1EA primary so
// buttons/links stay legible on the near-black surfaces; only the neutrals
// flip (premium white in light, warm black #11100F family in dark).
const getTokenSets = (mode) => {
  const isDark = mode === "dark";
  const BRAND = isDark
    ? { main: "#F5F1EA", light: "#FFFFFF", dark: "#D6CFC4", contrastText: "#111111" }
    : { main: "#111111", light: "#3F3F46", dark: "#000000", contrastText: "#FFFFFF" };
  // A single "accent badge" tone matching the brand, used sparingly (eyebrow
  // dots, trending arrows, role badges) so it reads as a highlight, not a
  // second brand color.
  const ACCENT = isDark
    ? { main: "#F5F1EA", contrastText: "#111111" }
    : { main: "#111111", contrastText: "#FFFFFF" };

  return {
    brand: BRAND,
    accent: ACCENT,
    // alpha helpers for low-emphasis charcoal fills (chip/button hovers)
    brandSoft: isDark ? "rgba(245,241,234,0.16)" : "rgba(17,17,17,0.06)",
    brandSofter: isDark ? "rgba(245,241,234,0.08)" : "rgba(17,17,17,0.035)",
    background: {
      default: isDark ? "#11100F" : "#FAFAF9",
      paper: isDark ? "#1A1816" : "#FFFFFF",
      // translucent "glass" surface
      glass: isDark ? "rgba(26,24,22,0.70)" : "rgba(255,255,255,0.75)",
      gradient: isDark
        ? "linear-gradient(180deg, #11100F 0%, #1A1816 100%)"
        : "linear-gradient(180deg, #FFFFFF 0%, #FAFAF9 100%)",
    },
    text: {
      primary: isDark ? "#F5F1EA" : "#111111",
      secondary: isDark ? "#A8A29E" : "#4B5563",
      disabled: isDark ? "#78716C" : "#6B7280",
    },
    divider: isDark ? "rgba(245,241,234,0.10)" : "#E7E5E4",
    // glow shadows — the charcoal "lift" on hover
    customShadows: {
      card: isDark
        ? "0 8px 28px rgba(0,0,0,0.50)"
        : "0 4px 20px rgba(17,17,17,0.05)",
      cardHover: isDark
        ? "0 12px 40px rgba(0,0,0,0.60)"
        : "0 12px 36px rgba(17,17,17,0.12)",
      glass: isDark
        ? "0 8px 32px rgba(0,0,0,0.55)"
        : "0 8px 32px rgba(17,17,17,0.07)",
      glow: isDark ? "0 0 0 4px rgba(245,241,234,0.18)" : "0 0 0 4px rgba(17,17,17,0.10)",
    },
  };
};

const getDesignTokens = (mode) => {
  const t = getTokenSets(mode);
  return {
    palette: {
      mode,
      primary: { ...t.brand, bgHover: t.brandSoft, bgSofter: t.brandSofter },
      secondary: t.accent,
      background: t.background,
      text: t.text,
      divider: t.divider,
      success: { main: "#16A34A", contrastText: "#FFFFFF" },
      error: { main: "#DC2626", contrastText: "#FFFFFF" },
      // semantic warning keeps its conventional amber (functional, not brand)
      warning: { main: "#D97706", contrastText: "#FFFFFF" },
      info: t.accent,
      // Exposed as palette entries so `bgcolor: "brandSoft"` / "brandSofter"
      // resolve to real colors in the sx prop (MUI looks palette keys up by
      // name). Many components across the app rely on this.
      brandSoft: t.brandSoft,
      brandSofter: t.brandSofter,
    },
    // exposed on the theme object for sx consumers (theme.customShadows.*)
    customShadows: t.customShadows,
    brandSoft: t.brandSoft,
  };
};

const FONT_DISPLAY = '"Plus Jakarta Sans", "Inter", system-ui, sans-serif';
const FONT_BODY = '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const FONT_MONO = '"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace';

const buildTheme = (mode) => {
  const tokens = getDesignTokens(mode);
  const { palette, customShadows, brandSoft } = tokens;

  return createTheme({
    palette,
    shape: { borderRadius: 16 },
    typography: {
      fontFamily: FONT_BODY,
      h1: { fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: "3.25rem", lineHeight: 1.1, letterSpacing: "-0.02em" },
      h2: { fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: "2.5rem", lineHeight: 1.15, letterSpacing: "-0.02em" },
      h3: { fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: "2rem", lineHeight: 1.2, letterSpacing: "-0.015em" },
      h4: { fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: "1.5rem", lineHeight: 1.25, letterSpacing: "-0.01em" },
      h5: { fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: "1.25rem", lineHeight: 1.3 },
      h6: { fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: "1.05rem", lineHeight: 1.35 },
      subtitle1: { fontWeight: 500, fontSize: "1rem", lineHeight: 1.5, color: palette.text.secondary },
      subtitle2: { fontWeight: 600, fontSize: "0.875rem", lineHeight: 1.45 },
      body1: { fontWeight: 400, fontSize: "1rem", lineHeight: 1.6 },
      body2: { fontWeight: 400, fontSize: "0.875rem", lineHeight: 1.55 },
      button: { fontWeight: 600, fontSize: "0.9rem", textTransform: "none", letterSpacing: "0.01em" },
      caption: { fontWeight: 500, fontSize: "0.75rem", lineHeight: 1.4 },
      overline: { fontWeight: 700, fontSize: "0.7rem", lineHeight: 1.4, letterSpacing: "0.12em", textTransform: "uppercase", color: palette.primary.main },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: palette.background.default,
            backgroundImage: palette.background.gradient,
            backgroundAttachment: "fixed",
            color: palette.text.primary,
            fontFamily: FONT_BODY,
          },
          "::-webkit-scrollbar": { width: 10, height: 10 },
          "::-webkit-scrollbar-track": { background: "transparent" },
          "::-webkit-scrollbar-thumb": {
            background: palette.divider,
            borderRadius: 999,
            border: "2px solid transparent",
            backgroundClip: "padding-box",
          },
          "::-webkit-scrollbar-thumb:hover": { background: palette.primary.main },
          "html": { scrollbarColor: `${palette.primary.main} transparent` },
          "::selection": { background: palette.primary.main, color: palette.primary.contrastText },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 16,
            textTransform: "none",
            fontWeight: 600,
            padding: "10px 20px",
            transition: "all .2s ease",
          },
          containedPrimary: {
            background: `linear-gradient(135deg, ${palette.primary.main}, ${palette.primary.light})`,
            color: palette.primary.contrastText,
            "&:hover": {
              background: `linear-gradient(135deg, ${palette.primary.dark}, ${palette.primary.main})`,
              boxShadow: customShadows.cardHover,
              transform: "translateY(-1px)",
            },
          },
          outlinedPrimary: {
            border: `1.5px solid ${palette.primary.main}`,
            color: palette.primary.main,
            "&:hover": {
              backgroundColor: brandSoft,
              borderColor: palette.primary.main,
            },
          },
        },
        // a custom "gradient" variant (charcoal 135°) for the primary CTA
        variants: [
          {
            props: { variant: "gradient" },
            style: {
              background: `linear-gradient(135deg, ${palette.primary.main}, ${palette.primary.light})`,
              color: palette.primary.contrastText,
              borderRadius: 16,
              boxShadow: customShadows.card,
              "&:hover": {
                background: `linear-gradient(135deg, ${palette.primary.dark}, ${palette.primary.main})`,
                boxShadow: customShadows.cardHover,
                transform: "translateY(-1px)",
              },
            },
          },
        ],
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: "none",
            backgroundColor: palette.background.paper,
            border: `1px solid ${palette.divider}`,
            boxShadow: customShadows.card,
            overflow: "hidden",
          },
        },
        variants: [
          {
            props: { variant: "glass" },
            style: {
              backgroundColor: palette.background.glass,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: `1px solid ${palette.divider}`,
              boxShadow: customShadows.glass,
            },
          },
        ],
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: "none",
            backgroundColor: palette.background.paper,
            border: `1px solid ${palette.divider}`,
            boxShadow: customShadows.card,
          },
        },
        variants: [
          {
            props: { variant: "glass" },
            style: {
              backgroundColor: palette.background.glass,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: `1px solid ${palette.divider}`,
              boxShadow: customShadows.glass,
            },
          },
        ],
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: palette.background.paper,
            "& .MuiOutlinedInput-notchedOutline": { borderColor: palette.divider },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: palette.primary.light },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: palette.primary.main,
              boxShadow: customShadows.glow,
            },
            "&.Mui-error .MuiOutlinedInput-notchedOutline": { borderColor: palette.error.main },
          },
        },
      },
      MuiTextField: { defaultProps: { variant: "outlined" } },
      MuiInputLabel: {
        styleOverrides: {
          root: { color: palette.text.secondary },
          outlined: {
            "&.Mui-focused": { color: palette.primary.main },
          },
        },
      },
      MuiChip: {
        defaultProps: { size: "small" },
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontWeight: 600,
            backgroundColor: brandSoft,
            color: palette.primary.main,
            border: `1px solid ${palette.divider}`,
          },
          filledPrimary: {
            backgroundColor: palette.primary.main,
            color: palette.primary.contrastText,
            border: "none",
          },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: "transparent" },
        styleOverrides: {
          root: {
            backgroundColor: palette.background.glass,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: `1px solid ${palette.divider}`,
            backgroundImage: "none",
            color: palette.text.primary,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: palette.background.paper,
            backgroundImage: "none",
            borderRight: `1px solid ${palette.divider}`,
            color: palette.text.primary,
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: { minHeight: 44 },
          indicator: { backgroundColor: palette.primary.main, height: 3, borderRadius: 999 },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 999,
            minHeight: 44,
            "&.Mui-selected": { color: palette.primary.main },
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 999, backgroundColor: palette.divider, height: 10 },
          bar: {
            borderRadius: 999,
            background: `linear-gradient(90deg, ${palette.primary.main}, ${palette.primary.light})`,
          },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: {
            backgroundColor: palette.divider,
            borderRadius: 12,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            "&:hover": { backgroundColor: brandSoft, color: palette.primary.main },
          },
        },
      },
      MuiLink: {
        defaultProps: { underline: "hover" },
        styleOverrides: { root: { color: palette.primary.main } },
      },
      MuiAvatar: {
        styleOverrides: {
          root: { backgroundColor: brandSoft, color: palette.primary.main },
        },
      },
      MuiDivider: {
        styleOverrides: { root: { borderColor: palette.divider } },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: palette.background.paper,
            border: `1px solid ${palette.divider}`,
            borderRadius: 12,
            boxShadow: customShadows.card,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            "&:hover": { backgroundColor: brandSoft },
            "&.Mui-selected": { backgroundColor: brandSoft },
          },
        },
      },
    },
  });
};

export const lightTheme = buildTheme("light");
export const darkTheme = buildTheme("dark");
export { buildTheme, FONT_DISPLAY, FONT_BODY, FONT_MONO };
