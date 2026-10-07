import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { AppBar, Toolbar, IconButton, Button, MenuItem, Menu, Drawer, Box, Stack, ListItemIcon, ListItemText, Divider } from "@mui/material";
import { motion } from "framer-motion";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import LeaderboardRoundedIcon from "@mui/icons-material/LeaderboardRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import NightsStayIcon from "@mui/icons-material/NightsStay";
import Brightness5Icon from "@mui/icons-material/Brightness5";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import NotificationsIcon from "@mui/icons-material/Notifications";
import HistoryIcon from "@mui/icons-material/History";
import BarChartIcon from "@mui/icons-material/BarChart";
import ArticleIcon from "@mui/icons-material/Article";
import PostAddIcon from "@mui/icons-material/PostAdd";
import LogoutIcon from "@mui/icons-material/Logout";
import { toastLogout } from "../utils/toasts";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import UserAvatar from "./UserAvatar";
import BrandLogo, { QuillGlyph } from "./BrandLogo";
import NotificationBell from "./NotificationBell";
import { authActions, fetchUnreadCount } from "../redux/store";
import useRequireAuth from "../hooks/useRequireAuth";

// Primary navigation. `Icon` is a component reference rather than an element so
// the same list can be rendered as a horizontal row (desktop) or as drawer rows
// (mobile) — each context sizes its own glyph off `.MuiButton-startIcon`.
const NAV_ITEMS = [
  { label: "Home", path: "/", Icon: HomeRoundedIcon, match: (p) => p === "/" },
  // `/blogs` is kept in the match: it is a second path onto the same Explore
  // page (see App.js), so an old link must still light this item up.
  {
    label: "Explore",
    path: "/explore",
    Icon: ExploreRoundedIcon,
    match: (p) => p.startsWith("/explore") || p.startsWith("/blogs") || p.startsWith("/category"),
  },
  { label: "Write", path: "/create-blog", Icon: EditNoteRoundedIcon, match: (p) => p.startsWith("/create-blog") || p.startsWith("/edit-blog") },
  { label: "Leaderboard", path: "/leaderboard", Icon: LeaderboardRoundedIcon, match: (p) => p.startsWith("/leaderboard") },
  { label: "About", path: "/about", Icon: InfoRoundedIcon, match: (p) => p === "/about" },
];

// The floating capsule's surface. The design system ships `--ink-bg` as an
// opaque token, but the capsule has to stay translucent for the page to read
// through the blur, so the system exposes this translucent sibling — which,
// unlike a literal here, follows the theme.
const PILL_BG = "var(--ink-nav-bg)";

// The keyboard-cap badge inside the search field. Styled as a tiny physical key
// — that reads as "premium product" far more than a plain text hint.
const KBD_SX = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  px: 0.75,
  height: 22,
  minWidth: 30,
  borderRadius: "7px",
  border: "1px solid var(--ink-border)",
  background: "linear-gradient(180deg, var(--ink-wash-2), var(--ink-wash))",
  color: "var(--ink-text-3)",
  fontFamily: "inherit",
  fontSize: "0.62rem",
  fontWeight: 700,
  letterSpacing: "0.04em",
  lineHeight: 1,
  whiteSpace: "nowrap",
  flexShrink: 0,
};

// The horizontal nav caps. Only the ACTIVE route earns the orange treatment —
// every other item stays neutral and hovers on a plain white veil, so the
// accent never becomes wallpaper. The 1px border is always present (transparent
// when idle) so gaining the active state never nudges the row's height.
const navBtnSx = (active) => ({
  textTransform: "none",
  borderRadius: 999,
  px: { lg: 1.25, xl: 2 },
  py: 1.375,
  minWidth: "auto",
  fontWeight: 600,
  fontSize: "0.875rem",
  whiteSpace: "nowrap",
  border: "1px solid",
  borderColor: active ? "rgba(255,106,0,0.10)" : "transparent",
  backgroundColor: active ? "var(--ink-orange-soft)" : "transparent",
  color: active ? "var(--ink-orange)" : "var(--ink-text-2)",
  transition: "background-color .17s ease, color .17s ease, border-color .17s ease, transform .17s ease",
  "& .MuiButton-startIcon": {
    color: "inherit",
    mr: 0.75,
    "& > *:nth-of-type(1)": { fontSize: 18 },
  },
  "&:hover": {
    backgroundColor: active ? "var(--ink-orange-soft)" : "var(--ink-wash)",
    borderColor: active ? "rgba(255,106,0,0.10)" : "transparent",
    color: active ? "var(--ink-orange)" : "var(--ink-text)",
    transform: "translateY(-1px)",
  },
});

// The same language, laid out as full-width drawer rows instead of a row.
const drawerBtnSx = (active) => ({
  justifyContent: "flex-start",
  textTransform: "none",
  fontWeight: active ? 700 : 600,
  fontSize: "0.92rem",
  borderRadius: 2.5,
  px: 1.75,
  minHeight: 50,
  color: active ? "var(--ink-orange)" : "var(--ink-text-2)",
  backgroundColor: active ? "var(--ink-orange-soft)" : "transparent",
  border: "1px solid",
  borderColor: active ? "rgba(255,106,0,0.10)" : "transparent",
  "& .MuiButton-startIcon": {
    color: "inherit",
    mr: 1.5,
    "& > *:nth-of-type(1)": { fontSize: 19 },
  },
  "&:hover": {
    color: active ? "var(--ink-orange)" : "var(--ink-text)",
    backgroundColor: active ? "var(--ink-orange-soft)" : "var(--ink-wash)",
  },
});

// Menu rows sit on a dropdown surface rather than the nav pill, so they hover
// with the system's neutral white veil (--ink-border-soft) instead of an
// orange tint — which would clash with the Logout row's intentional red.
const menuItemSx = {
  py: 1.25,
  color: "var(--ink-text)",
  "&:hover": { backgroundColor: "var(--ink-border-soft)" },
};

// The dropdown / drawer surfaces: the ink panel tokens with the border and
// lift the capsule uses, so every floating layer in the nav reads as one shell.
const POPOVER_SX = {
  borderRadius: "18px",
  overflow: "hidden",
  bgcolor: "var(--ink-bg-alt)",
  backgroundImage: "none",
  color: "var(--ink-text)",
  border: "1px solid var(--ink-border)",
  boxShadow: "var(--ink-shadow-card)",
};

const Navbar = () => {
  const navigate = useNavigate();
  const isLogin = useSelector((state) => state.auth.isLogin);
  const user = useSelector((state) => state.auth.user);
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const dispatch = useDispatch();
  const location = useLocation();
  const go = useRequireAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Which key prints on the search cap. Resolved once — it cannot change
  // during a session.
  const [isMac] = useState(
    () => typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)
  );

  // Scroll-aware depth: the capsule blurs harder and lifts further once the
  // page moves under it. Geometry stays fixed (see the offset notes on the
  // Toolbar below), so dependent sticky offsets never shift mid-scroll.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close both the avatar menu and the mobile drawer on route change.
  useEffect(() => {
    setAnchorEl(null);
    setMobileOpen(false);
  }, [location]);

  // Poll the unread-notification count for the bell badge while logged in:
  // once on mount and every 60s. Clears the interval on logout/unmount so we
  // never hit the authed endpoint as an anonymous user.
  useEffect(() => {
    if (!isLogin) return;
    dispatch(fetchUnreadCount());
    const id = setInterval(() => dispatch(fetchUnreadCount()), 60000);
    return () => clearInterval(id);
  }, [isLogin, dispatch]);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleMenu = (event) => { event.stopPropagation(); setAnchorEl(event.currentTarget); };
  const handleClose = () => setAnchorEl(null);

  // The one search entry point in the chrome. The palette already owns the
  // global Cmd/Ctrl+K hotkey and the result list, so the navbar only fires its
  // existing open event rather than growing a second copy of that logic.
  const openSearch = () => window.dispatchEvent(new CustomEvent("open-command-palette"));

  const handleLogout = async () => {
    // Unified logout: clears the refresh cookie (server), Firebase session,
    // and local auth state, then syncs the Redux store.
    await logout();
    dispatch(authActions.logout());
    toastLogout();
    navigate("/");
  };

  // Profile dropdown items. Each carries its own icon; Analytics is
  // writer/admin-only. Logout is rendered separately below a divider.
  // All entries route through `go` (useRequireAuth) so an anonymous click
  // is bounced to /login with a redirect-back param, matching the footer.
  // The theme switch lives here (not in the bar) so the capsule's right side
  // stays Search · Sign In · avatar — it is also still reachable from the
  // palette's own theme action.
  const menuItems = [
    { icon: <AccountCircleIcon fontSize="small" />, label: "Profile", onClick: () => go("/profile") },
    { icon: <NotificationsIcon fontSize="small" />, label: "Notifications", onClick: () => go("/notifications") },
    { icon: <BookmarkBorderIcon fontSize="small" />, label: "Bookmarks", onClick: () => go("/bookmarks") },
    { icon: <HistoryIcon fontSize="small" />, label: "Reading History", onClick: () => go("/reading-history") },
    { icon: <BarChartIcon fontSize="small" />, label: "Analytics", onClick: () => go("/analytics"), show: user?.role === "Writer" || user?.role === "Admin" },
    { icon: <LeaderboardRoundedIcon fontSize="small" />, label: "Leaderboard", onClick: () => go("/leaderboard") },
    { icon: <ArticleIcon fontSize="small" />, label: "My Blogs", onClick: () => go("/my-blogs") },
    { icon: <PostAddIcon fontSize="small" />, label: "Create Blog", onClick: () => go("/create-blog") },
    {
      icon: theme === "dark" ? <Brightness5Icon fontSize="small" /> : <NightsStayIcon fontSize="small" />,
      label: theme === "dark" ? "Light mode" : "Dark mode",
      onClick: toggleTheme,
    },
  ];

  // The drawer's session-gated shortcuts. `auth` gates the rows that need a
  // session, Analytics additionally needs Writer/Admin, and Contact is always
  // shown. Rendering them from one list keeps every row identical rather than
  // seven copy-pasted blocks.
  const drawerLinks = [
    { label: "Profile", path: "/profile", Icon: AccountCircleIcon, auth: true },
    { label: "My Blogs", path: "/my-blogs", Icon: ArticleIcon, auth: true },
    { label: "Notifications", path: "/notifications", Icon: NotificationsIcon, auth: true },
    { label: "Bookmarks", path: "/bookmarks", Icon: BookmarkBorderIcon, auth: true },
    { label: "Reading History", path: "/reading-history", Icon: HistoryIcon, auth: true },
    { label: "Analytics", path: "/analytics", Icon: BarChartIcon, auth: true, show: user?.role === "Writer" || user?.role === "Admin" },
    { label: "Contact", path: "/contact", Icon: MailOutlineRoundedIcon },
  ];

  // Routes whose page canvas is the editorial `.ink` surface. The bar is
  // sticky and sits ABOVE the page, so its own band is not covered by that
  // canvas — and since the bar is transparent, the app's body background
  // shows through it instead. Painting the band with `--ink-bg` on exactly
  // these routes keeps the capsule floating on the page it belongs to, and
  // leaves every other page's chrome untouched. The token resolves per
  // theme, so this single rule covers both light and dark.
  //
  // Note this is a route list, not a "does the page use ink" test: Edit Blog
  // (`/edit-blog/:id`) renders its own editor chrome and must NOT be added
  // here, even though the nav's "Write" item matches both routes.
  //
  // Explore is reachable by three paths (`/explore`, `/blogs`, `/category`),
  // which is why it is matched by prefix rather than equality.
  const onEditorialPage =
    location.pathname === "/" ||
    location.pathname === "/about" ||
    location.pathname === "/profile" ||
    location.pathname === "/create-blog" ||
    location.pathname === "/notifications" ||
    location.pathname === "/reading-history" ||
    location.pathname === "/bookmarks" ||
    location.pathname === "/rewards" ||
    location.pathname.startsWith("/explore") ||
    location.pathname.startsWith("/blogs") ||
    location.pathname.startsWith("/category") ||
    location.pathname.startsWith("/leaderboard");

  return (
    <AppBar
      position="sticky"
      elevation={0}
      // The bar itself opts into the shared tokens (`ink-nav`, exactly as the
      // capsule below it does). It has to carry the class in its own right: it
      // is an ANCESTOR of the capsule, so without it `var(--ink-bg)` below
      // would be undefined here and the declaration would fall back to
      // transparent.
      className="ink-nav"
      // Neutralize the global glass-AppBar override so the floating capsule is
      // the only glass surface (the bar itself is otherwise transparent). The
      // default appBar z-index is left alone deliberately — lowering it to a
      // hand-picked value would let sticky page rails paint over the chrome.
      sx={{
        top: 0,
        bgcolor: onEditorialPage ? "var(--ink-bg) !important" : "transparent !important",
        backgroundImage: "none !important",
        boxShadow: "none !important",
        borderBottom: "none !important",
        backdropFilter: "none !important",
        WebkitBackdropFilter: "none !important",
      }}
    >
      {/* Ambient wash behind the capsule. Two barely-there orange blooms, one
          under the brand and one under the account end, so the chrome sits in
          a pool of its own light instead of on a flat band. Decorative only. */}
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            // Sized in explicit px so the bloom finishes fading INSIDE the
            // bar's own box — a percentage radius reaches for the far corner
            // and gets clipped flat at the bar's edge, which reads as a stray
            // orange band rather than a glow.
            "radial-gradient(ellipse 420px 52px at 22% 50%, rgba(255,106,0,0.10), transparent 72%)," +
            "radial-gradient(ellipse 360px 48px at 80% 50%, rgba(255,106,0,0.07), transparent 70%)",
        }}
      />

      {/* max-width 1440, inset 24/16px, centred — the capsule never spans the
          viewport, which is what separates this from a stock app bar. */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          width: { xs: "calc(100% - 32px)", md: "calc(100% - 48px)" },
          maxWidth: 1440,
          mx: "auto",
        }}
      >
        <motion.div
          initial={{ y: -18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* `ink-nav` pulls the InkWell token block (.ink-nav in
              styles/inkwell.css) onto the capsule, so every colour below —
              text, border, orange accent — resolves from the design system
              rather than the app's light MUI theme.

              GEOMETRY IS LOAD-BEARING: the capsule's outer height is fixed at
              12 + 60 (xs) / 76 (md) px, so its bottom edge lands at 88px when
              pinned. Explore's sticky rail (`.ink-explore-aside`) and the blog
              ToC scroll offset are tuned against that number — retune them
              together if this changes. */}
          <Toolbar
            disableGutters
            className="ink-nav"
            sx={{
              position: "relative",
              overflow: "hidden",
              mt: 1.5,
              mb: 1.5,
              px: { xs: 1.25, sm: 1.75, md: 2 },
              height: { xs: 60, md: 76 },
              minHeight: 0,
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: { xs: 0.5, md: 1.5 },
              bgcolor: PILL_BG,
              color: "var(--ink-text)",
              backdropFilter: scrolled ? "blur(20px)" : "blur(16px)",
              WebkitBackdropFilter: scrolled ? "blur(20px)" : "blur(16px)",
              border: "1px solid var(--ink-border)",
              boxShadow: scrolled
                ? "var(--ink-shadow)"
                : "var(--ink-shadow-card)",
              transition: "box-shadow .35s ease, backdrop-filter .35s ease, -webkit-backdrop-filter .35s ease",
              // Hairline top highlight: lifts the capsule off the page without
              // reaching for heavy glassmorphism. `& > *` keeps every real child
              // above the sheen so it tints the surface, never the content.
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                zIndex: 0,
                borderRadius: "inherit",
                background: "linear-gradient(180deg, var(--ink-wash), transparent 42%)",
                pointerEvents: "none",
              },
              "& > *": { position: "relative", zIndex: 1 },
            }}
          >
            {/* ── Brand ────────────────────────────────────────────────── */}
            <Box
              onClick={() => navigate("/")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate("/"); }
              }}
              role="button"
              aria-label="InkWell — go to home"
              tabIndex={0}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 1, md: 1.25 },
                cursor: "pointer",
                flexShrink: 0,
                borderRadius: 999,
                transition: "opacity .2s ease",
                "&:hover": { opacity: 0.9 },
              }}
            >
              {/* Circular badge — the real brand glyph (QuillGlyph, the same
                  path the logo component draws) in a lit well, rather than a
                  second logo invented for the navbar. */}
              <Box
                aria-hidden="true"
                sx={{
                  position: "relative",
                  width: { xs: 44, md: 52 },
                  height: { xs: 44, md: 52 },
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  bgcolor: "var(--ink-wash)",
                  border: "1px solid var(--ink-border)",
                  boxShadow: "0 0 22px rgba(255,106,0,0.16), inset 0 1px 0 var(--ink-wash-2)",
                }}
              >
                <QuillGlyph sx={{ width: { xs: 21, md: 24 }, height: { xs: 21, md: 24 }, color: "var(--ink-text)" }} />
                <Box
                  component="span"
                  sx={{
                    position: "absolute",
                    right: { xs: 3, md: 5 },
                    bottom: { xs: 3, md: 5 },
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: "var(--ink-orange)",
                    boxShadow: "0 0 8px rgba(255,106,0,0.75)",
                  }}
                />
              </Box>

              {/* Wordmark + tagline come from the shared brand component so the
                  "Ink/wel" split lives in one place. Two overrides are still
                  needed here: this chrome is always dark, so the wordmark takes
                  the canvas text token rather than the component's pure white,
                  and the tagline takes the decorative grey rather than its
                  72%-white. On phones the wordmark alone carries the brand and
                  the tagline drops out to keep the row on one line. */}
              <BrandLogo
                variant="wordmark"
                size={46}
                tone="light"
                showTagline
                tagline="Write · Share · Inspire"
                sx={{
                  lineHeight: 1,
                  minWidth: 0,
                  "& p:first-of-type": { color: "var(--ink-text)", fontSize: "21px" },
                  "& p:last-of-type": {
                    display: { xs: "none", md: "block" },
                    color: "var(--ink-text-3-decor)",
                    fontSize: "9px",
                    letterSpacing: "2px",
                    mt: 0.5,
                  },
                  "& span": { color: "var(--ink-orange) !important" },
                }}
              />
            </Box>

            {/* ── Primary navigation ───────────────────────────────────── */}
            <Stack
              direction="row"
              spacing={0.5}
              // flexShrink 0: the nav labels are the one thing that must never
              // be clipped. At the lg breakpoint (1200px) the capsule is at its
              // tightest, and the search field — not the nav — yields the few
              // px of slack (see flexShrink on the actions group below).
              sx={{ flexGrow: 1, flexShrink: 0, justifyContent: "center", display: { xs: "none", lg: "flex" } }}
            >
              {NAV_ITEMS.map((item) => {
                const active = item.match(location.pathname);
                return (
                  <Button
                    key={item.label}
                    startIcon={<item.Icon />}
                    sx={navBtnSx(active)}
                    aria-current={active ? "page" : undefined}
                    onClick={() => go(item.path)}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Stack>

            {/* ── Search · auth ─────────────────────────────────────────── */}
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, md: 1 }, flexShrink: 1, minWidth: 0 }}>
              {/* Compact search shell. It opens the existing command palette
                  rather than carrying its own index — the palette already owns
                  the hotkey, the result list and the empty state. */}
              <Box
                component="button"
                type="button"
                onClick={openSearch}
                aria-label="Search articles, topics and writers"
                sx={{
                  display: { xs: "none", md: "flex" },
                  alignItems: "center",
                  gap: 1,
                  // Fluid rather than stepped: the capsule has to hold the
                  // brand, five nav items and this field on one line from
                  // 1200px up, and the field is the only part with slack.
                  width: "clamp(250px, 23vw, 340px)",
                  flexShrink: 1,
                  minWidth: 180,
                  height: 44,
                  px: 1.75,
                  borderRadius: 999,
                  bgcolor: "var(--ink-wash)",
                  border: "1px solid var(--ink-border-soft)",
                  font: "inherit",
                  textAlign: "left",
                  cursor: "pointer",
                  color: "inherit",
                  transition: "border-color .17s ease, background-color .17s ease",
                  "&:hover": {
                    borderColor: "var(--ink-border-warm)",
                    backgroundColor: "var(--ink-wash)",
                  },
                  "&:focus-visible": { outline: "2px solid var(--ink-orange)", outlineOffset: 2 },
                }}
              >
                <SearchRoundedIcon sx={{ fontSize: 19, color: "var(--ink-text-2)", flexShrink: 0 }} />
                <Box
                  component="span"
                  sx={{
                    flexGrow: 1,
                    minWidth: 0,
                    fontSize: "0.8rem",
                    color: "var(--ink-text-3-decor)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Search articles, topics, writers...
                </Box>
                <Box component="kbd" sx={KBD_SX}>{isMac ? "⌘" : "Ctrl"} K</Box>
              </Box>

              {/* Phones get the glyph only — the field cannot fit, and the
                  palette is the same destination. */}
              <IconButton
                onClick={openSearch}
                aria-label="Search"
                sx={{
                  display: { xs: "inline-flex", md: "none" },
                  flexShrink: 0,
                  borderRadius: 999,
                  p: 0.75,
                  color: "var(--ink-text-2)",
                  "&:hover": { color: "var(--ink-orange)", backgroundColor: "var(--ink-orange-softer)" },
                }}
              >
                <SearchRoundedIcon />
              </IconButton>

              <Box
                aria-hidden="true"
                sx={{
                  display: { xs: "none", md: "block" },
                  flexShrink: 0,
                  width: "1px",
                  height: 24,
                  bgcolor: "var(--ink-border)",
                  mx: { md: 0.5 },
                }}
              />

              {isLogin && (
                <Box sx={{ display: { xs: "none", md: "block" }, flexShrink: 0 }}>
                  <NotificationBell />
                </Box>
              )}

              {isLogin ? (
                <>
                  <IconButton
                    onClick={handleMenu}
                    aria-label="Account menu"
                    aria-haspopup="true"
                    aria-expanded={anchorEl ? "true" : "false"}
                    sx={{
                      display: { xs: "none", md: "inline-flex" },
                      flexShrink: 0,
                      gap: 0.25,
                      pl: 0.5,
                      pr: 0.75,
                      py: 0.5,
                      borderRadius: 999,
                      border: "1px solid transparent",
                      transition: "background-color .17s ease, border-color .17s ease",
                      "&:hover": {
                        backgroundColor: "var(--ink-orange-softer)",
                        borderColor: "var(--ink-border-warm)",
                      },
                    }}
                  >
                    <UserAvatar
                      src={user?.profile_image}
                      name={user?.username}
                      alt=""
                      sx={{
                        width: 42,
                        height: 42,
                        border: "1px solid var(--ink-border)",
                        transition: "border-color .17s ease, box-shadow .17s ease",
                      }}
                    />
                    <KeyboardArrowDownRoundedIcon
                      sx={{
                        fontSize: 18,
                        color: "var(--ink-text-2)",
                        transition: "transform .17s ease",
                        transform: anchorEl ? "rotate(180deg)" : "none",
                      }}
                    />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                    slotProps={{
                      paper: { className: "ink-nav", sx: { ...POPOVER_SX, mt: 1.5, minWidth: 220 } },
                    }}
                  >
                    {menuItems.filter((item) => item.show !== false).map((item) => (
                      <MenuItem
                        key={item.label}
                        onClick={() => { item.onClick(); handleClose(); }}
                        sx={menuItemSx}
                      >
                        <ListItemIcon sx={{ color: "var(--ink-orange)", minWidth: 36 }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} sx={{ color: "var(--ink-text)" }} />
                      </MenuItem>
                    ))}
                    <Divider sx={{ my: 0.5, borderColor: "var(--ink-border)" }} />
                    {/* Logout stays red on purpose — destructive, not brand. */}
                    <MenuItem onClick={handleLogout} sx={{ ...menuItemSx, color: "error.main" }}>
                      <ListItemIcon sx={{ color: "error.main", minWidth: 36 }}><LogoutIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 600 }} />
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Button
                  onClick={() => navigate("/login")}
                  startIcon={<PersonOutlineRoundedIcon sx={{ fontSize: 19 }} />}
                  sx={{
                    display: { xs: "none", md: "inline-flex" },
                    flexShrink: 0,
                    borderRadius: 999,
                    height: 44,
                    px: 2.25,
                    minWidth: "auto",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.86rem",
                    whiteSpace: "nowrap",
                    color: "var(--ink-text)",
                    border: "1px solid var(--ink-border)",
                    backgroundColor: "transparent",
                    transition: "color .17s ease, border-color .17s ease, background-color .17s ease",
                    "& .MuiButton-startIcon": { color: "var(--ink-text-2)", mr: 0.75, transition: "color .17s ease" },
                    "&:hover": {
                      borderColor: "var(--ink-border-warm)",
                      color: "var(--ink-orange)",
                      backgroundColor: "var(--ink-orange-softer)",
                      "& .MuiButton-startIcon": { color: "var(--ink-orange)" },
                    },
                  }}
                >
                  Sign In
                </Button>
              )}

              <IconButton
                onClick={handleDrawerToggle}
                aria-label="Open navigation menu"
                aria-controls="ink-mobile-nav"
                aria-expanded={mobileOpen ? "true" : "false"}
                sx={{
                  display: { xs: "inline-flex", md: "none" },
                  flexShrink: 0,
                  borderRadius: 999,
                  p: 0.75,
                  color: "var(--ink-text-2)",
                  "&:hover": { color: "var(--ink-orange)", backgroundColor: "var(--ink-orange-softer)" },
                }}
              >
                <MenuRoundedIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </motion.div>
      </Box>

      <Drawer
        id="ink-mobile-nav"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        // MUI 6.4's Drawer does NOT implement `slotProps` — it only accepts
        // `PaperProps` (unlike Menu/Popover/Dialog, which do). Passing
        // slotProps here is silently ignored, which drops the whole paper
        // style: the drawer collapsed to its min-content width (~125px) and,
        // worse, lost the `ink-nav` class that supplies the var(--ink-*)
        // tokens to everything inside the portal.
        PaperProps={{
          className: "ink-nav",
          sx: {
            width: 292,
            p: 2,
            bgcolor: "var(--ink-bg-alt)",
            backgroundImage: "none",
            color: "var(--ink-text)",
            borderRight: "1px solid var(--ink-border)",
            borderRadius: "0 18px 18px 0",
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Box sx={{ px: 1, py: 1, mb: 1.5 }}>
            <BrandLogo
              size={34}
              tone="light"
              showTagline
              tagline="Write · Share · Inspire"
              sx={{
                "& span": { color: "var(--ink-orange) !important" },
                "& p:last-of-type": { color: "var(--ink-text-3-decor)" },
              }}
              onClick={() => { navigate("/"); setMobileOpen(false); }}
            />
          </Box>

          <Stack spacing={0.5} sx={{ flexGrow: 1, overflowY: "auto" }}>
            {NAV_ITEMS.map((item) => {
              const active = item.match(location.pathname);
              return (
                <Button
                  key={item.label}
                  fullWidth
                  startIcon={<item.Icon />}
                  sx={drawerBtnSx(active)}
                  aria-current={active ? "page" : undefined}
                  onClick={() => { go(item.path); setMobileOpen(false); }}
                >
                  {item.label}
                </Button>
              );
            })}

            <Divider sx={{ my: 1, borderColor: "var(--ink-border-soft)" }} />

            {drawerLinks
              .filter((link) => (!link.auth || isLogin) && link.show !== false)
              .map((link) => (
                <Button
                  key={link.path}
                  fullWidth
                  startIcon={<link.Icon />}
                  sx={drawerBtnSx(location.pathname === link.path)}
                  aria-current={location.pathname === link.path ? "page" : undefined}
                  onClick={() => { go(link.path); setMobileOpen(false); }}
                >
                  {link.label}
                </Button>
              ))}

            <Divider sx={{ my: 1, borderColor: "var(--ink-border-soft)" }} />

            {/* The bar's theme switch is desktop-only, so the drawer carries the
                one the phone can actually reach. */}
            <Button
              fullWidth
              startIcon={theme === "dark" ? <Brightness5Icon /> : <NightsStayIcon />}
              sx={drawerBtnSx(false)}
              onClick={toggleTheme}
            >
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </Button>

            {!isLogin && (
              <Button
                fullWidth
                startIcon={<LoginRoundedIcon />}
                sx={drawerBtnSx(false)}
                onClick={() => { navigate("/login"); setMobileOpen(false); }}
              >
                Sign In
              </Button>
            )}
          </Stack>

          {isLogin && (
            <Button
              fullWidth
              startIcon={<LogoutIcon />}
              sx={{ ...drawerBtnSx(false), mt: 1, color: "error.main", "&:hover": { color: "error.main", backgroundColor: "rgba(239,68,68,0.10)" } }}
              onClick={handleLogout}
            >
              Logout
            </Button>
          )}
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Navbar;
