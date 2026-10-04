import React from "react";
import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  ArrowForwardRounded,
  AutoAwesomeOutlined,
  AutoStoriesOutlined,
  BoltOutlined,
  Diversity3Outlined,
  EmojiEventsOutlined,
  GroupsOutlined,
  MenuBookOutlined,
  TrendingUpOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import {
  INK,
  FONT_DISPLAY,
  Reveal,
  InkBackdrop,
  InkSectionHead,
  InkEyebrow,
  InkHighlight,
  InkSurface,
  InkValueCard,
  InkStatsBand,
  InkPrimaryButton,
  InkGhostButton,
  InkFeather,
} from "../components/ink";
import {
  ScrollProgress,
  Section,
  EcosystemFlow,
  OrbitDiagram,
  ProblemLedger,
  SolutionWorkflow,
  AiComparison,
  AiFeatureGrid,
  WritingDemo,
  WriterJourney,
  ReaderJourney,
  CommunityDiagram,
  ReadWriteEarn,
  AuthorshipTimeline,
  FutureVision,
  ClosingCta,
} from "../components/about";
import "./About.css";

/* ─────────────────────────────────────────────────────────────────────
   InkWell — About.

   The page as a product story: what InkWell is, what is wrong with the way
   publishing usually works, what InkWell does about it, where the AI sits,
   and who it is for. Fifteen compositions, each one deliberately a different
   shape — a hero with a diagram, an orbit, three problem cards, a workflow,
   a comparison, a grid, a live demo, a timeline, a path, a network, a
   cinematic close — because a page this long that repeats one card grid
   fifteen times is a page nobody finishes.

   It owns no token layer: the root carries `.ink`, so every colour and every
   type step comes from `src/styles/inkwell.css` and `src/components/ink`.
   About.css holds only the layout specific to these compositions.

   Content is the existing page's content. The six values, the mission, the
   read/write/earn loop, both illustrations, the closing CTA and both routes
   (/explore, /register) are all preserved. The FACES initials discs are the
   one thing dropped, on purpose: a row of abstract "members" on a page with
   real members is social proof we cannot back with data.

   Every claim on this page is about how the product works. There is not a
   single figure on it — no user counts, no ratings, no growth percentages.
   See the REAL DATA OR NO DATA rule this app follows.
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

const MISSION_POINTS = [
  { icon: <GroupsOutlined />, title: "Connect people", body: "Bridge ideas across communities and cultures." },
  { icon: <AutoAwesomeOutlined />, title: "Empower creators", body: "Give writers the tools and audience they deserve." },
  { icon: <TrendingUpOutlined />, title: "Create impact", body: "Spread knowledge that makes a real difference." },
];

/* What the stats band shows instead of invented platform figures.
   Qualitative on purpose — InkWell publishes no numbers it cannot back with
   real data. See the REAL DATA OR NO DATA note in InkStatsBand. */
const HIGHLIGHTS = [
  { icon: <AutoStoriesOutlined />, title: "Human-first publishing", sub: "Written by people, for people." },
  { icon: <AutoAwesomeOutlined />, title: "AI-assisted writing", sub: "Draft, refine and research in place." },
  { icon: <VisibilityOutlined />, title: "Thoughtful discovery", sub: "Curated, not an endless feed." },
  { icon: <BoltOutlined />, title: "Creator-focused tools", sub: "Everything you need to publish well." },
];

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <Box className="ink ink-about" component="main">
      <InkBackdrop drift />
      <ScrollProgress />

      <Box className="ink-ab-wrap">
        {/* ── 01 · Story ─────────────────────────────────────────────── */}
        <Section id="story" label="Story" className="ink-ab-hero-sec">
          <Box className="ink-ab-hero">
            <Box className="ink-ab-hero-copy">
              <Reveal y={20}>
                <InkEyebrow>Our story</InkEyebrow>
              </Reveal>

              <Reveal delay={0.06}>
                <Typography component="h1" className="ink-ab-hero-title">
                  Writing that <InkHighlight>earns your attention</InkHighlight>.
                </Typography>
              </Reveal>

              <Reveal delay={0.12}>
                <Typography component="p" className="ink-ab-hero-lede">
                  InkWell is a place to write, read and think in public. It is built on one
                  belief: that a piece of writing should be found because it is worth reading,
                  not because it was published a minute ago.
                </Typography>
              </Reveal>

              <Reveal delay={0.18}>
                <Box className="ink-ab-hero-actions">
                  <InkPrimaryButton
                    size="large"
                    onClick={() => navigate("/explore")}
                    endIcon={<ArrowForwardRounded />}
                  >
                    Explore stories
                  </InkPrimaryButton>
                  <InkGhostButton size="large" onClick={() => navigate("/register")}>
                    Become a writer
                  </InkGhostButton>
                </Box>
              </Reveal>
            </Box>

            <Reveal delay={0.14} className="ink-ab-hero-viz">
              <Box className="ink-ab-hero-viz-inner">
                <EcosystemFlow />
              </Box>
            </Reveal>
          </Box>

          <Reveal delay={0.1}>
            <InkStatsBand values={HIGHLIGHTS} />
          </Reveal>
        </Section>

        {/* ── 02 · What it is ────────────────────────────────────────── */}
        <Section label="What InkWell is" className="ink-ab-sec-split">
          <InkSectionHead
            eyebrow="More than a place to publish"
            title={
              <>
                Everything a piece needs, <InkHighlight>orbiting the idea</InkHighlight>.
              </>
            }
            subtitle="Six things InkWell does. All of them sit around the thing you came to say."
            sx={{ maxWidth: 640 }}
          />
          <OrbitDiagram />
        </Section>

        {/* ── 03 · Problem ───────────────────────────────────────────── */}
        <Section id="problem" label="Problem">
          <InkSectionHead
            eyebrow="The problem"
            title="Writing online shouldn't feel like shouting into the void."
            subtitle="Three things make it feel that way. InkWell was built to answer all three."
          />
          <ProblemLedger />
        </Section>

        {/* ── 04 · Solution ──────────────────────────────────────────── */}
        <Section id="solution" label="Solution">
          <InkSectionHead
            eyebrow="The answer"
            title={
              <>
                One place for <InkHighlight>the entire journey</InkHighlight>.
              </>
            }
            subtitle="From the first thought to the last reply. Pick a step to see what happens in it."
          />
          <SolutionWorkflow />
        </Section>

        {/* ── 05 · The assistant ─────────────────────────────────────── */}
        <Section id="ai" label="AI">
          <InkSectionHead
            eyebrow="The assistant"
            title={
              <>
                AI that helps you think. <InkHighlight>Not AI that replaces you.</InkHighlight>
              </>
            }
            subtitle="Most AI writing tools end at the publish button. Ours starts before the draft."
          />
          <AiComparison />
        </Section>

        <Section label="What the assistant does">
          <InkSectionHead
            eyebrow="Six capabilities"
            title="What it actually does — and what it doesn't."
            subtitle="None of these six writes the piece for you. That is the whole design."
          />
          <AiFeatureGrid />
        </Section>

        {/* ── 06 · Try it ────────────────────────────────────────────── */}
        <Section label="Try it">
          <InkSectionHead
            eyebrow="A demonstration"
            title="See how InkWell helps you write."
            subtitle="Real suggestion, real buttons, running entirely in your browser. Nothing is sent anywhere."
          />
          <WritingDemo />
        </Section>

        {/* ── 07 · Writers ───────────────────────────────────────────── */}
        <Section id="writers" label="Writers">
          <InkSectionHead
            eyebrow="For writers"
            title="Built for people who have something to say."
            subtitle="Not for people who need to post. The difference shows in the tools."
          />
          <WriterJourney />
        </Section>

        {/* ── 08 · Readers ───────────────────────────────────────────── */}
        <Section id="readers" label="Readers">
          <InkSectionHead
            eyebrow="For readers"
            title={
              <>
                Built for people who love <InkHighlight>discovering ideas</InkHighlight>.
              </>
            }
            subtitle="Reading here is meant to end somewhere — with something saved, or something argued with."
          />
          <ReaderJourney />
        </Section>

        {/* ── 09 · The difference ────────────────────────────────────── */}
        <Section label="What makes InkWell different">
          <InkSectionHead
            eyebrow="The difference"
            title="What makes InkWell different"
            subtitle="Six commitments. Each one is a decision we made about how the product behaves."
          />
          <Box className="ink-ab-values">
            {VALUES.map((value, i) => (
              <Reveal key={value.title} delay={Math.min(i, 5) * 0.06}>
                <InkValueCard
                  icon={value.icon}
                  title={value.title}
                  body={value.body}
                  index={i}
                  sx={{ height: "100%" }}
                />
              </Reveal>
            ))}
          </Box>
        </Section>

        {/* ── 10 · Mission (the page's existing band) ────────────────── */}
        <Section label="Mission">
          <Box className="ink-ab-mission">
            <Box className="ink-ab-mission-main">
              <Typography
                component="span"
                sx={{
                  display: "block",
                  fontFamily: FONT_DISPLAY,
                  fontSize: "0.62rem",
                  fontWeight: 800,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: INK.orange,
                }}
              >
                Why we built it
              </Typography>
              <Typography
                component="h2"
                sx={{
                  m: "1rem 0 0",
                  fontFamily: FONT_DISPLAY,
                  fontSize: "clamp(1.6rem, 3.2vw, 2.3rem)",
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: "-0.03em",
                  color: INK.text,
                }}
              >
                A publishing platform should leave people better off than it found them.
              </Typography>

              <Box component="ul" className="ink-ab-mission-points">
                {MISSION_POINTS.map((point) => (
                  <Box component="li" key={point.title} className="ink-ab-mission-point">
                    <Box className="ink-ab-mission-icon" aria-hidden="true">
                      {point.icon}
                    </Box>
                    <Box>
                      <Typography
                        component="span"
                        sx={{
                          display: "block",
                          fontFamily: FONT_DISPLAY,
                          fontSize: "0.98rem",
                          fontWeight: 800,
                          color: INK.text,
                        }}
                      >
                        {point.title}
                      </Typography>
                      <Typography
                        component="span"
                        sx={{ display: "block", mt: "0.2rem", fontSize: "0.88rem", color: INK.text2 }}
                      >
                        {point.body}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            <Reveal delay={0.1} className="ink-ab-quote-reveal">
              <InkSurface variant="hi" className="ink-ab-quote">
                <Box className="ink-ab-quote-mark" aria-hidden="true">
                  <InkFeather />
                </Box>
                <Typography component="blockquote" className="ink-ab-quote-text">
                  Ideas change people.
                </Typography>
                <Typography component="p" className="ink-ab-quote-sub">
                  People change the world around them. That is the whole theory of this place.
                </Typography>
              </InkSurface>
            </Reveal>
          </Box>
        </Section>

        {/* ── 11 · The ecosystem ─────────────────────────────────────── */}
        <Section label="The ecosystem">
          <InkSectionHead
            eyebrow="The ecosystem"
            title="How it all fits together"
            subtitle="Six parts, one loop. The AI is one of the six — and it is not the centre."
          />
          <CommunityDiagram />
        </Section>

        {/* ── 12 · Read / write / earn (the page's existing loop) ────── */}
        <Section label="Read write earn">
          <InkSectionHead
            eyebrow="Three things you can do here"
            title={
              <>
                Read. Write. <InkHighlight>Earn</InkHighlight>.
              </>
            }
            subtitle="In that order — because you can do the first one before you have anything to say."
          />
          <ReadWriteEarn />
        </Section>

        {/* ── 13 · Transparency ──────────────────────────────────────── */}
        <Section label="Authorship">
          <InkSectionHead
            eyebrow="The rule we hold ourselves to"
            title="AI shouldn't make authors invisible."
            subtitle="Every step of a published piece is labelled with who did it. This is that label, at article scale."
          />
          <AuthorshipTimeline />
        </Section>

        {/* ── 14 · Future ────────────────────────────────────────────── */}
        <Section id="future" label="Future">
          <FutureVision />
        </Section>

        {/* ── 15 · The close ─────────────────────────────────────────── */}
        <Section label="Get started" className="ink-ab-cta-sec">
          <ClosingCta />
        </Section>
      </Box>
    </Box>
  );
};

export default AboutPage;
