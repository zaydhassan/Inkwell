import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  TextField,
  InputAdornment,
  IconButton,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  ArrowForwardRounded,
  ErrorOutline as ErrorOutlineIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Diversity3 as Diversity3Icon,
  Public as PublicIcon,
} from "@mui/icons-material";
import { motion, MotionConfig } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { authActions } from "../redux/store";
import { setAccessToken } from "../utils/auth";
import { validateEmail, validatePassword, validateFields } from "../utils/validate";
import { toastLogin } from "../utils/toasts";
import { signInWithGoogle } from "../firebase/googleAuth";
import GoogleSignInButton from "../components/GoogleSignInButton";
import LoginStillLife from "../components/login/LoginStillLife";
import { EASE } from "../components/ink";
import "./Login.css";

/* ─────────────────────────────────────────────────────────────────────
   InkWell — Sign in.

   A premium dark editorial sign-in: the brand story and a cinematic
   writing still life on the left, a floating auth panel on the right,
   over an ink-black canvas with a barely-there grid and a single warm
   orange light behind the card.

   Styling comes from the shared InkWell design system: the root carries
   `ink` (which is what supplies the `--ink-*` tokens), the arrangement
   lives in Login.css, and the field, button and motion vocabulary is
   written against those tokens rather than a MUI theme — which is also
   why the page is always dark, like Home and About, regardless of the
   app's `data-theme`.

   Authentication is untouched. `/api/v1/user/login`, Google OAuth, the
   GitHub placeholder, token handling, `?redirect=` params, admin routing,
   field validation, the inline error banner and the loading/success
   states all behave exactly as they did before.
   ───────────────────────────────────────────────────────────────────── */

/* ── Entrance choreography — the design system's easing and rhythm ──── */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.08 } },
};
const rise = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};
/* The benefits settle as their own group rather than arriving in one block. */
const featureList = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

/* ── Field chrome ───────────────────────────────────────────────────
   One shape for both inputs: 52px tall, hairline border on the raised
   charcoal, orange focus ring, and the design system's red for errors
   (orange is the brand accent and must never double as a warning). The
   browser's own autofill wash is overridden so a filled field keeps the
   page's palette. */
const fieldSx = {
  "& .MuiOutlinedInput-root": {
    height: 52,
    borderRadius: "12px",
    backgroundColor: "var(--ink-bg-alt)",
    color: "var(--ink-text)",
    transition: "box-shadow .2s ease, background-color .2s ease",
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--ink-border)" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,106,0,0.45)" },
    "&.Mui-focused": { boxShadow: "0 0 0 3px rgba(255,106,0,0.10)" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--ink-orange)" },
    "&.Mui-error .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(248,113,113,0.65)" },
    "&.Mui-error.Mui-focused": { boxShadow: "0 0 0 3px rgba(248,113,113,0.12)" },
    "&.Mui-error.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#f87171" },
  },
  "& .MuiOutlinedInput-input": {
    padding: 0,
    fontSize: "0.92rem",
    fontFamily: "var(--ink-font-body)",
    color: "var(--ink-text)",
    "&::placeholder": { color: "var(--ink-text-3)", opacity: 1 },
  },
  "& .MuiInputBase-input:-webkit-autofill": {
    WebkitBoxShadow: "0 0 0 100px var(--ink-bg-alt) inset",
    WebkitTextFillColor: "var(--ink-text)",
    caretColor: "var(--ink-text)",
  },
  "& .MuiInputAdornment-root": {
    height: "100%",
    maxHeight: "none",
    color: "var(--ink-text-3)",
  },
  "& .MuiInputAdornment-positionStart": { marginRight: "10px" },
  "& .MuiInputAdornment-positionEnd": { marginLeft: "4px" },
  "& .MuiFormHelperText-root": {
    margin: "6px 0 0 2px",
    fontSize: "0.72rem",
    fontWeight: 500,
    lineHeight: 1.4,
  },
  "& .MuiFormHelperText-root.Mui-error": {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    color: "#f87171",
  },
};

/* ── Social buttons ─────────────────────────────────────────────────
   Google keeps its standard multicolour mark (the shared component's
   vector) and its own loading state; both buttons share one chrome —
   52px, hairline border, raised charcoal — and warm to an orange border
   on hover. Neither turns orange. */
const socialSx = {
  minHeight: 52,
  py: 0,
  borderRadius: "12px",
  backgroundColor: "var(--ink-bg-alt)",
  borderColor: "var(--ink-border)",
  color: "var(--ink-text)",
  fontSize: "0.9rem",
  fontWeight: 600,
  textTransform: "none",
  transition: "background-color .2s ease, border-color .2s ease, transform .2s ease",
  "&:hover": {
    backgroundColor: "var(--ink-card-hi)",
    borderColor: "var(--ink-border-warm)",
    transform: "translateY(-1px)",
    boxShadow: "none",
  },
  "&.Mui-disabled": {
    opacity: 0.7,
    color: "var(--ink-text-2)",
    borderColor: "var(--ink-border)",
    backgroundColor: "var(--ink-bg-alt)",
  },
  "& .MuiButton-startIcon": { marginRight: "10px", marginLeft: 0 },
};

/* ── Primary CTA ────────────────────────────────────────────────────── */
const submitSx = {
  minHeight: 53,
  borderRadius: "12px",
  backgroundColor: "var(--ink-orange)",
  color: "#fff",
  fontFamily: "var(--ink-font-body)",
  fontSize: "0.94rem",
  fontWeight: 700,
  letterSpacing: "0.01em",
  textTransform: "none",
  boxShadow: "0 8px 30px rgba(255,106,0,0.18)",
  transition: "background-color .2s ease, box-shadow .2s ease, transform .2s ease",
  "&:hover": {
    backgroundColor: "var(--ink-orange-2)",
    boxShadow: "0 12px 34px rgba(255,106,0,0.28)",
    transform: "translateY(-1px)",
  },
  "&:active": { transform: "translateY(0)" },
  "&.Mui-disabled": {
    backgroundColor: "var(--ink-orange)",
    color: "#fff",
    opacity: 0.62,
    boxShadow: "none",
  },
};

/* ── Secondary CTA ──────────────────────────────────────────────────
   Outlined, not filled: it is a route out of the page, not the page's
   action. */
const altSx = {
  minHeight: 50,
  borderRadius: "12px",
  backgroundColor: "transparent",
  border: "1px solid var(--ink-border)",
  color: "var(--ink-text)",
  fontSize: "0.9rem",
  fontWeight: 600,
  textTransform: "none",
  boxShadow: "none",
  transition: "border-color .2s ease, color .2s ease, background-color .2s ease, transform .2s ease",
  "&:hover": {
    borderColor: "var(--ink-border-warm)",
    backgroundColor: "var(--ink-orange-softer)",
    color: "var(--ink-orange)",
    transform: "translateY(-1px)",
  },
};

/* ── The brand mark — orange badge carrying the quill glyph ─────────── */
const QuillMark = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth={1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: 21, height: 21 }}
    aria-hidden="true"
  >
    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
    <line x1="16" y1="8" x2="2" y2="22" />
    <line x1="17.5" y1="15" x2="9" y2="15" />
  </svg>
);

/* ── GitHub mark (vector, official path) ────────────────────────────── */
const GitHubMark = ({ size = 19 }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"
    />
  </svg>
);

/* ── Benefits — an editorial list, deliberately not a card ──────────── */
const BENEFITS = [
  { icon: EditIcon, title: "Keep writing", body: "Your ideas matter." },
  { icon: Diversity3Icon, title: "Grow your network", body: "Connect with like-minded people." },
  { icon: PublicIcon, title: "Make an impact", body: "Reach readers around the world." },
];

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const [inputs, setInputs] = useState({ email: "", password: "" });

  const [showPassword, setShowPassword] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});
  // idle → submitting → success (checkmark) → navigate
  const [status, setStatus] = useState("idle");

  /* Autofocus the email field, but only where the panel sits beside the
     story rather than under it. On the stacked layout (the 980px
     breakpoint in Login.css — keep the two in step) the field starts
     below the fold, so focusing it makes the browser scroll the brand,
     the hero and "Back to Home" straight out of view: the page opens
     looking like it began mid-form. Above that breakpoint the field is
     already on screen, so the focus is pure convenience and stays.
     Read once at mount — a later resize must never yank focus away from
     someone mid-sentence. */
  const [autoFocusEmail] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 980px)").matches
  );

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

  // Compact inline error for the helperText slot. Reserving a space when
  // there is no error keeps the field heights stable as validation appears
  // and clears.
  const fieldErrorText = (message) =>
    message ? (
      <>
        <ErrorOutlineIcon sx={{ fontSize: 13 }} />
        {message}
      </>
    ) : (
      " "
    );

  /* The page's one entrance is a short stagger across the story column
     plus a lift on the panel. `reducedMotion="user"` makes framer-motion
     honour the OS "reduce motion" setting — the layout and the fades
     stay, the movement goes — which is the same standard the shared
     stylesheet already holds its CSS animations to. */
  const page = (
    <div className="ink ink-login">
      {/* ── Ambient background ── */}
      <div className="ink-login-bg" aria-hidden="true">
        <div className="ink-login-glow" />
        <div className="ink-login-glow-bl" />
        <div className="ink-login-grid" />
        <div className="ink-login-rules" />
        <div className="ink-login-noise ink-noise" />
        <div className="ink-login-vignette" />
      </div>

      {/* ── Top chrome: a way back ── */}
      <div className="ink-login-chrome">
        <Link to="/" className="ink-login-back">
          Back to Home
          <ArrowForwardRounded sx={{ fontSize: 16 }} />
        </Link>
      </div>

      {/* ── Composition ── */}
      <main className="ink-login-main">
        {/* ══ LEFT — the brand story ══ */}
        <motion.section
          className="ink-login-copy"
          variants={container}
          initial="hidden"
          animate="show"
          aria-labelledby="ink-login-heading"
        >
          <motion.div variants={rise}>
            <span className="ink-login-brand">
              <span className="ink-login-mark">
                <QuillMark />
              </span>
              <span className="ink-login-word">InkWell</span>
            </span>
          </motion.div>

          <motion.p variants={rise} className="ink-login-eyebrow">
            Write &nbsp;•&nbsp; Share &nbsp;•&nbsp; Inspire
          </motion.p>

          <motion.h1 variants={rise} id="ink-login-heading" className="ink-login-hero">
            Welcome back
            <br />
            to <span className="ink-login-hero-accent">InkWell</span>
          </motion.h1>

          <motion.p variants={rise} className="ink-login-lede">
            Sign in to continue your writing journey, connect with amazing
            creators, and explore stories that inspire.
          </motion.p>

          <motion.ul variants={featureList} className="ink-login-features">
            {BENEFITS.map(({ icon: Icon, title, body }) => (
              <motion.li variants={rise} key={title} className="ink-login-feature">
                <span className="ink-value-icon">
                  <Icon sx={{ fontSize: 21 }} />
                </span>
                <div>
                  <p className="ink-login-feature-title">{title}</p>
                  <p className="ink-login-feature-body">{body}</p>
                </div>
              </motion.li>
            ))}
          </motion.ul>

          {/* The still life, then the line that closes the page. Both drop
              out entirely on short or narrow screens (see Login.css). */}
          <motion.div variants={rise} className="ink-login-still">
            <LoginStillLife />
            <blockquote className="ink-login-quote">
              <span className="ink-login-quote-rule" aria-hidden="true" />
              <div>
                <p>“Good ideas deserve a place to grow.”</p>
                <cite>— InkWell</cite>
              </div>
            </blockquote>
          </motion.div>
        </motion.section>

        {/* ══ RIGHT — the auth panel ══ */}
        <motion.section
          className="ink-login-panel-col"
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.18 }}
          aria-label="Sign in"
        >
          <div className="ink-login-panel">
            <h2 className="ink-login-panel-title">Sign in</h2>
            <p className="ink-login-panel-sub">Welcome back! Please enter your details.</p>

            {/* Inline error — refined warm red, announced to assistive tech */}
            {showBanner && (
              <motion.div
                role="alert"
                className="ink-login-alert"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ErrorOutlineIcon sx={{ fontSize: 17, flexShrink: 0 }} />
                <span>{bannerMessage}</span>
              </motion.div>
            )}

            {/* Social — identical chrome on both, via the shared override */}
            <div className="ink-login-social">
              <GoogleSignInButton
                onClick={handleGoogle}
                loading={isGoogleLoading}
                sx={socialSx}
              />
              <Button
                fullWidth
                variant="outlined"
                onClick={handleGithub}
                startIcon={<GitHubMark />}
                sx={socialSx}
              >
                Continue with GitHub
              </Button>
            </div>

            <div className="ink-login-divider">
              <span>or continue with email</span>
            </div>

            <form noValidate onSubmit={handleSubmit}>
              <label className="ink-login-label" htmlFor="login-email">
                Email Address <span className="ink-login-label-req">*</span>
              </label>
              <TextField
                id="login-email"
                className="ink-login-field"
                fullWidth
                required
                autoFocus={autoFocusEmail}
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
                      <EmailIcon sx={{ fontSize: 19 }} />
                    </InputAdornment>
                  ),
                }}
                sx={fieldSx}
              />

              <label className="ink-login-label ink-login-label-stack" htmlFor="login-password">
                Password <span className="ink-login-label-req">*</span>
              </label>
              <TextField
                id="login-password"
                className="ink-login-field"
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
                      <LockIcon sx={{ fontSize: 19 }} />
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
                          color: "var(--ink-text-3)",
                          transition: "color .2s ease, background-color .2s ease",
                          "&:hover": {
                            color: "var(--ink-orange)",
                            backgroundColor: "var(--ink-orange-softer)",
                          },
                        }}
                      >
                        {showPassword ? (
                          <VisibilityOff sx={{ fontSize: 19 }} />
                        ) : (
                          <Visibility sx={{ fontSize: 19 }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={fieldSx}
              />

              {/* Forgot password */}
              <div className="ink-login-row">
                <Link to="/forgot-password" className="ink-login-link">
                  Forgot password?
                </Link>
              </div>

              {/* Primary CTA */}
              <Button
                type="submit"
                fullWidth
                disabled={status !== "idle"}
                disableElevation
                className="ink-login-submit"
                sx={submitSx}
              >
                {status === "submitting" ? (
                  <>
                    <CircularProgress size={19} sx={{ color: "#fff", mr: 1.25 }} />
                    Signing in…
                  </>
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
                  <>
                    Sign In
                    <ArrowForwardRounded sx={{ fontSize: 19, ml: 0.75 }} />
                  </>
                )}
              </Button>

              {/* Register */}
              <Button
                component={Link}
                to="/register"
                fullWidth
                disableElevation
                className="ink-login-alt"
                sx={altSx}
              >
                New to InkWell? Create an account
              </Button>

              {/* Legal */}
              <p className="ink-login-legal">
                By signing in, you agree to our{" "}
                <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
              </p>
            </form>
          </div>
        </motion.section>
      </main>
    </div>
  );

  return <MotionConfig reducedMotion="user">{page}</MotionConfig>;
};

export default Login;
