import React, { useState, useCallback } from "react";
import {
  Box,
  TextField,
  Typography,
  Container,
  Grid,
  Stack,
  Divider,
  InputAdornment,
  CircularProgress,
  Alert,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import GoogleIcon from "@mui/icons-material/Google";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faLinkedinIn, faGithub } from "@fortawesome/free-brands-svg-icons";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";
import { motion, useMotionValue, useSpring } from "framer-motion";
import toast from "react-hot-toast";
import { toastContactSent } from "../utils/toasts";
import { validateEmail, validateMinLength, validateFields } from "../utils/validate";
import GlassCard from "../components/GlassCard";
import GradientButton from "../components/GradientButton";
import "./Contact.css";

/* ─────────────────────────────────────────────────────────────────────
   Static content — kept outside the component so it never re-creates.
   Email/location mirror the original page; BOOKING_URL is a placeholder
   Calendly-style link — swap it for your real scheduling URL anytime.
   ───────────────────────────────────────────────────────────────────── */
const EMAIL = "zaydthirteen@gmail.com";
const LOCATION = "abc 123, India";
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(LOCATION)}`;
// Real Calendly booking link (30-min 1:1).
const BOOKING_URL = "https://calendly.com/zaydthirteen/30min";

const INFO = [
  { id: "email", icon: <EmailIcon fontSize="small" />, label: "Email", value: EMAIL, href: `mailto:${EMAIL}` },
  { id: "book", icon: <EventRoundedIcon fontSize="small" />, label: "Book a call", value: "Schedule a 1:1", href: BOOKING_URL, external: true },
  { id: "location", icon: <LocationOnIcon fontSize="small" />, label: "Location", value: LOCATION, href: MAPS_URL, external: true },
];

const HOURS = [
  { day: "Mon – Fri", time: "9:00 – 18:00" },
  { day: "Saturday", time: "10:00 – 14:00" },
  { day: "Sunday", time: "Closed" },
];

const SOCIALS = [
  { icon: faGlobe, href: "https://zaydupdatedportfolio.netlify.app/", label: "Personal website" },
  { icon: faGithub, href: "https://github.com/zaydhassan", label: "GitHub" },
  { icon: faLinkedinIn, href: "https://www.linkedin.com/in/zayd-hassan-a06105213/", label: "LinkedIn" },
  { icon: faInstagram, href: "https://www.instagram.com/_zayd_hassan_/", label: "Instagram" },
];

const MSG_MAX = 1000;

/* The theme's `brandSoft` / `brandSofter` / `customShadows` tokens are only
   reachable inside the theme's component overrides (closure), NOT on the
   runtime theme object — so `bgcolor: "brandSoft"` would emit the invalid
   CSS `background-color: brandSoft` and render nothing. These helpers
   reproduce the exact token values per mode (see theme.js) so sx consumers
   here render correctly in both light and dark. */
const softBg = (t) =>
  t.palette.mode === "dark" ? "rgba(245,241,234,0.16)" : "rgba(17,17,17,0.06)";
const softerBg = (t) =>
  t.palette.mode === "dark" ? "rgba(245,241,234,0.08)" : "rgba(17,17,17,0.035)";
const cardShadow = (t) =>
  t.palette.mode === "dark"
    ? "0 8px 28px rgba(0,0,0,0.45)"
    : "0 4px 20px rgba(28,25,23,0.06)";
const hoverShadow = (t) =>
  t.palette.mode === "dark"
    ? "0 12px 40px rgba(0,0,0,0.60)"
    : "0 12px 36px rgba(17,17,17,0.12)";

// Deterministic particle field (no Math.random → stable across re-renders,
// and no hydration mismatch risk). Each entry places a soft floating dot.
const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 7.3 + 5) % 100}%`,
  size: 3 + ((i * 13) % 5),
  duration: 16 + ((i * 7) % 12),
  delay: -((i * 3.1) % 20),
  opacity: 0.2 + ((i * 11) % 35) / 100,
}));

/* ── Framer Motion variants ─────────────────────────────────────────── */
const fadeUp = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0 } };
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

/* ─────────────────────────────────────────────────────────────────────
   BackgroundLayers — the six depth layers defined in Contact.css.
   Purely decorative: pointer-events:none, behind content (z-index 0).
   ───────────────────────────────────────────────────────────────────── */
const BackgroundLayers = () => (
  <Box className="contact-bg" aria-hidden="true">
    <Box className="contact-bg__glow" />
    <Box className="contact-bg__radial" />
    <Box className="contact-bg__noise" />
    <Box className="contact-bg__grid" />
    {PARTICLES.map((p, i) => (
      <Box
        key={i}
        className="contact-particle"
        style={{
          left: p.left,
          width: p.size,
          height: p.size,
          opacity: p.opacity,
          animationDuration: `${p.duration}s`,
          animationDelay: `${p.delay}s`,
        }}
      />
    ))}
  </Box>
);

/* ─────────────────────────────────────────────────────────────────────
   Field — a premium input.
   • Floating label: MUI Outlined floats natively on focus/fill.
   • Charcoal focus glow + animated border: themed in MuiOutlinedInput.
   • Validation check icon: appears in the end adornment once the field
     is non-empty AND passes its validator (clear affordance).
   • Character counter: shown for the textarea via helperText.
   ───────────────────────────────────────────────────────────────────── */
const Field = ({
  id, label, type = "text", value, onChange, onBlur,
  error, validate, multiline = false, minRows, maxRows,
  autoComplete, autoFocus = false,
}) => {
  const touched = value.length > 0;
  const isValid = !error && touched && !validate(value);
  const helper = error
    ? error
    : multiline
    ? `${value.length} / ${MSG_MAX}`
    : " "; // reserve height so layout doesn't jump on non-multiline fields

  return (
    <TextField
      id={id}
      name={id}
      label={label}
      type={type}
      fullWidth
      multiline={multiline}
      {...(multiline ? { minRows, maxRows } : {})}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      error={Boolean(error)}
      autoFocus={autoFocus}
      autoComplete={autoComplete}
      inputProps={{ maxLength: MSG_MAX }}
      helperText={helper}
      sx={{
        // A touch more vertical air than the default `margin=normal`.
        my: 1.25,
        "& .MuiOutlinedInput-root": {
          borderRadius: 2.5,
          backgroundColor: "background.paper",
          transition: "box-shadow .25s ease, border-color .25s ease",
        },
        "& .MuiFormHelperText-root": {
          display: "flex",
          justifyContent: multiline ? "flex-end" : "flex-start",
          color: error ? "error.main" : "text.disabled",
          minHeight: "1.25em",
        },
      }}
      InputProps={{
        endAdornment: isValid ? (
          <InputAdornment position="end" sx={{ pr: 1.25, alignSelf: "flex-end" }}>
            <CheckCircleRoundedIcon color="success" sx={{ fontSize: 20 }} />
          </InputAdornment>
        ) : null,
      }}
    />
  );
};

/* ─────────────────────────────────────────────────────────────────────
   MagneticButton — the premium CTA.
   • Animated gradient + shine sweep: `.contact-cta` / `.contact-cta__shine`
     in Contact.css.
   • Magnetic hover: the LABEL leans toward the cursor (the box stays put,
     so a full-width submit never leaves a gap). Spring-smoothed via Framer.
   • The actual submit/loading/success visuals are driven by `state` + the
     icon passed as children by the parent.
   ───────────────────────────────────────────────────────────────────── */
const MagneticButton = ({ children, ...props }) => {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 260, damping: 20 });
  const y = useSpring(my, { stiffness: 260, damping: 20 });

  const onMouseMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 14);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 10);
  };
  const onMouseLeave = () => { mx.set(0); my.set(0); };

  return (
    <GradientButton
      {...props}
      className="contact-cta contact-cta__shine"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <motion.span
        style={{ x, y, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        {children}
      </motion.span>
    </GradientButton>
  );
};

/* ─────────────────────────────────────────────────────────────────────
   Contact — the page.
   Existing functionality preserved exactly: POST /api/v1/contact with
   { name, email, message }, react-hot-toast toasts, shared validators.
   The redesign is purely additive visual/interaction work.
   ───────────────────────────────────────────────────────────────────── */
export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [isSending, setIsSending] = useState(false);
  const [btnState, setBtnState] = useState("idle"); // 'idle' | 'loading' | 'success'
  const [serverMsg, setServerMsg] = useState(null); // { type: 'success'|'error', text }

  const setFieldError = useCallback((field, msg) =>
    setErrors((prev) => {
      const next = { ...prev };
      if (msg) next[field] = msg; else delete next[field];
      return next;
    }), []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validateFields(
      { name, email, message },
      {
        name: (v) => validateMinLength(v, 2, "Name"),
        email: (v) => validateEmail(v),
        message: (v) => validateMinLength(v, 10, "Message"),
      }
    );
    setErrors(found || {});
    if (found) return;

    setIsSending(true);
    setBtnState("loading");
    setServerMsg(null);
    const toastId = toast.loading("⏳ Sending your message...");

    try {
      const response = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await response.json();

      if (response.ok) {
        toast.dismiss(toastId);
        toastContactSent();
        setName(""); setEmail(""); setMessage("");
        setErrors({});
        setBtnState("success");
        setServerMsg({ type: "success", text: "Thanks — your message is on its way. We'll reply within 24 hours." });
        // Revert the button to idle after the success micro-animation.
        setTimeout(() => setBtnState("idle"), 2200);
        setTimeout(() => setServerMsg(null), 6000);
      } else {
        const text = data.message || "Error sending message.";
        toast.error("❌ " + text, { id: toastId });
        setBtnState("idle");
        setServerMsg({ type: "error", text });
        setTimeout(() => setServerMsg(null), 6000);
      }
    } catch (error) {
      toast.error("Error sending message. Try again.", { id: toastId });
      setBtnState("idle");
      setServerMsg({ type: "error", text: "Network error. Please try again." });
      setTimeout(() => setServerMsg(null), 6000);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Box className="contact-page" sx={{ minHeight: "100vh", py: { xs: 5, md: 8 } }}>
        <BackgroundLayers />

        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          {/* ── Immersive hero ─────────────────────────────────────────── */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={stagger}
          >
            <Stack alignItems="center" spacing={2} sx={{ textAlign: "center", mb: { xs: 6, md: 9 } }}>
              {/* Eyebrow chip with pulsing accent dot */}
              <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.25}
                  sx={{
                    display: "inline-flex",
                    px: 2, py: 1,
                    borderRadius: 999,
                    border: (t) => `1px solid ${t.palette.divider}`,
                    bgcolor: "background.glass",
                    backdropFilter: "blur(8px)",
                    color: "primary.main",
                  }}
                >
                  <Box className="contact-pulse" />
                  <Typography variant="overline" sx={{ color: "primary.main", letterSpacing: "0.14em" }}>
                    Available — replies within 24h
                  </Typography>
                </Stack>
              </motion.div>

              {/* Large hero heading — display typography, tight tracking */}
              <motion.div variants={fadeUp} transition={{ duration: 0.55, delay: 0.05 }}>
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: "2.75rem", sm: "3.5rem", md: "4.25rem" },
                    lineHeight: 1.05,
                    maxWidth: 880,
                    fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                    fontWeight: 800,
                    letterSpacing: "-0.025em",
                  }}
                >
                  Let&apos;s start a{" "}
                  <Box component="span" sx={{
                    background: (t) => `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.primary.light})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}>
                    conversation
                  </Box>
                </Typography>
              </motion.div>

              {/* Supporting subtitle */}
              <motion.div variants={fadeUp} transition={{ duration: 0.55, delay: 0.12 }}>
                <Typography
                  variant="h6"
                  sx={{
                    maxWidth: 620,
                    color: "text.secondary",
                    fontWeight: 400,
                    lineHeight: 1.7,
                  }}
                >
                  Questions, feedback, or a partnership idea — drop us a line and
                  a real human will read every word before writing back.
                </Typography>
              </motion.div>
            </Stack>
          </motion.div>

          {/* ── Two-column premium layout ─────────────────────────────── */}
          <Grid container spacing={{ xs: 3, md: 5 }} alignItems="stretch">
            {/* ── Left: contact information panel ──────────────────────── */}
            <Grid item xs={12} md={5}>
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                transition={{ duration: 0.55 }}
                style={{ height: "100%" }}
              >
                <GlassCard glowOnHover sx={{ p: { xs: 3, md: 4 }, height: "100%", position: "relative", overflow: "hidden" }}>
                  {/* Floating envelope illustration, top-right */}
                  <Box
                    className="contact-illustration"
                    sx={{
                      position: "absolute", top: 20, right: 20,
                      width: 56, height: 56, borderRadius: 3,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      bgcolor: softBg, color: "primary.main",
                      border: (t) => `1px solid ${t.palette.divider}`,
                      boxShadow: cardShadow,
                    }}
                    aria-hidden="true"
                  >
                    <SendRoundedIcon sx={{ transform: "rotate(-12deg)" }} />
                  </Box>

                  <Typography variant="overline" sx={{ color: "primary.main" }}>
                    Contact information
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, mb: 3, fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif' }}>
                    Reach us directly
                  </Typography>

                  {/* Availability status */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    sx={{
                      px: 2, py: 1.5, mb: 3, borderRadius: 3,
                      bgcolor: softerBg,
                      border: (t) => `1px solid ${t.palette.divider}`,
                    }}
                  >
                    <Box className="contact-pulse" />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Currently available
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        Usually replies within 24 hours
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Email / Book a call / Location rows */}
                  <Stack spacing={1}>
                    {INFO.map((row) => (
                      <Box
                        key={row.id}
                        component="a"
                        href={row.href}
                        target={row.external ? "_blank" : undefined}
                        rel={row.external ? "noopener noreferrer" : undefined}
                        className="contact-info-row"
                        aria-label={`${row.label}: ${row.value}`}
                      >
                        <Box className="contact-info-icon">{row.icon}</Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                            {row.label}
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {row.value}
                          </Typography>
                        </Box>
                        <ArrowOutwardIcon className="contact-info-arrow" sx={{ fontSize: 18 }} />
                      </Box>
                    ))}
                  </Stack>

                  {/* Google Maps button */}
                  <GradientButton
                    component="a"
                    href={MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    fullWidth
                    startIcon={<GoogleIcon />}
                    sx={{
                      mt: 3,
                      bgcolor: "transparent", backgroundImage: "none", color: "primary.main",
                      border: (t) => `1.5px solid ${t.palette.primary.main}`,
                      "&:hover": { bgcolor: softBg, backgroundImage: "none", boxShadow: hoverShadow },
                    }}
                  >
                    Open in Google Maps
                  </GradientButton>

                  <Divider sx={{ my: 3 }} />

                  {/* Business hours */}
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                    <ScheduleIcon sx={{ fontSize: 18, color: "primary.main" }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Business hours
                    </Typography>
                  </Stack>
                  <Stack spacing={0.75}>
                    {HOURS.map((h) => (
                      <Stack key={h.day} direction="row" justifyContent="space-between">
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>{h.day}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{h.time}</Typography>
                      </Stack>
                    ))}
                  </Stack>

                  <Divider sx={{ my: 3 }} />

                  {/* Social */}
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
                    Follow along
                  </Typography>
                  <Stack direction="row" spacing={1.5}>
                    {SOCIALS.map((s) => (
                      <Box
                        key={s.label}
                        component="a"
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="contact-social"
                        aria-label={s.label}
                      >
                        <FontAwesomeIcon icon={s.icon} />
                      </Box>
                    ))}
                  </Stack>
                </GlassCard>
              </motion.div>
            </Grid>

            {/* ── Right: contact form ─────────────────────────────────── */}
            <Grid item xs={12} md={7}>
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                transition={{ duration: 0.55, delay: 0.1 }}
                style={{ height: "100%" }}
              >
                <GlassCard sx={{ p: { xs: 3, md: 5 }, height: "100%" }}>
                  <Typography variant="overline" sx={{ color: "primary.main" }}>
                    Send a message
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, mb: 1, fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif' }}>
                    We&apos;d love to hear from you
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                    Fill in the form and we&apos;ll get back to you shortly.
                  </Typography>

                  {/* Inline success / error state (additive — toast still fires) */}
                  {serverMsg && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Alert
                        severity={serverMsg.type}
                        icon={serverMsg.type === "success" ? <CheckCircleRoundedIcon /> : undefined}
                        sx={{ mb: 2.5, borderRadius: 2.5, alignItems: "center" }}
                        role="status"
                        aria-live="polite"
                      >
                        {serverMsg.text}
                      </Alert>
                    </motion.div>
                  )}

                  <Box component="form" noValidate onSubmit={handleSubmit} aria-label="Contact form">
                    <Field
                      id="name"
                      label="Full name"
                      value={name}
                      autoFocus
                      autoComplete="name"
                      validate={(v) => validateMinLength(v, 2, "Name")}
                      onChange={(e) => { setName(e.target.value); setFieldError("name", ""); }}
                      onBlur={() => setFieldError("name", validateMinLength(name, 2, "Name"))}
                      error={errors.name}
                    />
                    <Field
                      id="email"
                      label="Email address"
                      type="email"
                      value={email}
                      autoComplete="email"
                      validate={validateEmail}
                      onChange={(e) => { setEmail(e.target.value); setFieldError("email", ""); }}
                      onBlur={() => setFieldError("email", validateEmail(email))}
                      error={errors.email}
                    />
                    <Field
                      id="message"
                      label="Your message"
                      multiline
                      minRows={4}
                      maxRows={8}
                      value={message}
                      validate={(v) => validateMinLength(v, 10, "Message")}
                      onChange={(e) => { setMessage(e.target.value); setFieldError("message", ""); }}
                      onBlur={() => setFieldError("message", validateMinLength(message, 10, "Message"))}
                      error={errors.message}
                    />

                    {/* Premium CTA: idle / loading / success states */}
                    <MagneticButton
                      type="submit"
                      fullWidth
                      disabled={isSending}
                      sx={{ mt: 3.5, py: 1.4, fontSize: "0.95rem" }}
                    >
                      {btnState === "loading" ? (
                        <>
                          <CircularProgress size={20} sx={{ color: "currentColor" }} />
                          Sending…
                        </>
                      ) : btnState === "success" ? (
                        <>
                          <CheckCircleRoundedIcon />
                          Sent!
                        </>
                      ) : (
                        <>
                          <SendRoundedIcon />
                          Send message
                        </>
                      )}
                    </MagneticButton>

                    {/* Reassurance line under the CTA */}
                    <Stack direction="row" alignItems="center" spacing={0.75} justifyContent="center" sx={{ mt: 2 }}>
                      <BoltRoundedIcon sx={{ fontSize: 15, color: "primary.main" }} />
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        Average response time — under 2 hours during business hours.
                      </Typography>
                    </Stack>
                  </Box>
                </GlassCard>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
}