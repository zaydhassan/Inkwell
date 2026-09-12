import React, { useState, useEffect } from "react";
import { Grid, Box, Typography, Container, Stack, Avatar, AvatarGroup } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "./GlassCard";
import BrandLogo from "./BrandLogo";

// Shared split-screen shell for the auth pages (Login / Register /
// ForgotPassword). Left: an immersive brand panel — the image with a dark
// scrim, animated charcoal aurora blobs, and a rotating set of feature
// highlights. Right: a premium glass form card. Fully dark-mode aware (the
// brand panel is image-driven and always light-on-dark; the form panel uses
// theme tokens). Keeps the three pages visually identical.
//
// NOTE: only the image PATH is used (as a string) — image bytes are never
// inspected, per the project constraint.
const DEFAULT_HIGHLIGHTS = [
  { title: "A beautiful editor", body: "Write with rich text, dictation, and drafts you can return to anytime." },
  { title: "Earn as you engage", body: "Collect points, climb levels, and unlock badges with every post you publish." },
  { title: "A community of voices", body: "Follow writers, join the discussion, and share your perspective with readers." },
  { title: "Built for night owls", body: "A polished light & dark experience that follows you across every page." },
];

// Small qualitative trust avatars — colored monogram circles, not real users.
const TRUST = [
  { label: "A", color: "#D4D4D4" },
  { label: "Z", color: "#A3A3A3" },
  { label: "M", color: "#737373" },
  { label: "K", color: "#F5F5F4" },
];

const AuthSplitLayout = ({ image, eyebrow, headline, tagline, highlights = DEFAULT_HIGHLIGHTS, children }) => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!highlights || highlights.length <= 1) return undefined;
    const t = setInterval(() => setIdx((i) => (i + 1) % highlights.length), 4200);
    return () => clearInterval(t);
  }, [highlights]);

  const current = highlights?.[idx] || highlights?.[0];

  return (
    <Grid
      container
      sx={{
        minHeight: { xs: "auto", sm: "100vh" },
        flexDirection: { xs: "column", sm: "row" },
      }}
    >
      {/* ── Brand image panel ───────────────────────────────── */}
      <Grid
        item
        xs={12}
        sm={6}
        sx={{
          position: "relative",
          minHeight: { xs: 260, sm: "100vh" },
          backgroundImage: `url(${image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: { xs: "none", sm: "block" },
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(28,25,23,0.55) 0%, rgba(28,25,23,0.35) 45%, rgba(28,25,23,0.62) 100%)",
          },
        }}
      >
        {/* Animated aurora blobs */}
        <motion.div
          aria-hidden
          style={{ position: "absolute", width: 360, height: 360, borderRadius: "50%", background: "rgba(28,25,23,0.45)", filter: "blur(80px)", top: "-8%", left: "-10%" }}
          animate={{ x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", background: "rgba(255,255,255,0.12)", filter: "blur(90px)", bottom: "6%", right: "-6%" }}
          animate={{ x: [0, -30, 0], y: [0, -20, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          style={{ position: "absolute", width: 260, height: 260, borderRadius: "50%", background: "rgba(28,25,23,0.35)", filter: "blur(70px)", top: "40%", left: "30%" }}
          animate={{ x: [0, 24, 0], y: [0, -28, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Brand + content */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            p: { sm: 6, md: 8 },
          }}
        >
          {/* Brand mark */}
          <BrandLogo size={42} tone="light" />

          {/* Headline + rotating highlight (bottom) */}
          <Box>
            <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.85)", letterSpacing: "0.18em" }}>
              {eyebrow}
            </Typography>
            <Typography variant="h2" sx={{
              color: "#fff", maxWidth: 460, mt: 1.5, mb: 3,
              fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em",
              fontFamily: "Plus Jakarta Sans, Inter, sans-serif",
              textShadow: "0 4px 24px rgba(0,0,0,0.4)",
            }}>
              {headline}
            </Typography>

            {current && (
              <Box sx={{ maxWidth: 420 }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.45 }}
                  >
                    <Box
                      sx={{
                        p: 2.5, borderRadius: 3,
                        background: "rgba(255,255,255,0.10)",
                        border: "1px solid rgba(255,255,255,0.18)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ color: "#fff", fontWeight: 700, fontFamily: "Plus Jakarta Sans, Inter, sans-serif", mb: 0.5 }}>
                        {current.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.88)", lineHeight: 1.6 }}>
                        {current.body}
                      </Typography>
                    </Box>
                  </motion.div>
                </AnimatePresence>

                {/* Highlight dots */}
                <Stack direction="row" spacing={1} sx={{ mt: 2.5 }}>
                  {highlights.map((_, i) => (
                    <Box
                      key={i}
                      sx={{
                        width: i === idx ? 22 : 7, height: 7, borderRadius: 999,
                        bgcolor: i === idx ? "#fff" : "rgba(255,255,255,0.4)",
                        transition: "width 0.4s ease",
                      }}
                    />
                  ))}
                </Stack>

                {tagline && (
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", mt: 3, maxWidth: 400, lineHeight: 1.6 }}>
                    {tagline}
                  </Typography>
                )}
              </Box>
            )}

            {/* Trust row */}
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 4 }}>
              <AvatarGroup max={4} sx={{ "& .MuiAvatar-root": { width: 30, height: 30, fontSize: 13, border: "2px solid rgba(28,25,23,0.6)" } }}>
                {TRUST.map((t) => (
                  <Avatar key={t.label} sx={{ bgcolor: t.color, width: 30, height: 30 }}>{t.label}</Avatar>
                ))}
              </AvatarGroup>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)" }}>
                Loved by writers &amp; readers
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Grid>

      {/* ── Form panel ──────────────────────────────────────── */}
      <Grid
        item
        xs={12}
        sm={6}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 3, sm: 6 },
          bgcolor: "background.default",
        }}
      >
        <Container maxWidth="sm" sx={{ p: 0, width: "100%" }}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: "easeOut" }}>
            <GlassCard
              sx={{
                p: { xs: 3, sm: 5 },
                width: "100%",
                boxShadow: (t) => t.customShadows?.cardHover,
              }}
            >
              {/* Mobile-only brand headline (image panel is hidden on xs) */}
              <Box sx={{ display: { xs: "block", sm: "none" }, mb: 3 }}>
                <Box sx={{ mb: 1 }}>
                  <BrandLogo size={34} />
                </Box>
                <Typography variant="overline" sx={{ color: "primary.main" }}>{eyebrow}</Typography>
                <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 800, fontFamily: "Plus Jakarta Sans, Inter, sans-serif" }}>{headline}</Typography>
              </Box>
              {children}
            </GlassCard>
          </motion.div>
        </Container>
      </Grid>
    </Grid>
  );
};

export default AuthSplitLayout;