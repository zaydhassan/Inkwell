import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Box,
  Paper,
  TextField,
  InputAdornment,
  Typography,
  Stack,
  Chip,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import SearchIcon from "@mui/icons-material/Search";
import EditNoteIcon from "@mui/icons-material/EditNote";
import ArticleIcon from "@mui/icons-material/Article";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import HistoryIcon from "@mui/icons-material/History";
import PersonIcon from "@mui/icons-material/Person";
import BarChartIcon from "@mui/icons-material/BarChart";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import HomeIcon from "@mui/icons-material/Home";
import TagIcon from "@mui/icons-material/Tag";
import DescriptionIcon from "@mui/icons-material/Description";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useTheme } from "../context/ThemeContext";
import useRequireAuth from "../hooks/useRequireAuth";

// A Linear/Vercel-style ⌘K command palette. Opens with Cmd/Ctrl+K, searches
// quick actions + blog posts + topics (tags), and is fully keyboard-driven.
// Auth-gated destinations route through useRequireAuth so anonymous users are
// bounced to login consistently with the navbar/footer.

const stripHtml = (html) => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent || "").trim();
};

const CommandPalette = () => {
  const navigate = useNavigate();
  const go = useRequireAuth();
  const { theme, toggleTheme } = useTheme();
  const isLogin = useSelector((state) => state.auth.isLogin);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [blogs, setBlogs] = useState([]);
  const inputRef = useRef(null);
  const fetchedRef = useRef(false);

  // Global hotkey: Cmd/Ctrl+K toggles, Esc closes. Also listen for a
  // decoupled 'open-command-palette' event so the navbar search button (or
  // anything else) can open it without shared state.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpen);
    };
  }, [open]);

  // Lazy-fetch the blog index once on first open, then cache it.
  useEffect(() => {
    if (!open || fetchedRef.current) return;
    fetchedRef.current = true;
    axios
      .get("/api/v1/blog/all-blog?page=1&limit=50")
      .then(({ data }) => setBlogs(data.success ? data.blogs || [] : []))
      .catch(() => setBlogs([]));
  }, [open]);

  // Focus the input + lock body scroll while open; reset on close.
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
      document.body.style.overflow = "hidden";
    } else {
      setQuery("");
      setActive(0);
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Build the action list (depends on auth state + theme).
  const actions = useMemo(() => {
    const list = [
      { id: "act-home", group: "Actions", label: "Go home", icon: <HomeIcon />, run: () => navigate("/") },
      { id: "act-write", group: "Actions", label: "Start writing", icon: <EditNoteIcon />, run: () => go("/create-blog") },
      { id: "act-blogs", group: "Actions", label: "Explore blogs", icon: <ArticleIcon />, run: () => go("/blogs") },
      { id: "act-leader", group: "Actions", label: "Leaderboard", icon: <LeaderboardIcon />, run: () => go("/leaderboard") },
      { id: "act-bookmarks", group: "Actions", label: "Bookmarks", icon: <BookmarkBorderIcon />, run: () => go("/bookmarks") },
      { id: "act-history", group: "Actions", label: "Reading history", icon: <HistoryIcon />, run: () => go("/reading-history") },
      { id: "act-profile", group: "Actions", label: "Profile", icon: <PersonIcon />, run: () => go("/profile") },
      { id: "act-analytics", group: "Actions", label: "Analytics", icon: <BarChartIcon />, run: () => go("/analytics") },
      { id: "act-rewards", group: "Actions", label: "Rewards", icon: <CardGiftcardIcon />, run: () => go("/rewards") },
      {
        id: "act-theme",
        group: "Actions",
        label: theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
        icon: theme === "dark" ? <LightModeIcon /> : <DarkModeIcon />,
        run: () => toggleTheme(),
      },
    ];
    if (!isLogin) {
      list.push(
        { id: "act-login", group: "Actions", label: "Sign in", icon: <LoginIcon />, run: () => navigate("/login") },
        { id: "act-register", group: "Actions", label: "Create account", icon: <PersonAddIcon />, run: () => navigate("/register") }
      );
    }
    return list;
  }, [isLogin, theme, toggleTheme, navigate, go]);

  // Derive post + topic items from the cached blog index.
  const { postItems, topicItems } = useMemo(() => {
    const posts = blogs.map((b) => ({
      id: `post-${b._id}`,
      group: "Posts",
      label: stripHtml(b.title) || "Untitled story",
      hint: b.user?.username ? `by ${b.user.username}` : "",
      icon: <DescriptionIcon />,
      run: () => navigate(`/blog-details/${b._id}`),
    }));
    const tagSet = new Set();
    blogs.forEach((b) => {
      (b.tags || []).forEach((t) => {
        const name = typeof t === "string" ? t : t?.tag_name;
        if (name) tagSet.add(name);
      });
    });
    const topics = Array.from(tagSet).map((t) => ({
      id: `topic-${t}`,
      group: "Topics",
      label: t,
      hint: "Browse topic",
      icon: <TagIcon />,
      run: () => navigate(`/category/${encodeURIComponent(t)}`),
    }));
    return { postItems: posts, topicItems: topics };
  }, [blogs, navigate]);

  // Filter + order: actions first, then posts, then topics.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = [...actions, ...postItems, ...topicItems];
    if (!q) return all.slice(0, 8);
    return all
      .filter((it) => {
        const hay = `${it.label} ${it.hint || ""} ${it.group}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 12);
  }, [query, actions, postItems, topicItems]);

  // Keep the active index in range as the filtered set changes.
  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  const runItem = useCallback(
    (item) => {
      if (!item) return;
      setOpen(false);
      item.run();
    },
    []
  );

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runItem(filtered[active]);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1300,
            backgroundColor: "rgba(22,19,15,0.55)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingLeft: 16,
            paddingRight: 16,
            paddingTop: "12vh",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 600 }}
          >
            <Paper
              elevation={0}
              sx={{
                overflow: "hidden",
                borderRadius: 3,
                border: (t) => `1px solid ${t.palette.divider}`,
                boxShadow: (t) => t.customShadows?.glass || "0 24px 60px rgba(0,0,0,0.35)",
                bgcolor: "background.paper",
              }}
            >
              {/* Search field */}
              <TextField
                inputRef={inputRef}
                fullWidth
                placeholder="Search posts, topics, and actions…"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                onKeyDown={onKeyDown}
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  startAdornment: (
                    <InputAdornment position="start" sx={{ ml: 1.5, color: "text.secondary" }}>
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end" sx={{ mr: 1.5 }}>
                      <Chip label="Esc" size="small" sx={{ height: 20, fontSize: "0.65rem", bgcolor: "background.glass" }} />
                    </InputAdornment>
                  ),
                  sx: { py: 1.75, fontSize: "1rem" },
                }}
              />

              {/* Results */}
              <Box sx={{ maxHeight: { xs: "50vh", sm: "56vh" }, overflowY: "auto", borderTop: (t) => `1px solid ${t.palette.divider}` }}>
                {filtered.length === 0 && (
                  <Typography variant="body2" sx={{ color: "text.secondary", px: 3, py: 4, textAlign: "center" }}>
                    No results for “{query}”
                  </Typography>
                )}
                {filtered.map((item, i) => {
                  const showGroup =
                    i === 0 || filtered[i - 1].group !== item.group;
                  return (
                    <React.Fragment key={item.id}>
                      {showGroup && (
                        <Typography
                          variant="overline"
                          sx={{ display: "block", px: 2.5, pt: i === 0 ? 1.5 : 1.25, pb: 0.5, color: "text.disabled" }}
                        >
                          {item.group}
                        </Typography>
                      )}
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                        onClick={() => runItem(item)}
                        onMouseEnter={() => setActive(i)}
                        sx={{
                          px: 2.5,
                          py: 1.25,
                          cursor: "pointer",
                          borderRadius: 0,
                          bgcolor: i === active ? "primary.bgSofter" : "transparent",
                          transition: "background-color .12s ease",
                          "&:hover": { bgcolor: "primary.bgSofter" },
                        }}
                      >
                        <Box sx={{ color: i === active ? "primary.main" : "text.secondary", display: "flex" }}>
                          {item.icon}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 600 }} noWrap>
                            {item.label}
                          </Typography>
                          {item.hint && (
                            <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
                              {item.hint}
                            </Typography>
                          )}
                        </Box>
                        {i === active && (
                          <ArrowForwardIcon sx={{ fontSize: 16, color: "primary.main" }} />
                        )}
                      </Stack>
                    </React.Fragment>
                  );
                })}
              </Box>

              {/* Footer hint bar */}
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  px: 2.5,
                  py: 1.25,
                  borderTop: (t) => `1px solid ${t.palette.divider}`,
                  bgcolor: "background.glass",
                  color: "text.secondary",
                  "& .kbd": { fontSize: "0.7rem", fontWeight: 700 },
                }}
              >
                <Typography variant="caption"><span className="kbd">↑↓</span> navigate</Typography>
                <Typography variant="caption"><span className="kbd">↵</span> select</Typography>
                <Typography variant="caption"><span className="kbd">⌘K</span> toggle</Typography>
              </Stack>
            </Paper>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default CommandPalette;