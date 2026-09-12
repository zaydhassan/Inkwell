import React from "react";
import { Typography, Container, Grid, Box, Stack, Divider } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faLinkedinIn, faGithub } from "@fortawesome/free-brands-svg-icons";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";
import { motion } from 'framer-motion';
import { useNavigate } from "react-router-dom";
import {
  MenuBook as MenuBookIcon,
  EditNote as EditNoteIcon,
  EmojiEvents as EmojiEventsIcon,
  AutoAwesome as AutoAwesomeIcon,
  Diversity3 as Diversity3Icon,
  Visibility as VisibilityIcon,
  Bolt as BoltIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import SectionHeading from "../components/SectionHeading";
import GlassCard from "../components/GlassCard";
import GradientButton from "../components/GradientButton";
import './About.css';

const VALUES = [
  {
    icon: <AutoAwesomeIcon />, title: "Quality first",
    body: "Every story is crafted by writers who care — thoughtful analysis over noise, depth over clickbait.",
  },
  {
    icon: <Diversity3Icon />, title: "Diverse voices",
    body: "Technology, health, travel, business and more — a spectrum of perspectives from a spectrum of people.",
  },
  {
    icon: <VisibilityIcon />, title: "Reader-first",
    body: "A calm reading experience with a rich-text article view, recommendations, and a comments thread built around you.",
  },
  {
    icon: <EmojiEventsIcon />, title: "Earn as you engage",
    body: "Like, comment, and publish to rack up points, climb levels, unlock badges, and redeem real rewards.",
  },
  {
    icon: <BoltIcon />, title: "Built for writers",
    body: "A distraction-free editor with dictation, drafts, tagging, and one-click publish — from idea to live in minutes.",
  },
  {
    icon: <MenuBookIcon />, title: "Always yours",
    body: "A persistent light & dark theme, fast code-split loading, and an interface that works wherever you read.",
  },
];

const FLOW = [
  { step: "01", icon: <MenuBookIcon />, title: "Read", body: "Discover stories across topics, save your favourites, and follow the writers you love." },
  { step: "02", icon: <EditNoteIcon />, title: "Write", body: "Open the editor, draft with dictation, tag your post, and publish when you're ready." },
  { step: "03", icon: <EmojiEventsIcon />, title: "Earn", body: "Every interaction awards points — level up, collect badges, and redeem rewards." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: "100vh", py: { xs: 6, md: 10 }, overflowX: "hidden" }}>
      <Container maxWidth="lg">
        {/* ── Hero ───────────────────────────────────────── */}
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6} order={{ xs: 2, md: 1 }}>
            <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.6 }}>
              <SectionHeading
                eyebrow="Our story"
                title="Writing that earns your attention"
                subtitle="Inkwell is a home for thoughtful writing — and the readers and writers who make it thrive."
                align="left"
              />
              <Typography variant="body1" sx={{ lineHeight: 1.85, mt: 3, color: "text.secondary" }}>
                Welcome to <Box component="b" sx={{ color: "text.primary" }}>Inkwell</Box> — your destination for
                insightful, engaging content across every topic that matters. Our mission is to give readers fresh
                perspectives and writers a place worth publishing to.
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 4 }}>
                <GradientButton
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate("/blogs")}
                >
                  Explore the blog
                </GradientButton>
                <GradientButton
                  size="large"
                  sx={{
                    bgcolor: "primary.main",
                    backgroundImage: "none",
                    color: "primary.contrastText",
                    border: "1.5px solid",
                    borderColor: "primary.main",
                    fontWeight: 700,
                    boxShadow: (t) => t.customShadows?.card,
                    "&:hover": {
                      bgcolor: "primary.dark",
                      backgroundImage: "none",
                      color: "primary.contrastText",
                      boxShadow: (t) => t.customShadows?.cardHover,
                    },
                  }}
                  onClick={() => navigate("/register")}
                >
                  Become a writer
                </GradientButton>
              </Stack>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6} order={{ xs: 1, md: 2 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
            >
              <Box sx={{ position: "relative" }}>
                <Box
                  sx={{
                    borderRadius: 4,
                    overflow: "hidden",
                    boxShadow: (t) => t.customShadows?.card,
                    "& img": { width: "100%", display: "block" },
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(28,25,23,0.45))",
                    },
                  }}
                >
                  <img src="/about.jpg" alt="About Inkwell" />
                </Box>

                {/* Floating stat card */}
                <GlassCard
                  glowOnHover
                  sx={{
                    position: "absolute",
                    left: { xs: 16, sm: -24 },
                    bottom: { xs: -28, sm: -32 },
                    p: 2.5,
                    width: 200,
                    boxShadow: (t) => t.customShadows?.cardHover,
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 44, height: 44, borderRadius: 2, bgcolor: "brandSoft", color: "primary.main",
                    }}>
                      <AutoAwesomeIcon />
                    </Box>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1, fontFamily: "Plus Jakarta Sans, Inter, sans-serif" }}>
                        9 topics
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        One inkwell
                      </Typography>
                    </Box>
                  </Stack>
                </GlassCard>
              </Box>
            </motion.div>
          </Grid>
        </Grid>

        {/* ── Values grid ────────────────────────────────── */}
        <Box sx={{ mt: { xs: 12, md: 16 } }}>
          <SectionHeading
            eyebrow="What we value"
            title="What makes Inkwell different"
            subtitle="Six principles that shape every page, every post, and every interaction."
            align="center"
            sx={{ mb: 6 }}
          />
          <Grid container spacing={3}>
            {VALUES.map((v, i) => (
              <Grid item xs={12} sm={6} md={4} key={v.title}>
                <motion.div
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.2 }}
                  variants={fadeUp}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                >
                  <GlassCard glowOnHover sx={{ height: "100%", p: 3.5 }}>
                    <Box sx={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 52, height: 52, borderRadius: 2, mb: 2.5,
                      bgcolor: "brandSoft", color: "primary.main",
                      fontSize: 24,
                    }}>
                        {v.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: "Plus Jakarta Sans, Inter, sans-serif", mb: 1 }}>
                      {v.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                      {v.body}
                    </Typography>
                  </GlassCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* ── How it works ───────────────────────────────── */}
        <Box sx={{ mt: { xs: 10, md: 14 } }}>
          <SectionHeading
            eyebrow="How it works"
            title="Read. Write. Earn."
            subtitle="A simple loop that rewards curiosity and craft."
            align="center"
            sx={{ mb: 6 }}
          />
          <Grid container spacing={3} alignItems="stretch">
            {FLOW.map((f, i) => (
              <Grid item xs={12} md={4} key={f.step}>
                <motion.div
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.2 }}
                  variants={fadeUp}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  style={{ height: "100%" }}
                >
                  <GlassCard sx={{ height: "100%", p: 4, position: "relative", overflow: "hidden" }}>
                    <Typography
                      variant="h3"
                      sx={{
                        position: "absolute", top: 12, right: 20,
                        color: "primary.main", fontWeight: 800, opacity: 0.08,
                        fontFamily: "Plus Jakarta Sans, Inter, sans-serif",
                      }}
                    >
                      {f.step}
                    </Typography>
                    <Box sx={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 56, height: 56, borderRadius: 2, mb: 2.5,
                      bgcolor: "brandSoft", color: "primary.main", fontSize: 26,
                    }}>
                      {f.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: "Plus Jakarta Sans, Inter, sans-serif", mb: 1 }}>
                      {f.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                      {f.body}
                    </Typography>
                  </GlassCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* ── Meet the maker ──────────────────────────────── */}
        <Box sx={{ mt: { xs: 10, md: 14 } }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.5 }}>
                <SectionHeading eyebrow="Behind the ink" title="Meet the maker" align="left" />
                <Typography variant="body1" sx={{ lineHeight: 1.85, mt: 3, color: "text.secondary" }}>
                  Inkwell is built by a developer who believes great writing deserves a great home. The platform brings
                  together experienced writers and industry experts who lend their deep knowledge and unique voices to
                  every piece. We believe in the power of information and the impact of sharing knowledge — aiming to
                  enrich readers' lives with high-quality articles and stories.
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.85, mt: 2, color: "text.secondary" }}>
                  Thank you for visiting. We hope you find the content here enlightening and inspiring.
                </Typography>
              </motion.div>
            </Grid>

            <Grid item xs={12} md={5}>
              <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                <GlassCard glowOnHover sx={{ p: 4, textAlign: "center" }}>
                  <Box
                    sx={{
                      width: 72, height: 72, mx: "auto", mb: 2,
                      borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      bgcolor: "brandSoft", color: "primary.main", fontSize: 32,
                      border: "2px solid", borderColor: "primary.main",
                    }}
                  >
                    <EditNoteIcon sx={{ fontSize: 36 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: "Plus Jakarta Sans, Inter, sans-serif" }}>
                    Zayd Hassan
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 2.5 }}>
                    Developer &amp; creator of Inkwell
                  </Typography>
                  <Divider sx={{ mb: 2.5 }} />
                  <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
                    <a href="https://zaydupdatedportfolio.netlify.app/" target="_blank" rel="noopener noreferrer" className="icon" aria-label="Personal website">
                      <FontAwesomeIcon icon={faGlobe} />
                    </a>
                    <a href="https://github.com/zaydhassan" target="_blank" rel="noopener noreferrer" className="icon" aria-label="GitHub">
                      <FontAwesomeIcon icon={faGithub} />
                    </a>
                    <a href="https://www.linkedin.com/in/zayd-hassan-a06105213/" target="_blank" rel="noopener noreferrer" className="icon" aria-label="LinkedIn">
                      <FontAwesomeIcon icon={faLinkedinIn} />
                    </a>
                    <a href="https://www.instagram.com/_zayd_hassan_/" target="_blank" rel="noopener noreferrer" className="icon" aria-label="Instagram">
                      <FontAwesomeIcon icon={faInstagram} />
                    </a>
                  </Box>
                </GlassCard>
              </motion.div>
            </Grid>
          </Grid>
        </Box>

        {/* ── Closing CTA ─────────────────────────────────── */}
        <Box sx={{ mt: { xs: 10, md: 14 } }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <GlassCard
              sx={{
                p: { xs: 4, md: 7 },
                textAlign: "center",
                background: (t) =>
                  `linear-gradient(135deg, ${t.palette.brandSoft} 0%, ${t.palette.background.paper} 70%)`,
                border: (t) => `1px solid ${t.palette.divider}`,
              }}
            >
              <Typography variant="overline" sx={{ color: "primary.main" }}>
                Ready when you are
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: "Plus Jakarta Sans, Inter, sans-serif", mt: 1, mb: 1.5 }}>
                Start sharing your story
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 560, mx: "auto", mb: 4 }}>
                Join a community of readers and writers. Your next favourite article — or your next published one — is one click away.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
                <GradientButton size="large" endIcon={<ArrowForwardIcon />} onClick={() => navigate("/register")}>
                  Create an account
                </GradientButton>
                <GradientButton
                  size="large"
                  sx={{
                    bgcolor: "transparent",
                    backgroundImage: "none",
                    color: "primary.main",
                    border: (t) => `1.5px solid ${t.palette.primary.main}`,
                    "&:hover": {
                      bgcolor: "brandSoft",
                      backgroundImage: "none",
                    },
                  }}
                  onClick={() => navigate("/blogs")}
                >
                  Browse stories
                </GradientButton>
              </Stack>
            </GlassCard>
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
};

export default AboutPage;