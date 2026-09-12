import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Box,
  Stack,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  Button,
  Container,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  NightsStay as NightsStayIcon,
  Brightness5 as Brightness5Icon,
  ErrorOutline as ErrorOutlineIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Diversity3 as Diversity3Icon,
  Public as PublicIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { authActions } from "../redux/store";
import { setAccessToken } from "../utils/auth";
import { validateEmail, validatePassword, validateFields } from "../utils/validate";
import { toastLogin } from "../utils/toasts";
import { signInWithGoogle } from "../firebase/googleAuth";
import GoogleSignInButton from "../components/GoogleSignInButton";
import LoginIllustration from "../components/LoginIllustration";
import { useColorMode } from "../context/ThemeContext";

/* ─────────────────────────────────────────────────────────────────────
   InkWell — Sign in.

   A premium editorial login: story-led left panel (brand, benefits, an
   original vector illustration, a quiet quote) beside a lightweight auth
   card, over a warm white canvas with barely-there orange atmosphere.

   This page carries its OWN warm-orange accent system (scoped locally —
   the rest of the app is charcoal), per the redesign brief. Authentication
   logic is untouched: /api/v1/user/login, Google OAuth, token handling,
   redirect params, and admin routing all behave exactly as before.
   ───────────────────────────────────────────────────────────────────── */

// Page-scoped brand accent (warm orange family only — no violet/blue).
const ORANGE = {
  main: "#EA580C",
  light: "#F97316",
  deep: "#C2410C",
  soft: "rgba(234,88,12,0.12)",
  softer: "rgba(234,88,12,0.06)",
  ring: "0 0 0 4px rgba(234,88,12,0.12)",
};
const EASE = [0.22, 1, 0.36, 1];
const FONT_DISPLAY = '"Plus Jakarta Sans", "Inter", system-ui, sans-serif';

// Staggered entrance choreography.
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};
const rise = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};

/* ── Local brand mark — orange feather badge + wordmark ───────────── */
const FeatherMark = ({ size = 26 }) => (
  <Box
    component="svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    sx={{ width: size * 0.55, height: size * 0.55 }}
    aria-hidden="true"
  >
    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
    <line x1="16" y1="8" x2="2" y2="22" />
    <line x1="17.5" y1="15" x2="9" y2="15" />
  </Box>
);

const BrandMark = () => (
  <motion.div variants={rise}>
    <Stack direction="row" spacing={1.2} alignItems="center">
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: "13px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${ORANGE.light}, ${ORANGE.main} 55%, ${ORANGE.deep})`,
          boxShadow: "0 6px 18px rgba(234,88,12,0.30)",
        }}
      >
        <FeatherMark />
      </Box>
      <Typography
        sx={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 800,
          fontSize: "1.45rem",
          letterSpacing: "-0.02em",
          color: "text.primary",
          lineHeight: 1,
        }}
      >
        Ink<span style={{ color: ORANGE.main }}>well</span>
      </Typography>
    </Stack>
  </motion.div>
);

/* ── Benefit row — editorial list, deliberately not a card ────────── */
const BENEFITS = [
  { icon: EditIcon, title: "Keep writing", body: "Your ideas matter." },
  { icon: Diversity3Icon, title: "Grow your network", body: "Connect with like-minded people." },
  { icon: PublicIcon, title: "Make an impact", body: "Reach readers around the world." },
];

const BenefitItem = ({ icon: Icon, title, body }) => (
  <motion.div variants={rise}>
    <Stack direction="row" spacing={2} alignItems="flex-start">
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          bgcolor: ORANGE.softer,
          border: "1px solid rgba(234,88,12,0.14)",
          color: ORANGE.main,
        }}
      >
        <Icon sx={{ fontSize: 19 }} />
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "text.primary", letterSpacing: "0.01em" }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
          {body}
        </Typography>
      </Box>
    </Stack>
  </motion.div>
);

/* ── GitHub mark (vector, official path) ──────────────────────────── */
const GitHubMark = ({ size = 20 }) => (
  <Box
    component="svg"
    viewBox="0 0 16 16"
    sx={{ width: size, height: size, flexShrink: 0 }}
    aria-hidden="true"
  >
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"
    />
  </Box>
);

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { toggleTheme, isDarkMode } = useColorMode();
  const [inputs, setInputs] = useState({ email: "", password: "" });

  const [showPassword, setShowPassword] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});
  // idle → submitting → success (checkmark) → navigate
  const [status, setStatus] = useState("idle");

  const setFieldError = (field, msg) =>
    setErrors((prev) => {
      const next = { ...prev };
      if (msg) next[field] = msg;
      else delete next[field];
      return next;
    });

  const handleChange = (e) =>
    setInputs((prevState) => ({ ...prevState, [e.target.name]: e.target.value }));

  const handleTogglePassword = () => setShowPassword(!showPassword);

  const showError = (message) => {
    setBannerMessage(message);
    setShowBanner(true);
    setTimeout(() => setShowBanner(false), 5000);
  };

  const handleGoogle = () => {
    setIsGoogleLoading(true);
    signInWithGoogle({
      dispatch,
      navigate,
      onError: showError,
    }).finally(() => setIsGoogleLoading(false));
  };

  const handleGithub = () => {
    // GitHub OAuth has no backend route yet — keep the door visible but honest.
    toast("GitHub sign-in is coming soon.", { icon: "🐙" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate before hitting the network. Login is lenient on password
    // length (legacy users may have shorter passwords) — only require it.
    const found = validateFields(inputs, {
      email: (v) => validateEmail(v),
      password: (v) => validatePassword(v, { min: 1 }),
    });
    setErrors(found || {});
    if (found) return;
    setStatus("submitting");
    try {
      const { data } = await axios.post("/api/v1/user/login", {
        email: inputs.email,
        password: inputs.password,
      });

      if (data.success) {
        // Store the short-lived access token; the refresh token is already
        // set as an httpOnly cookie by the server. data.user is a safe
        // object (no password hash).
        setAccessToken(data.accessToken);
        localStorage.setItem("userId", data.user._id);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("userRole", data.user.role);

        dispatch(authActions.login(data.user));

        // Unique welcome toast — personalized with the user's name.
        toastLogin(data.user?.username || data.user?.name);

        // Brief success-checkmark beat, then land. Honor a `?redirect=`
        // param (set by the auth guard) so users land back where they were
        // headed; admins always go to the admin console regardless.
        setStatus("success");
        const redirect = searchParams.get("redirect");
        const target =
          data.user.role === "Admin"
            ? "/admin"
            : redirect || "/";
        setTimeout(() => navigate(target), 750);
        return;
      } else {
        showError(data.message || "Login failed! Please try again.");
      }
    } catch (error) {
      showError("Login failed! Please try again.");
    } finally {
      setStatus((s) => (s === "success" ? s : "idle"));
    }
  };

  /* ── Shared field chrome: orange focus ring, soft warm-red error state.
     Errors stay quiet — a muted border tint plus a compact inline message —
     and the helper row keeps its height (`" "` fallback) so the layout
     never jumps when validation appears or clears. ── */
  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      backgroundColor: "background.paper",
      transition: "box-shadow .25s ease, border-color .25s ease",
      "& .MuiOutlinedInput-notchedOutline": { borderColor: "divider" },
      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: ORANGE.light },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: ORANGE.main },
      "&.Mui-focused": { boxShadow: ORANGE.ring },
      "&.Mui-error .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(220,38,38,0.55)" },
      "&.Mui-error.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#DC2626" },
    },
    "& .MuiFormHelperText-root.Mui-error": {
      color: "rgba(220,38,38,0.85)",
      fontSize: "0.72rem",
      fontWeight: 500,
      mt: 0.5,
      ml: 0.5,
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      lineHeight: 1.4,
    },
  };

  // Compact inline error for a helperText slot — the icon+message pair styled
  // entirely by fieldSx above. Reserving " " when empty keeps field heights stable.
  const fieldErrorText = (message) =>
    message ? (
      <>
        <ErrorOutlineIcon sx={{ fontSize: 13 }} />
        {message}
      </>
    ) : (
      " "
    );

  return (
    <Box
      sx={(t) => ({
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        backgroundColor: t.palette.mode === "dark" ? "#141210" : "#FFFDFA",
        color: "text.primary",
      })}
    >
      {/* ── Ambient background: glows, curved lines, ghost feathers ── */}
      <Box aria-hidden sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <Box
          sx={{
            position: "absolute",
            width: 640, height: 640, top: -220, left: -160, borderRadius: "50%",
            background: `radial-gradient(circle, ${ORANGE.softer}, transparent 65%)`,
            filter: "blur(60px)",
          }}
        />
        <Box
          sx={(t) => ({
            position: "absolute",
            width: 560, height: 560, bottom: -240, right: -180, borderRadius: "50%",
            background: `radial-gradient(circle, ${t.palette.mode === "dark" ? "rgba(234,88,12,0.10)" : ORANGE.softer}, transparent 65%)`,
            filter: "blur(64px)",
          })}
        />
        {/* Abstract curved lines */}
        <Box
          component="svg"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: { xs: 0.35, md: 0.7 } }}
        >
          <path d="M-60 240 C 320 140, 520 420, 900 330 S 1380 120, 1560 240" fill="none" stroke="#EAD9C4" strokeOpacity="0.28" strokeWidth="1.5" />
          <path d="M-80 760 C 300 640, 640 860, 1020 740 S 1400 560, 1560 660" fill="none" stroke="#EAD9C4" strokeOpacity="0.22" strokeWidth="1.5" />
          <path d="M980 -60 C 900 220, 1180 320, 1440 260" fill="none" stroke="#F3CFA8" strokeOpacity="0.3" strokeWidth="1.5" />
        </Box>
        {/* Ghost feather outlines */}
        <FeatherGhost sx={{ position: "absolute", top: "12%", right: "6%", width: 150, opacity: 0.07, transform: "rotate(-24deg)" }} />
        <FeatherGhost sx={{ position: "absolute", bottom: "8%", left: "4%", width: 110, opacity: 0.06, transform: "rotate(140deg)" }} />
      </Box>

      <Container
        maxWidth="lg"
        sx={{ position: "relative", zIndex: 1, px: { xs: 2.5, sm: 4 } }}
      >
        {/* ── Top chrome: theme toggle (left) + back home (right) ── */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: { xs: 2.5, md: 3.5 } }}>
          <Tooltip title="Toggle theme" arrow>
            <IconButton
              onClick={toggleTheme}
              size="small"
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              sx={{
                width: 34,
                height: 34,
                color: "text.secondary",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "10px",
                transition: "color .2s ease, border-color .2s ease",
                "&:hover": { color: ORANGE.main, borderColor: ORANGE.light },
              }}
            >
              {isDarkMode ? <Brightness5Icon sx={{ fontSize: 16 }} /> : <NightsStayIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>
          <Button
            component={Link}
            to="/"
            disableRipple
            sx={{
              color: "text.secondary",
              fontWeight: 600,
              textTransform: "none",
              fontSize: "0.9rem",
              px: 1.5,
              transition: "color .2s ease",
              "& .nav-arrow": { transition: "transform .25s ease" },
              "&:hover": { color: ORANGE.main, backgroundColor: "transparent" },
              "&:hover .nav-arrow": { transform: "translateX(3px)" },
            }}
            endIcon={<ArrowForwardIcon className="nav-arrow" sx={{ fontSize: 18 }} />}
          >
            Back to Home
          </Button>
        </Stack>

        {/* ── Main split — centers in the viewport and compresses on short
               laptop screens so the whole experience fits without scrolling ── */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 5, md: 8 }}
          alignItems="center"
          sx={{
            py: { xs: 4, md: 6 },
            minHeight: { md: "calc(100vh - 96px)" },
            display: { md: "flex" },
            alignItems: { md: "center" },
            "@media (max-height: 860px)": {
              py: { md: 3 },
              minHeight: { md: "auto" },
            },
          }}
        >
          {/* ══ LEFT — brand story ══ */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            style={{ flex: 1.05, width: "100%" }}
          >
            <Stack spacing={0} sx={{ maxWidth: 520, mx: { xs: "auto", md: 0 } }}>
              <BrandMark />

              <motion.div variants={rise}>
                <Typography
                  sx={{
                    mt: { xs: 4, md: 5 },
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    color: ORANGE.main,
                    textTransform: "uppercase",
                  }}
                >
                  Write&nbsp;&nbsp;•&nbsp;&nbsp;Share&nbsp;&nbsp;•&nbsp;&nbsp;Inspire
                </Typography>
              </motion.div>

              <motion.div variants={rise}>
                <Typography
                  variant="h1"
                  sx={{
                    mt: 1.5,
                    fontFamily: FONT_DISPLAY,
                    fontWeight: 800,
                    fontSize: { xs: "2.4rem", sm: "2.85rem", md: "3.2rem" },
                    lineHeight: 1.1,
                    letterSpacing: "-0.025em",
                    color: "text.primary",
                  }}
                >
                  Welcome back
                  <br />
                  to <Box component="span" sx={{ color: ORANGE.main }}>Inkwell</Box>
                </Typography>
              </motion.div>

              <motion.div variants={rise}>
                <Typography
                  sx={{
                    mt: 2.5,
                    fontSize: "1.02rem",
                    lineHeight: 1.7,
                    color: "text.secondary",
                    maxWidth: 460,
                  }}
                >
                  Sign in to continue your writing journey, connect with amazing
                  creators, and explore stories that inspire.
                </Typography>
              </motion.div>

              {/* Benefits — desktop only keeps mobile light */}
              <Stack
                spacing={2.75}
                sx={{ mt: { xs: 0, md: 5 }, display: { xs: "none", md: "flex" } }}
              >
                {BENEFITS.map((b) => (
                  <BenefitItem key={b.title} {...b} />
                ))}
              </Stack>

              {/* Illustration — an in-flow block with a hard max-width so it
                  can never overflow or collide; the quote sits BELOW it in
                  normal flow (no absolute positioning → no overlap possible).
                  Both quietly drop out on short screens (≤860px tall) so the
                  page always fits the viewport. */}
              <Box
                sx={{
                  mt: { md: 6 },
                  display: { xs: "none", lg: "block" },
                  maxWidth: 420,
                  "@media (max-height: 860px)": { display: "none" },
                }}
              >
                <motion.div
                  variants={{
                    hidden: { opacity: 0, scale: 0.96 },
                    show: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: EASE, delay: 0.35 } },
                  }}
                >
                  <LoginIllustration />
                </motion.div>

                {/* Quote — proper editorial block, always readable */}
                <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mt: 1, pl: 1 }}>
                  <Box
                    aria-hidden
                    sx={{
                      width: 26,
                      height: 2,
                      borderRadius: 2,
                      bgcolor: ORANGE.light,
                      mt: "13px",
                      flexShrink: 0,
                    }}
                  />
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: "Georgia, 'Times New Roman', serif",
                        fontStyle: "italic",
                        fontSize: "1.05rem",
                        lineHeight: 1.55,
                        color: "text.primary",
                      }}
                    >
                      “Good ideas deserve a place to grow.”
                    </Typography>
                    <Typography
                      sx={{
                        mt: 0.75,
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        letterSpacing: "0.18em",
                        color: "text.secondary",
                      }}
                    >
                      — INKWELL
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </motion.div>

          {/* ══ RIGHT — auth card ══ */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.25 }}
            style={{ flex: 0.95, width: "100%", display: "flex", justifyContent: "center" }}
          >
            <Box
              sx={(t) => ({
                width: "100%",
                maxWidth: 460,
                bgcolor: t.palette.mode === "dark" ? "#1E1B18" : "#FFFFFF",
                border: "1px solid",
                borderColor: t.palette.mode === "dark" ? "rgba(245,241,234,0.09)" : "#EFE8DF",
                borderRadius: "24px",
                boxShadow:
                  t.palette.mode === "dark"
                    ? "0 24px 60px rgba(0,0,0,0.45)"
                    : "0 24px 60px rgba(46,39,35,0.08), 0 2px 8px rgba(46,39,35,0.04)",
                p: { xs: 3, sm: "44px 42px" },
                "@media (max-height: 860px)": {
                  maxWidth: 440,
                },
              })}
            >
              {/* Header */}
              <Typography
                variant="h4"
                sx={{
                  fontFamily: FONT_DISPLAY,
                  fontWeight: 800,
                  fontSize: "1.75rem",
                  letterSpacing: "-0.02em",
                }}
              >
                Sign in
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.75, mb: 3.25 }}>
                Welcome back! Please enter your details.
              </Typography>

              {/* Inline error — refined warm red, no browser UI */}
              {showBanner && (
                <motion.div
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={(t) => ({
                      mb: 2.5,
                      p: "10px 14px",
                      borderRadius: "12px",
                      bgcolor: t.palette.mode === "dark" ? "rgba(220,38,38,0.14)" : "rgba(220,38,38,0.06)",
                      border: "1px solid rgba(220,38,38,0.28)",
                    })}
                  >
                    <ErrorOutlineIcon sx={{ fontSize: 18, color: "#DC2626" }} />
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "#DC2626" }}>
                      {bannerMessage}
                    </Typography>
                  </Stack>
                </motion.div>
              )}

              {/* Social — both buttons share identical chrome (height, radius,
                  border, hover) via the shared override on the Google one */}
              <Stack spacing={1.25}>
                <GoogleSignInButton
                  onClick={handleGoogle}
                  loading={isGoogleLoading}
                  sx={{
                    borderRadius: "12px",
                    py: 1.5,
                    transition: "transform .2s ease, border-color .2s ease, background-color .2s ease, box-shadow .2s ease",
                    "&:hover": {
                      transform: "translateY(-1px)",
                      borderColor: "text.secondary",
                      backgroundColor: "background.paper",
                      boxShadow: "0 6px 16px rgba(46,39,35,0.08)",
                    },
                  }}
                />
                <SocialOutlineButton onClick={handleGithub} icon={<GitHubMark />}>
                  Continue with GitHub
                </SocialOutlineButton>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ my: 3.25 }}>
                <Box sx={{ flex: 1, height: "1px", bgcolor: "divider" }} />
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  or continue with email
                </Typography>
                <Box sx={{ flex: 1, height: "1px", bgcolor: "divider" }} />
              </Stack>

              {/* Email + password */}
              <Box
                component="form"
                noValidate
                onSubmit={handleSubmit}
                sx={{ width: "100%" }}
              >
                <TextField
                  label="Email Address"
                  fullWidth
                  required
                  autoFocus
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={inputs.email}
                  onChange={(e) => { handleChange(e); setFieldError("email", ""); }}
                  onBlur={() => setFieldError("email", validateEmail(inputs.email))}
                  error={Boolean(errors.email)}
                  helperText={fieldErrorText(errors.email)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={fieldSx}
                />

                <TextField
                  label="Password"
                  fullWidth
                  required
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={inputs.password}
                  onChange={(e) => { handleChange(e); setFieldError("password", ""); }}
                  onBlur={() => setFieldError("password", validatePassword(inputs.password, { min: 1 }))}
                  error={Boolean(errors.password)}
                  helperText={fieldErrorText(errors.password)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleTogglePassword}
                          edge="end"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          size="small"
                          sx={{
                            color: "text.secondary",
                            borderRadius: "8px",
                            transition: "color .2s ease, background-color .2s ease",
                            "&:hover": { color: ORANGE.main, backgroundColor: ORANGE.softer },
                          }}
                        >
                          {showPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={[fieldSx, { mt: 2.5 }]}
                />

                {/* Forgot password */}
                <Box sx={{ textAlign: "right", mt: 1.5 }}>
                  <Link to="/forgot-password" style={{ textDecoration: "none" }}>
                    <Typography
                      sx={{
                        display: "inline-block",
                        color: ORANGE.main,
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        "&:hover": { textDecoration: "underline", textUnderlineOffset: 3 },
                      }}
                    >
                      Forgot password?
                    </Typography>
                  </Link>
                </Box>

                {/* Primary CTA */}
                <Button
                  type="submit"
                  fullWidth
                  disabled={status !== "idle"}
                  disableElevation
                  sx={{
                    mt: 3.25,
                    py: 1.5,
                    borderRadius: "14px",
                    background: `linear-gradient(135deg, ${ORANGE.main}, ${ORANGE.light})`,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "1rem",
                    textTransform: "none",
                    boxShadow: "0 12px 26px rgba(234,88,12,0.28)",
                    transition: "transform .2s ease, box-shadow .2s ease, filter .2s ease",
                    "&:hover:not(:disabled)": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 16px 32px rgba(234,88,12,0.34)",
                      filter: "brightness(1.05)",
                    },
                    "&:active:not(:disabled)": { transform: "scale(0.985)" },
                    "&:disabled": { opacity: 0.8 },
                  }}
                >
                  {status === "submitting" ? (
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <CircularProgress size={20} sx={{ color: "#fff" }} />
                      Signing in…
                    </Stack>
                  ) : status === "success" ? (
                    <motion.span
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 18 }}
                      style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                    >
                      <CheckCircleIcon /> Signed in
                    </motion.span>
                  ) : (
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      Sign In
                      <ArrowForwardIcon sx={{ fontSize: 19 }} />
                    </Stack>
                  )}
                </Button>

                {/* Register CTA */}
                <Button
                  component={Link}
                  to="/register"
                  fullWidth
                  disableElevation
                  sx={{
                    mt: 1.75,
                    py: 1.4,
                    borderRadius: "14px",
                    backgroundColor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    color: "text.primary",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    textTransform: "none",
                    transition: "border-color .2s ease, color .2s ease, transform .2s ease",
                    "&:hover": {
                      borderColor: ORANGE.main,
                      color: ORANGE.main,
                      backgroundColor: "background.paper",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  New to Inkwell? Create an account
                </Button>

                {/* Legal */}
                <Typography
                  sx={{
                    mt: 3.25,
                    fontSize: "0.74rem",
                    lineHeight: 1.6,
                    color: "text.secondary",
                    textAlign: "center",
                  }}
                >
                  By signing in, you agree to our{" "}
                  <Box component="a" href="#" sx={{ color: ORANGE.main, fontWeight: 600, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                    Terms of Service
                  </Box>{" "}
                  and{" "}
                  <Box component="a" href="#" sx={{ color: ORANGE.main, fontWeight: 600, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                    Privacy Policy
                  </Box>
                  .
                </Typography>
              </Box>
            </Box>
          </motion.div>
        </Stack>
      </Container>
    </Box>
  );
};

/* ── Outline social button (GitHub) — mirrors GoogleSignInButton ──── */
function SocialOutlineButton({ onClick, icon, children, disabled }) {
  return (
    <Button
      fullWidth
      variant="outlined"
      onClick={onClick}
      disabled={disabled}
      startIcon={icon}
      sx={{
        borderRadius: "12px",
        py: 1.5,
        borderColor: "divider",
        color: "text.primary",
        fontWeight: 600,
        fontSize: "0.95rem",
        textTransform: "none",
        backgroundColor: "background.paper",
        transition: "transform .2s ease, border-color .2s ease, box-shadow .2s ease",
        "&:hover": {
          transform: "translateY(-1px)",
          borderColor: "text.secondary",
          backgroundColor: "background.paper",
          boxShadow: "0 6px 16px rgba(46,39,35,0.08)",
        },
        "&:disabled": { opacity: 0.7 },
      }}
    >
      {children}
    </Button>
  );
}

/* ── Ghost feather used in the page background ────────────────────── */
function FeatherGhost({ sx }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#C2410C"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      sx={sx}
      aria-hidden="true"
    >
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
      <line x1="16" y1="8" x2="2" y2="22" />
      <line x1="17.5" y1="15" x2="9" y2="15" />
    </Box>
  );
}

export default Login;