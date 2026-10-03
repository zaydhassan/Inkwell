import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { AppBar, Toolbar, IconButton, Button, MenuItem, Menu, Drawer, Box, Stack, Container, ListItemIcon, ListItemText, Divider } from "@mui/material";
import { motion } from "framer-motion";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import NightsStayIcon from "@mui/icons-material/NightsStay";
import Brightness5Icon from "@mui/icons-material/Brightness5";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import NotificationsIcon from "@mui/icons-material/Notifications";
import HistoryIcon from "@mui/icons-material/History";
import BarChartIcon from "@mui/icons-material/BarChart";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import ArticleIcon from "@mui/icons-material/Article";
import PostAddIcon from "@mui/icons-material/PostAdd";
import LogoutIcon from "@mui/icons-material/Logout";
import { toastLogout } from "../utils/toasts";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import GradientButton from "./GradientButton";
import UserAvatar from "./UserAvatar";
import BrandLogo from "./BrandLogo";
import NotificationBell from "./NotificationBell";
import { authActions, fetchUnreadCount } from "../redux/store";
import useRequireAuth from "../hooks/useRequireAuth";

const NAV_ITEMS = [
  { label: "Home", path: "/", match: (p) => p === "/" },
  // `/blogs` is kept in the match: it is a second path onto the same Explore
  // page (see App.js), so an old link must still light this item up.
  {
    label: "Explore",
    path: "/explore",
    match: (p) => p.startsWith("/explore") || p.startsWith("/blogs") || p.startsWith("/category"),
  },
  { label: "Write", path: "/create-blog", match: (p) => p.startsWith("/create-blog") || p.startsWith("/edit-blog") },
  { label: "Leaderboard", path: "/leaderboard", match: (p) => p.startsWith("/leaderboard") },
  { label: "About", path: "/about", match: (p) => p === "/about" },
];

// The floating pill's surface: the InkWell design system's `--ink-bg-alt`
// (#151311) at 72% alpha. The token itself is opaque, so the alpha lives here
// — the pill has to stay translucent for the page to read through the blur.
// Everything else in this file colours itself from `var(--ink-*)`; the pill is
// the one surface that needs a translucency the CSS file doesn't ship.
const PILL_BG = "rgba(21,19,17,0.72)";

// The shared active treatment for EVERY nav item. Now that the whole nav
// speaks the InkWell orange, the old per-item `accent` special-case (which
// existed only for About) is redundant and gone — every entry behaves the
// same. Deliberately restrained, per the brief: orange type on a soft
// orange-tinted pill, never a giant filled active pill. The 1px transparent
// border is always present so gaining the state never shifts the layout.
// Tint: --ink-orange-soft (rgba(255,106,0,.14)); hover uses the fainter
// --ink-orange-softer, and an already-active item keeps its stronger tint.
const navBtnSx = (active) => ({
  color: active ? "var(--ink-orange)" : "var(--ink-text-2)",
  fontWeight: active ? 700 : 600,
  textTransform: "none",
  borderRadius: 999,
  px: { xs: 1.5, md: 1.75 },
  py: 0.6,
  minWidth: "auto",
  border: "1px solid transparent",
  backgroundColor: active ? "var(--ink-orange-soft)" : "transparent",
  transition: "color .2s ease, background-color .2s ease, border-color .2s ease",
  "&:hover": {
    color: "var(--ink-orange)",
    backgroundColor: active ? "var(--ink-orange-soft)" : "var(--ink-orange-softer)",
  },
});

// The same language for the drawer's vertical rows. One helper covers the nav
// links, the four session-gated shortcuts and Contact, so the drawer has a
// single row style instead of five near-identical blocks.
const drawerBtnSx = (active) => ({
  justifyContent: "flex-start",
  textTransform: "none",
  fontWeight: active ? 700 : 600,
  borderRadius: 2,
  px: 2,
  py: 1.25,
  minHeight: 0,
  color: active ? "var(--ink-orange)" : "var(--ink-text-2)",
  backgroundColor: active ? "var(--ink-orange-soft)" : "transparent",
  "&:hover": {
    color: "var(--ink-orange)",
    backgroundColor: active ? "var(--ink-orange-soft)" : "var(--ink-orange-softer)",
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

  // Scroll-aware elevation: the floating pill gains a soft card shadow and a
  // stronger blur once the page is scrolled, so it reads as lifted over content.
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
  const menuItems = [
    { icon: <AccountCircleIcon fontSize="small" />, label: "Profile", onClick: () => go("/profile") },
    { icon: <NotificationsIcon fontSize="small" />, label: "Notifications", onClick: () => go("/notifications") },
    { icon: <BookmarkBorderIcon fontSize="small" />, label: "Bookmarks", onClick: () => go("/bookmarks") },
    { icon: <HistoryIcon fontSize="small" />, label: "Reading History", onClick: () => go("/reading-history") },
    { icon: <BarChartIcon fontSize="small" />, label: "Analytics", onClick: () => go("/analytics"), show: user?.role === "Writer" || user?.role === "Admin" },
    { icon: <LeaderboardIcon fontSize="small" />, label: "Leaderboard", onClick: () => go("/leaderboard") },
    { icon: <ArticleIcon fontSize="small" />, label: "My Blogs", onClick: () => go("/my-blogs") },
    { icon: <PostAddIcon fontSize="small" />, label: "Create Blog", onClick: () => go("/create-blog") },
  ];

  // The drawer shortcuts that sit under the main nav. `auth` gates the four
  // that need a session, Analytics additionally needs Writer/Admin, and
  // Contact is always shown. Rendering them from one list keeps every row
  // identical rather than five copy-pasted blocks.
  const drawerLinks = [
    { label: "Notifications", path: "/notifications", auth: true },
    { label: "Bookmarks", path: "/bookmarks", auth: true },
    { label: "Reading History", path: "/reading-history", auth: true },
    { label: "Analytics", path: "/analytics", auth: true, show: user?.role === "Writer" || user?.role === "Admin" },
    { label: "Contact", path: "/contact" },
  ];

  // Home, About, Profile and Create Blog are locked to the dark editorial
  // canvas regardless of the app theme (see `.ink` in styles/inkwell.css). The
  // bar is sticky and sits ABOVE the page, so its own band is not covered by
  // that canvas — and since the bar is transparent, the app's body background
  // shows through it. With the app in its (default) light theme that paints a
  // white strip across the top of an otherwise dark page. Painting the band
  // with the canvas colour on exactly these routes keeps the pill floating on
  // the page it belongs to, and leaves every other page's chrome untouched.
  //
  // Note this is a route list, not a "does the page use ink" test: Edit Blog
  // (`/edit-blog/:id`) is still on the light theme and must NOT be added here,
  // even though the nav's "Write" item matches both routes.
  //
  // Explore is on the list for the same reason as Home and About: it is an
  // always-dark editorial page, and it is reachable by three paths.
  const onEditorialPage =
    location.pathname === "/" ||
    location.pathname === "/about" ||
    location.pathname === "/profile" ||
    location.pathname === "/create-blog" ||
    location.pathname.startsWith("/explore") ||
    location.pathname.startsWith("/blogs") ||
    location.pathname.startsWith("/category");

  return (
    <AppBar
      position="sticky"
      elevation={0}
      // The bar itself opts into the shared tokens (`ink-nav`, exactly as the
      // pill below it does). It has to carry the class in its own right: it is
      // an ANCESTOR of the pill, so without it `var(--ink-bg)` below would be
      // undefined here and the declaration would fall back to transparent.
      className="ink-nav"
      // Neutralize the global glass-AppBar override so the floating pill below
      // is the only glass surface (the bar itself is otherwise transparent).
      sx={{
        bgcolor: onEditorialPage ? "var(--ink-bg) !important" : "transparent !important",
        backgroundImage: "none !important",
        boxShadow: "none !important",
        borderBottom: "none !important",
        backdropFilter: "none !important",
        WebkitBackdropFilter: "none !important",
      }}
    >
      <Container maxWidth="lg" disableGutters sx={{ px: { xs: 1, md: 2.5 } }}>
        <motion.div
          initial={{ y: -18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* `ink-nav` pulls the InkWell token block (.ink-nav in
              styles/inkwell.css) onto the pill, so every colour below — text,
              border, orange accent — resolves from the design system rather
              than the app's light MUI theme. */}
          <Toolbar
            disableGutters
            className="ink-nav"
            sx={{
              // The pill compacts slightly once the page scrolls: less outer
              // margin, tighter padding, a stronger blur and a deeper shadow.
              my: scrolled ? { xs: 0.6, md: 0.85 } : { xs: 1.25, md: 1.75 },
              px: { xs: 1, sm: 1.5, md: 2 },
              py: scrolled ? 0.4 : 0.75,
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: { xs: 0.75, sm: 1.5 },
              // A hard-dark translucent surface carrying its own light palette,
              // so the pill reads as brand chrome over any page.
              bgcolor: PILL_BG,
              color: "var(--ink-text)",
              backdropFilter: scrolled ? "blur(18px)" : "blur(14px)",
              WebkitBackdropFilter: scrolled ? "blur(18px)" : "blur(14px)",
              border: "1px solid var(--ink-border)",
              boxShadow: scrolled
                ? "0 16px 44px rgba(0,0,0,0.46)"
                : "0 10px 34px rgba(0,0,0,0.34)",
              transition:
                "box-shadow .35s ease, margin .35s ease, padding .35s ease, backdrop-filter .35s ease, -webkit-backdrop-filter .35s ease",
            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ display: { md: "none" }, p: { xs: 0.5, sm: 1 }, color: "var(--ink-text-2)", "&:hover": { color: "var(--ink-orange)", backgroundColor: "var(--ink-orange-softer)" } }}
              onClick={handleDrawerToggle}
            >
              <MenuIcon />
            </IconButton>

            <Box
              onClick={() => navigate("/")}
              role="button"
              aria-label="Inkwell home"
              tabIndex={0}
              sx={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                borderRadius: 2,
                p: 0.5,
                transition: "opacity .2s ease, transform .2s ease",
                "&:hover": { opacity: 0.92, transform: "translateY(-1px)" },
              }}
            >
              <BrandLogo
                size={38}
                // Dark panel: the wordmark goes white.
                tone="light"
                sx={{
                  // Below `sm` the wordmark is dropped so the badge alone carries
                  // the brand: the mobile row (menu + mark + search + Sign In +
                  // Get Started) otherwise needs ~470px and forces every page in
                  // the app into horizontal scroll on a phone.
                  "& > *:nth-of-type(2)": { display: { xs: "none", sm: "block" } },
                  // BrandLogo paints the "well" half of the wordmark with the
                  // light theme's --accent (charcoal), which disappears on this
                  // dark pill — force it to the InkWell orange instead.
                  "& span": { color: "var(--ink-orange) !important" },
                }}
              />
            </Box>

            <Stack direction="row" spacing={0.5} sx={{ flexGrow: 1, justifyContent: "center", display: { xs: "none", md: "flex" } }}>
              {NAV_ITEMS.map((item) => {
                const active = item.match(location.pathname);
                return (
                  <Button key={item.label} sx={navBtnSx(active)} onClick={() => go(item.path)}>
                    {item.label}
                  </Button>
                );
              })}
            </Stack>

            {/* Spacer keeps the actions right-aligned on mobile when the nav row is hidden. */}
            <Box sx={{ flexGrow: 1, display: { xs: "block", md: "none" } }} />

            <Drawer
              anchor="left"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              // MUI 6.4's Drawer does NOT implement `slotProps` — it only accepts
              // `PaperProps` (unlike Menu/Popover/Dialog, which do). Passing
              // slotProps here is silently ignored, which drops the whole paper
              // style: the drawer collapsed to its min-content width (~125px)
              // and, worse, lost the `ink-nav` class that supplies the
              // var(--ink-*) tokens to everything inside the portal.
              PaperProps={{
                className: "ink-nav",
                sx: {
                  width: 280,
                  p: 2.5,
                  bgcolor: "var(--ink-bg-alt)",
                  backgroundImage: "none",
                  color: "var(--ink-text)",
                  borderRight: "1px solid var(--ink-border)",
                },
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <Box sx={{ px: 1, py: 1, mb: 2 }}>
                  <BrandLogo
                    size={34}
                    tone="light"
                    sx={{ "& span": { color: "var(--ink-orange) !important" } }}
                    onClick={() => { navigate("/"); setMobileOpen(false); }}
                  />
                </Box>
                <Stack spacing={0.5} sx={{ flexGrow: 1 }}>
                  {NAV_ITEMS.map((item) => {
                    const active = item.match(location.pathname);
                    return (
                      <Button
                        key={item.label}
                        fullWidth
                        sx={drawerBtnSx(active)}
                        onClick={() => go(item.path)}
                      >
                        {item.label}
                      </Button>
                    );
                  })}
                  {drawerLinks
                    .filter((link) => (!link.auth || isLogin) && link.show !== false)
                    .map((link) => (
                      <Button
                        key={link.path}
                        fullWidth
                        sx={drawerBtnSx(location.pathname === link.path)}
                        onClick={() => { go(link.path); setMobileOpen(false); }}
                      >
                        {link.label}
                      </Button>
                    ))}
                </Stack>
              </Box>
            </Drawer>

            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.25, sm: 0.75 }, color: "var(--ink-text-2)" }}>
              <IconButton
                onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
                color="inherit"
                aria-label="Search (⌘K)"
                sx={{ borderRadius: 999, p: { xs: 0.75, sm: 1 }, color: "var(--ink-text-2)", "&:hover": { color: "var(--ink-orange)", backgroundColor: "var(--ink-orange-softer)" } }}
              >
                <SearchIcon />
              </IconButton>
              {isLogin && (
                <>
                  <NotificationBell />
                  <IconButton
                    onClick={() => go("/bookmarks")}
                    color="inherit"
                    aria-label="Bookmarks"
                    sx={{ borderRadius: 999, color: "var(--ink-text-2)", "&:hover": { color: "var(--ink-orange)", backgroundColor: "var(--ink-orange-softer)" } }}
                  >
                    <BookmarkBorderIcon />
                  </IconButton>
                  <IconButton
                    onClick={toggleTheme}
                    color="inherit"
                    aria-label="Toggle light/dark theme"
                    sx={{ borderRadius: 999, color: "var(--ink-text-2)", "&:hover": { color: "var(--ink-orange)", backgroundColor: "var(--ink-orange-softer)" } }}
                  >
                    {theme === "light" ? <Brightness5Icon /> : <NightsStayIcon />}
                  </IconButton>
                  <IconButton
                    onClick={handleMenu}
                    aria-label="Account menu"
                    sx={{ p: 0, borderRadius: 999, "&:hover": { backgroundColor: "var(--ink-orange-softer)" } }}
                  >
                    <UserAvatar
                      src={user?.profile_image}
                      name={user?.username}
                      alt="Profile"
                      sx={{ width: 40, height: 40, border: "2px solid var(--ink-border-warm)" }}
                    />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                    slotProps={{
                      paper: {
                        className: "ink-nav",
                        sx: {
                          mt: 1.5,
                          borderRadius: 3,
                          overflow: "hidden",
                          minWidth: 220,
                          bgcolor: "var(--ink-bg-alt)",
                          backgroundImage: "none",
                          color: "var(--ink-text)",
                          border: "1px solid var(--ink-border)",
                          boxShadow: "0 18px 44px rgba(0,0,0,0.5)",
                        },
                      },
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
              )}
              {!isLogin && (
                <>
                  <Button
                    onClick={() => navigate("/login")}
                    sx={{
                      borderRadius: 999,
                      px: { xs: 1, md: 2.25 },
                      py: 0.9,
                      minHeight: 0,
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: { xs: "0.8rem", md: "0.85rem" },
                      whiteSpace: "nowrap",
                      color: "var(--ink-text-2)",
                      "&:hover": { color: "var(--ink-orange)", backgroundColor: "var(--ink-orange-softer)" },
                    }}
                  >
                    Sign In
                  </Button>
                  {/* Same GradientButton primitive, repainted to the InkWell
                      orange CTA — the theme's gradient variant is a charcoal
                      gradient that would read as a hole on the dark pill. */}
                  <GradientButton
                    onClick={() => navigate("/register")}
                    sx={{
                      borderRadius: 999,
                      px: { xs: 1.25, md: 2.75 },
                      py: 0.9,
                      minHeight: 0,
                      fontWeight: 700,
                      fontSize: { xs: "0.8rem", md: "0.85rem" },
                      letterSpacing: "0.01em",
                      whiteSpace: "nowrap",
                      background: "var(--ink-orange)",
                      backgroundImage: "none",
                      color: "#17110C",
                      boxShadow: "0 10px 28px rgba(255,106,0,0.28)",
                      "&:hover": {
                        background: "var(--ink-orange-2)",
                        backgroundImage: "none",
                        boxShadow: "0 16px 38px rgba(255,106,0,0.4)",
                      },
                    }}
                  >
                    Get Started
                  </GradientButton>
                </>
              )}
            </Box>
          </Toolbar>
        </motion.div>
      </Container>
    </AppBar>
  );
};

export default Navbar;
