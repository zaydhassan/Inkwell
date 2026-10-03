import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const ThemeContext = createContext();

const STORAGE_KEY = "inkwell-theme";

// Resolve the initial theme ONCE, synchronously, so there's no flash of the
// wrong theme on first paint: persisted choice > OS preference > light.
const getInitialTheme = () => {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* localStorage may be unavailable (private mode) — fall through */
  }
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
};

// Reflect the theme on <html> so raw-CSS pages + Quill can react via the
// `data-theme` attribute (and a `.dark` class as a convenience).
const applyThemeToDocument = (theme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.classList.toggle("dark", theme === "dark");
};

export const useTheme = () => useContext(ThemeContext);
// Preferred, clearer name for new code. Old `useTheme` imports keep working.
export const useColorMode = useTheme;

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  // Keep <html> in sync + persist the choice. Runs on mount (applying the
  // initial theme eagerly) and on every change.
  useEffect(() => {
    applyThemeToDocument(theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore write failures */
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const value = { theme, toggleTheme, isDarkMode: theme === "dark", mode: theme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};