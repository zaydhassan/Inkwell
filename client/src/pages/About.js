import React from "react";
import { Box, Container, Typography, Stack } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowForwardRounded,
  AutoAwesomeOutlined,
  AutoStoriesOutlined,
  BoltOutlined,
  Diversity3Outlined,
  EditNoteOutlined,
  EmojiEventsOutlined,
  GroupsOutlined,
  MenuBookOutlined,
  TrendingUpOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import { WritingDeskScene, PhilosophyScene } from "../components/AboutIllustrations";
import { INK, FONT_DISPLAY, EASE } from "../components/ink/tokens";
import {
  Reveal,
  InkBackdrop,
  InkEyebrow,
  InkHighlight,
  InkSectionHead,
  InkSurface,
  InkFloatingCard,
  InkAvatarGroup,
  InkPrimaryButton,
  InkGhostButton,
  InkStatsBand,
  InkValueCard,
} from "../components/ink";
import "./About.css";

/* ─────────────────────────────────────────────────────────────────────
   InkWell — About.

   A cinematic, editorial About page in the app's dark + warm-orange
   language. It no longer owns a token layer: the page root carries `.ink`
   (and the Navbar `.ink-nav`), so it reads the shared design system in
   `src/styles/inkwell.css` and the shared primitives in
   `src/components/ink`, exactly like Home. About.css keeps only genuinely
   About-specific layout.

   Content and routing are unchanged from the previous About page: the
   same two CTAs (/explore and /register), the same six values, the same
   read/write/earn loop, and the same closing CTA. The "Meet the maker"
   section — and its personal portrait — is gone, replaced by an
   "Our philosophy" section with an original vector composition.
   ───────────────────────────────────────────────────────────────────── */

const VALUES = [
  {
    icon: <AutoAwesomeOutlined />,
    title: "Quality first",
    body: "Every story is crafted by writers who care — thoughtful analysis over noise, depth over clickbait.",
  },
  {
    icon: <Diversity3Outlined />,
    title: "Diverse voices",
    body: "Technology, health, travel, business and more — a spectrum of perspectives from a spectrum of people.",
  },
  {
    icon: <VisibilityOutlined />,
    title: "Reader-first",
    body: "A calm reading experience with a rich-text article view, thoughtful recommendations, and a comments thread built around you.",
  },
  {
    icon: <EmojiEventsOutlined />,
    title: "Earn as you engage",
    body: "Like, comment, and publish to earn points, climb levels, unlock badges, and redeem real rewards.",
  },
  {
    icon: <BoltOutlined />,
    title: "Built for writers",
    body: "A distraction-free editor with dictation, drafts, tagging, and one-click publish — from idea to live in minutes.",
  },
  {
    icon: <MenuBookOutlined />,
    title: "Always yours",
    body: "A persistent light & dark theme, fast code-split loading, and an interface that works wherever you read.",
  },
];

const STEPS = [
  {
    step: "01",
    icon: <MenuBookOutlined />,
    title: "READ",
    body: "Discover stories.",
  },
  {
    step: "02",
    icon: <EditNoteOutlined />,
    title: "WRITE",
    body: "Create your story.",
  },
  {
    step: "03",
    icon: <EmojiEventsOutlined />,
    title: "EARN",
    body: "Get rewarded.",
  },
];

const MISSION_POINTS = [
  { icon: <GroupsOutlined />, title: "Connect people", body: "Bridge ideas across communities and cultures." },
  { icon: <AutoAwesomeOutlined />, title: "Empower creators", body: "Give writers the tools and audience they deserve." },
  { icon: <TrendingUpOutlined />, title: "Create impact", body: "Spread knowledge that makes a real difference." },
];

const PHILOSOPHY = [
  "Thoughtful writing, over volume.",
  "Meaningful discovery, not an endless feed.",
  "Participation that rewards you back.",
];

// Deterministic, image-free avatars for the community card — initials on
// warm surfaces, so nothing is fetched and no real person is depicted.
const FACES = [
  { initials: "AR", bg: "#7C2D12" },
  { initials: "MK", bg: "#B45309" },
  { initials: "JD", bg: "#4A423A" },
  { initials: "SO", bg: "#9A3412" },
];

/* ── How it works: the connector between two desktop stages ────────── */

// Genuinely About-only: the orange rule + travelling pulse that joins the
// three stages of the read/write/earn loop on desktop.
const Rail = () => (
  <Box
    aria-hidden="true"
    sx={{
      display: { xs: "none", md: "flex" },
      alignItems: "flex-start",
      justifyContent: "center",
      pt: "55px", // lines up with the vertical centre of the stage node
      minWidth: 48,
    }}
  >
    <Box sx={{ position: "relative", width: "100%", height: "1px", bgcolor: "rgba(255,106,0,0.28)" }}>
      <Box
        sx={{
          position: "absolute",
          right: -2,
          top: -3,
          width: 7,
          height: 7,
          borderRadius: "50%",
          bgcolor: INK.orange,
          boxShadow: `0 0 12px ${INK.orange}`,
        }}
      />
      <Box
        className="ink-pulse"
        sx={{
          position: "absolute",
          left: "50%",
          top: -2,
          ml: "-2.5px",
          width: 5,
          height: 5,
          borderRadius: "50%",
          bgcolor: INK.orange2,
        }}
      />
    </Box>
  </Box>
);

/* ── Page ──────────────────────────────────────────────────────────── */

const AboutPage = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  return (
    <Box className="ink ink-about" component="main" sx={{ minHeight: "100vh" }}>
      {/* Ambient decoration — always behind the content, never interactive. */}
      <InkBackdrop drift />

      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Container maxWidth="lg" sx={{ pt: { xs: 5, md: 7 }, pb: { xs: 8, md: 12 } }}>
          {/* ══ Hero ════════════════════════════════════════════════ */}
          <Box
            component="section"
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1.05fr" },
              gap: { xs: 7, md: 6, lg: 8 },
              alignItems: "center",
            }}
          >
            {/* Left — the story */}
            <Box>
              <Reveal>
                <InkEyebrow>Our story</InkEyebrow>
              </Reveal>

              <Reveal delay={0.06}>
                <Typography
                  component="h1"
                  sx={{
                    fontFamily: FONT_DISPLAY,
                    fontWeight: 800,
                    fontSize: { xs: "2.35rem", sm: "3rem", md: "3.15rem", lg: "3.8rem" },
                    lineHeight: 1.04,
                    letterSpacing: "-0.035em",
                    color: INK.text,
                    mt: 2.5,
                  }}
                >
                  Writing that
                  <br />
                  earns your
                  <br />
                  <InkHighlight>
                    <Box component="span" sx={{ position: "relative", display: "inline-block" }}>
                      attention.
                      {/* hand-drawn underline swash */}
                      <Box
                        component="svg"
                        viewBox="0 0 220 12"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                        sx={{
                          position: "absolute",
                          left: 0,
                          bottom: { xs: -6, md: -9 },
                          width: "100%",
                          height: { xs: 7, md: 10 },
                          overflow: "visible",
                        }}
                      >
                        <path
                          d="M3 8.5 C 58 3, 148 2.5, 217 6.5"
                          fill="none"
                          stroke={INK.orange}
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          opacity="0.55"
                        />
                      </Box>
                    </Box>
                  </InkHighlight>
                </Typography>
              </Reveal>

              <Reveal delay={0.12}>
                <Typography
                  sx={{
                    mt: { xs: 4, md: 5 },
                    fontSize: { xs: "1.02rem", md: "1.12rem" },
                    lineHeight: 1.65,
                    color: INK.text,
                    fontWeight: 500,
                    maxWidth: 470,
                  }}
                >
                  InkWell is a home for thoughtful writing — and the readers and writers who make it thrive.
                </Typography>
              </Reveal>

              <Reveal delay={0.18}>
                <Typography
                  sx={{ mt: 2, fontSize: "0.95rem", lineHeight: 1.8, color: INK.text2, maxWidth: 505 }}
                >
                  Welcome to InkWell — your destination for insightful, engaging content across every topic that
                  matters.
                </Typography>
              </Reveal>

              <Reveal delay={0.24}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.75} sx={{ mt: { xs: 4.5, md: 5 } }}>
                  <InkPrimaryButton
                    size="large"
                    endIcon={<ArrowForwardRounded />}
                    onClick={() => navigate("/explore")}
                  >
                    Explore the blog
                  </InkPrimaryButton>
                  <InkGhostButton size="large" onClick={() => navigate("/register")}>
                    Become a writer
                  </InkGhostButton>
                </Stack>
              </Reveal>
            </Box>

            {/* Right — the cinematic workspace */}
            <Reveal y={0} delay={0.1} amount={0.15}>
              <Box sx={{ position: "relative" }}>
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.85, ease: EASE }}
                >
                  <Box className="ink-stage" sx={{ pt: 4, px: { xs: 1.5, sm: 2.5 }, pb: 0 }}>
                    {/* faint perspective floor grid, for depth behind the desk */}
                    <Box
                      aria-hidden="true"
                      sx={{
                        position: "absolute",
                        left: "-10%",
                        right: "-10%",
                        bottom: 0,
                        height: "46%",
                        backgroundImage: `linear-gradient(to right, ${INK.borderSoft} 1px, transparent 1px), linear-gradient(to bottom, ${INK.borderSoft} 1px, transparent 1px)`,
                        backgroundSize: "44px 30px",
                        transform: "perspective(420px) rotateX(58deg)",
                        transformOrigin: "bottom center",
                        opacity: 0.5,
                        maskImage: "linear-gradient(180deg, transparent, #000 55%)",
                        WebkitMaskImage: "linear-gradient(180deg, transparent, #000 55%)",
                        pointerEvents: "none",
                      }}
                    />
                    <Box sx={{ position: "relative" }}>
                      <WritingDeskScene />
                    </Box>
                  </Box>
                </motion.div>

                {/* ── Floating information cards ── */}
                <InkFloatingCard
                  float="ink-float-a"
                  sx={{
                    left: { xs: 4, sm: -16, md: -30 },
                    bottom: { xs: -24, sm: -22, md: -26 },
                    p: { xs: 1.5, sm: 1.75 },
                    width: { xs: 196, sm: 224 },
                  }}
                >
                  <Stack spacing={1.25}>
                    <InkAvatarGroup members={FACES} size={30} />
                    <Typography sx={{ fontSize: "0.78rem", lineHeight: 1.5, color: INK.text2, fontWeight: 500 }}>
                      A global community of{" "}
                      <Box component="span" sx={{ color: INK.text, fontWeight: 700 }}>
                        writers and readers.
                      </Box>
                    </Typography>
                  </Stack>
                </InkFloatingCard>

                {/* Hidden on the smallest screens so the frame stays uncluttered. */}
                <InkFloatingCard
                  float="ink-float-b"
                  sx={{ display: { xs: "none", sm: "block" }, right: { sm: -14, md: -26 }, top: { sm: 26, md: 38 }, p: 1.6 }}
                >
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: INK.orangeSoft,
                        color: INK.orange,
                        "& svg": { fontSize: 20 },
                      }}
                      aria-hidden="true"
                    >
                      <AutoStoriesOutlined />
                    </Box>
                    <Box>
                      <Typography
                        sx={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.1, color: INK.text }}
                      >
                        10K+
                      </Typography>
                      <Typography sx={{ fontSize: "0.72rem", color: INK.text3 }}>Stories Published</Typography>
                    </Box>
                  </Stack>
                </InkFloatingCard>

                <InkFloatingCard
                  float="ink-float-c"
                  sx={{ display: { xs: "none", md: "block" }, right: { md: -22 }, bottom: { md: -24 }, p: 1.6 }}
                >
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: INK.orangeSoft,
                        color: INK.orange,
                        "& svg": { fontSize: 20 },
                      }}
                      aria-hidden="true"
                    >
                      <GroupsOutlined />
                    </Box>
                    <Box>
                      <Typography
                        sx={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.1, color: INK.text }}
                      >
                        50K+
                      </Typography>
                      <Typography sx={{ fontSize: "0.72rem", color: INK.text3 }}>Active Readers</Typography>
                    </Box>
                  </Stack>
                </InkFloatingCard>
              </Box>
            </Reveal>
          </Box>

          {/* ══ Stats ═══════════════════════════════════════════════ */}
          <InkStatsBand sx={{ mt: { xs: 8, md: 12 } }} />

          <Box className="ink-rule" sx={{ mt: { xs: 9, md: 13 } }} />

          {/* ══ Values ══════════════════════════════════════════════ */}
          <Box component="section" sx={{ mt: { xs: 9, md: 13 } }}>
            <Reveal>
              <InkSectionHead
                eyebrow="What we value"
                title="What makes InkWell different"
                subtitle="Six principles that shape every page, every post, and every interaction."
                align="center"
                sx={{ mb: { xs: 5, md: 6.5 } }}
              />
            </Reveal>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                gap: { xs: 2.5, md: 3 },
              }}
            >
              {VALUES.map((v, i) => (
                <Reveal key={v.title} delay={(i % 3) * 0.08} amount={0.2} style={{ height: "100%" }}>
                  <InkValueCard icon={v.icon} title={v.title} body={v.body} index={i + 1} />
                </Reveal>
              ))}
            </Box>
          </Box>

          {/* ══ How it works ════════════════════════════════════════ */}
          <Box component="section" sx={{ mt: { xs: 10, md: 14 } }}>
            <Reveal>
              <InkSectionHead
                eyebrow="How it works"
                title="Read. Write. Earn."
                subtitle="A simple loop that rewards curiosity and craft."
                align="center"
                sx={{ mb: { xs: 5, md: 6.5 } }}
              />
            </Reveal>

            <Box
              className="ink-timeline"
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr auto 1fr auto 1fr" },
                gap: { xs: 2.5, md: 0 },
                alignItems: "stretch",
              }}
            >
              {STEPS.map((s, i) => (
                <React.Fragment key={s.step}>
                  <Reveal delay={i * 0.1} amount={0.2} style={{ height: "100%" }}>
                    <InkSurface
                      variant="hi"
                      sx={{
                        height: "100%",
                        p: { xs: 3, md: 3.5 },
                        pl: { xs: "84px", md: 3.5 },
                      }}
                    >
                      {/* Stage marker: on a phone it rides the timeline spine;
                          from md up it sits in flow at the top of the card. */}
                      <Box
                        aria-hidden="true"
                        sx={{
                          position: { xs: "absolute", md: "static" },
                          left: { xs: 0, md: "auto" },
                          top: { xs: 0, md: "auto" },
                          width: 54,
                          height: 54,
                          borderRadius: "16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: INK.orange,
                          bgcolor: "#1A1512",
                          border: "1px solid rgba(255,106,0,0.28)",
                          boxShadow: `0 0 0 6px ${INK.cardHi}, 0 0 24px rgba(255,106,0,0.14)`,
                          "& svg": { fontSize: 25 },
                        }}
                      >
                        {s.icon}
                      </Box>

                      <Typography
                        sx={{
                          fontFamily: FONT_DISPLAY,
                          fontWeight: 800,
                          fontSize: "0.78rem",
                          letterSpacing: "0.18em",
                          color: INK.orange,
                          mt: { xs: 0, md: 2.5 },
                        }}
                      >
                        {s.step}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: FONT_DISPLAY,
                          fontWeight: 700,
                          fontSize: "1.3rem",
                          color: INK.text,
                          mt: 0.5,
                          mb: 1,
                        }}
                      >
                        {s.title}
                      </Typography>
                      <Typography sx={{ fontSize: "0.9rem", lineHeight: 1.72, color: INK.text2 }}>
                        {s.body}
                      </Typography>
                    </InkSurface>
                  </Reveal>

                  {i < STEPS.length - 1 && <Rail />}
                </React.Fragment>
              ))}
            </Box>
          </Box>

          {/* ══ Mission ═════════════════════════════════════════════ */}
          <Box component="section" sx={{ mt: { xs: 10, md: 14 } }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1.25fr 1fr" },
                gap: { xs: 5, md: 6 },
                alignItems: "center",
              }}
            >
              <Reveal>
                <InkSectionHead eyebrow="Our mission" title="A better internet for thoughtful ideas." />
                <Typography sx={{ mt: 3, fontSize: "1rem", lineHeight: 1.85, color: INK.text, fontWeight: 500 }}>
                  We started InkWell with a simple belief: great writing deserves a great home.
                </Typography>
                <Typography sx={{ mt: 2, fontSize: "0.95rem", lineHeight: 1.85, color: INK.text2 }}>
                  Our mission is to give readers fresh perspectives and writers a platform to share knowledge,
                  creativity, and ideas that create a positive impact.
                </Typography>

                {/* Three compact pillars under the mission copy. `role="list"`
                    lives on the container and `role="listitem"` on the Reveal
                    wrappers, since the motion div sits between the two. */}
                <Box
                  role="list"
                  sx={{
                    mt: 4,
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                    gap: 2,
                  }}
                >
                  {MISSION_POINTS.map((m, i) => (
                    <Reveal key={m.title} role="listitem" delay={i * 0.08} y={18} amount={0.3}>
                      <Stack spacing={1.25}>
                        <Box
                          aria-hidden="true"
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: INK.orangeSofter,
                            border: "1px solid rgba(255,106,0,0.20)",
                            color: INK.orange,
                            "& svg": { fontSize: 19 },
                          }}
                        >
                          {m.icon}
                        </Box>
                        <Typography
                          sx={{
                            fontFamily: FONT_DISPLAY,
                            fontWeight: 700,
                            fontSize: "0.82rem",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: INK.text,
                          }}
                        >
                          {m.title}
                        </Typography>
                        <Typography sx={{ fontSize: "0.85rem", lineHeight: 1.65, color: INK.text3 }}>{m.body}</Typography>
                      </Stack>
                    </Reveal>
                  ))}
                </Box>
              </Reveal>

              {/* The quote card */}
              <Reveal delay={0.12} y={34}>
                <InkSurface
                  variant="quiet"
                  sx={{
                    p: { xs: 4, md: 5 },
                    borderColor: INK.borderWarm,
                    boxShadow: "0 24px 60px rgba(0,0,0,0.5), 0 0 60px rgba(255,106,0,0.10)",
                  }}
                >
                  {/* soft orange bloom + feather watermark, both behind the text */}
                  <Box
                    aria-hidden="true"
                    sx={{
                      position: "absolute",
                      inset: 0,
                      background: "radial-gradient(72% 60% at 88% 4%, rgba(255,106,0,0.20), transparent 62%)",
                      pointerEvents: "none",
                    }}
                  />
                  <Box
                    component="svg"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    sx={{
                      position: "absolute",
                      right: -14,
                      bottom: -10,
                      width: 168,
                      height: 168,
                      color: INK.orange,
                      opacity: 0.09,
                      pointerEvents: "none",
                    }}
                  >
                    <g fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
                      <line x1="16" y1="8" x2="2" y2="22" />
                      <line x1="17.5" y1="15" x2="9" y2="15" />
                    </g>
                  </Box>

                  <Box sx={{ position: "relative" }}>
                    <Typography
                      aria-hidden="true"
                      sx={{
                        fontFamily: FONT_DISPLAY,
                        fontSize: "5rem",
                        lineHeight: 0.7,
                        fontWeight: 800,
                        color: INK.orange,
                        opacity: 0.9,
                      }}
                    >
                      &ldquo;
                    </Typography>
                    <Typography
                      component="blockquote"
                      sx={{
                        mt: 1.5,
                        fontFamily: FONT_DISPLAY,
                        fontWeight: 800,
                        fontSize: { xs: "1.7rem", md: "2rem" },
                        lineHeight: 1.2,
                        letterSpacing: "-0.03em",
                        color: INK.text,
                      }}
                    >
                      Ideas change people.
                    </Typography>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 3 }}>
                      <Box sx={{ width: 28, height: 1, bgcolor: INK.orange }} />
                      <Typography
                        sx={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          color: INK.orange,
                        }}
                      >
                        InkWell
                      </Typography>
                    </Stack>
                  </Box>
                </InkSurface>
              </Reveal>
            </Box>
          </Box>

          {/* ══ Our philosophy ══════════════════════════════════════ */}
          <Box component="section" sx={{ mt: { xs: 10, md: 14 } }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1.1fr" },
                gap: { xs: 6, md: 7 },
                alignItems: "center",
              }}
            >
              <Reveal>
                <InkSectionHead eyebrow="Our philosophy" title="Great writing deserves a great home." />
                <Typography sx={{ mt: 3, fontSize: "0.95rem", lineHeight: 1.85, color: INK.text2 }}>
                  InkWell is built around three ideas: thoughtful writing, meaningful discovery, and rewarding
                  participation. Nothing here is designed to keep you scrolling — the page stays quiet, the writing
                  stays central, and the work you put in comes back to you.
                </Typography>

                <Stack role="list" spacing={1.75} sx={{ mt: 4 }}>
                  {PHILOSOPHY.map((p, i) => (
                    <Reveal key={p} role="listitem" delay={i * 0.08} y={16} amount={0.4}>
                      <Stack direction="row" spacing={1.75} alignItems="flex-start">
                        <Box
                          aria-hidden="true"
                          sx={{
                            mt: "7px",
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            flexShrink: 0,
                            bgcolor: INK.orange,
                            boxShadow: "0 0 10px rgba(255,106,0,0.7)",
                          }}
                        />
                        <Typography sx={{ fontSize: "0.95rem", lineHeight: 1.6, color: INK.text, fontWeight: 500 }}>
                          {p}
                        </Typography>
                      </Stack>
                    </Reveal>
                  ))}
                </Stack>
              </Reveal>

              {/* Second, deliberately different composition — book, pen,
                  pages and feather, with abstract ideas rising off them.
                  Illustration only: no portrait, per the brief. */}
              <Reveal delay={0.1} y={30} amount={0.15}>
                <Box className="ink-stage" sx={{ px: { xs: 2, md: 3 }, pt: { xs: 3, md: 4 } }}>
                  <Box
                    aria-hidden="true"
                    sx={{
                      position: "absolute",
                      inset: 0,
                      background: "radial-gradient(64% 52% at 74% 6%, rgba(255,106,0,0.16), transparent 62%)",
                      pointerEvents: "none",
                    }}
                  />
                  <Box sx={{ position: "relative" }}>
                    <PhilosophyScene />
                  </Box>
                </Box>
              </Reveal>
            </Box>
          </Box>

          {/* ══ Closing CTA ═════════════════════════════════════════ */}
          <Box component="section" sx={{ mt: { xs: 10, md: 14 } }}>
            <Reveal y={30}>
              <InkSurface
                variant="quiet"
                sx={{
                  borderRadius: "30px",
                  p: { xs: 4.5, sm: 6, md: 8 },
                  textAlign: "center",
                  borderColor: INK.borderWarm,
                  boxShadow: "0 30px 70px rgba(0,0,0,0.55), 0 0 70px rgba(255,106,0,0.10)",
                }}
              >
                {/* Decoration: bloom, corner glows and a feather watermark —
                    all behind the copy and non-interactive. */}
                <Box
                  aria-hidden="true"
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "radial-gradient(58% 70% at 50% 118%, rgba(255,106,0,0.22), transparent 66%), radial-gradient(38% 46% at 6% -6%, rgba(249,115,22,0.14), transparent 64%)",
                    pointerEvents: "none",
                  }}
                />
                <Box
                  component="svg"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  sx={{
                    position: "absolute",
                    left: { xs: -22, md: 24 },
                    bottom: { xs: -18, md: -12 },
                    width: { xs: 130, md: 170 },
                    height: { xs: 130, md: 170 },
                    color: INK.orange,
                    opacity: 0.11,
                    transform: "rotate(-18deg)",
                    pointerEvents: "none",
                  }}
                >
                  <g fill="none" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
                    <line x1="16" y1="8" x2="2" y2="22" />
                    <line x1="17.5" y1="15" x2="9" y2="15" />
                  </g>
                </Box>
                <Box
                  component="svg"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  sx={{
                    position: "absolute",
                    right: { xs: -26, md: 32 },
                    top: { xs: -16, md: -10 },
                    width: { xs: 150, md: 200 },
                    height: { xs: 150, md: 200 },
                    color: INK.orange,
                    opacity: 0.08,
                    transform: "rotate(22deg)",
                    pointerEvents: "none",
                  }}
                >
                  <g fill="none" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
                    <line x1="16" y1="8" x2="2" y2="22" />
                    <line x1="17.5" y1="15" x2="9" y2="15" />
                  </g>
                </Box>
                <Box
                  aria-hidden="true"
                  sx={{
                    position: "absolute",
                    left: "50%",
                    top: 0,
                    transform: "translateX(-50%)",
                    width: "62%",
                    height: 1,
                    background: `linear-gradient(90deg, transparent, ${INK.orange}, transparent)`,
                    opacity: 0.5,
                  }}
                />

                <Box sx={{ position: "relative" }}>
                  <InkEyebrow align="center">Ready when you are</InkEyebrow>
                  <Typography
                    component="h2"
                    sx={{
                      fontFamily: FONT_DISPLAY,
                      fontWeight: 800,
                      fontSize: { xs: "2rem", sm: "2.5rem", md: "2.9rem" },
                      lineHeight: 1.1,
                      letterSpacing: "-0.03em",
                      color: INK.text,
                      mt: 2.5,
                    }}
                  >
                    Start sharing your story.
                  </Typography>
                  <Typography
                    sx={{
                      mt: 2,
                      mx: "auto",
                      maxWidth: 540,
                      fontSize: "1rem",
                      lineHeight: 1.75,
                      color: INK.text2,
                    }}
                  >
                    Join a community of readers and writers. Your next favourite article — or your next published
                    one — is one click away.
                  </Typography>

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.75}
                    justifyContent="center"
                    sx={{ mt: 4.5 }}
                  >
                    <InkPrimaryButton
                      size="large"
                      endIcon={<ArrowForwardRounded />}
                      onClick={() => navigate("/register")}
                    >
                      Create an account
                    </InkPrimaryButton>
                    <InkGhostButton size="large" onClick={() => navigate("/explore")}>
                      Browse stories
                    </InkGhostButton>
                  </Stack>
                </Box>
              </InkSurface>
            </Reveal>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default AboutPage;
