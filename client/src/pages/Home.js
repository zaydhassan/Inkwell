import React, { useState, useEffect } from 'react';
import { Box, Container, TextField, Typography, Stack, Button, Chip } from '@mui/material';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ForumIcon from '@mui/icons-material/Forum';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StarRateIcon from '@mui/icons-material/StarRate';
import { validateEmail } from '../utils/validate';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import SectionHeading from '../components/SectionHeading';
import CommunitySection from '../components/CommunitySection';
import GradientText from '../components/GradientText';
import MetricsBand from '../components/MetricsBand';
import BlurImage from '../components/BlurImage';
import UserAvatar from '../components/UserAvatar';

// How many recent posts to surface on the landing page.
const HOME_BLOG_LIMIT = 6;

// Shared entrance easing — a gentle "settle" used across the hero.
const EASE = [0.22, 1, 0.36, 1];
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const riseIn = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

// Inline SVG noise → data URI (same treatment as the community section).
const NOISE_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// Atmospheric hero backdrop: only a hairline grid and a faint film grain —
// no colored washes or blobs, so the canvas stays premium white. All
// decorative and pointer-transparent.
const HeroBackdrop = () => (
  <Box aria-hidden sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        backgroundImage: (t) =>
          `linear-gradient(${t.palette.divider} 1px, transparent 1px), linear-gradient(90deg, ${t.palette.divider} 1px, transparent 1px)`,
        backgroundSize: '52px 52px',
        opacity: 0.35,
        maskImage: 'radial-gradient(circle at 50% 30%, #000 0%, transparent 72%)',
        WebkitMaskImage: 'radial-gradient(circle at 50% 30%, #000 0%, transparent 72%)',
      }}
    />
    <Box sx={{ position: 'absolute', inset: 0, backgroundImage: NOISE_URI, opacity: 0.03, mixBlendMode: 'overlay' }} />
  </Box>
);

// Gentle perpetual float for the collage's glass cards. Disabled entirely
// when the user prefers reduced motion.
const FloatCard = ({ children, duration = 6, delay = 0, sx, ...props }) => {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      animate={prefersReducedMotion ? {} : { y: [0, -9, 0] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
      style={{ position: 'absolute', ...sx }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// The right-hand editorial collage: the hero photo framed as a card, with
// three floating glass artifacts (an editor's-pick badge, a reads metric,
// and an author identity chip) layered around it for depth.
const HeroCollage = () => (
  <Box
    sx={{
      position: 'relative',
      height: { xs: 340, sm: 420, md: 480 },
      maxWidth: 560,
      width: '100%',
      mx: 'auto',
    }}
  >
    {/* Soft gradient halo behind the composition */}
    {/* Soft neutral halo behind the composition — white depth, no tint. */}
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        inset: { xs: '-8%', md: '-6%' },
        background: 'radial-gradient(circle at 55% 45%, rgba(17,17,17,0.05), transparent 62%)',
        filter: 'blur(30px)',
      }}
    />

    {/* Main image card */}
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
      style={{
        position: 'absolute',
        left: '4%',
        right: '8%',
        top: '12%',
        bottom: '10%',
      }}
    >
      <BlurImage
        src="/hero.jpg"
        alt="A writer's desk bathed in morning light — stories taking flight"
        zoomOnHover={false}
        sx={{
          height: '100%',
          borderRadius: '24px',
          border: (t) => `1px solid ${t.palette.divider}`,
          boxShadow: (t) => t.customShadows?.cardHover,
        }}
      />
    </motion.div>

    {/* Editor's pick — upper-left overlap */}
    <FloatCard duration={6.5} sx={{ top: { xs: '2%', md: '4%' }, left: { xs: 0, md: '-4%' }, zIndex: 2 }}>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.45 }}>
        <GlassCard sx={{ p: 1.75, pr: 2.5, display: 'flex', alignItems: 'center', gap: 1.25, maxWidth: 230 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(17,17,17,0.06)',
              color: 'primary.main',
              flexShrink: 0,
            }}
          >
            <StarRateIcon sx={{ fontSize: 19 }} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', display: 'block', lineHeight: 1.3 }}>
              Editor's Pick
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', display: 'block' }}>
              Featured this week
            </Typography>
          </Box>
        </GlassCard>
      </motion.div>
    </FloatCard>

    {/* Reads metric — right edge, upper third */}
    <FloatCard duration={7.5} delay={0.6} sx={{ top: '30%', right: { xs: 0, md: '-5%' }, zIndex: 2 }}>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.6 }}>
        <GlassCard sx={{ p: 1.75, minWidth: 150 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <VisibilityIcon sx={{ fontSize: 17, color: 'primary.main' }} />
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.85rem' }}>
              2.4k
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>
              reads this week
            </Typography>
          </Stack>
          {/* Mini sparkline */}
          <Stack direction="row" spacing={0.5} alignItems="flex-end" sx={{ height: 26 }}>
            {[35, 55, 42, 78, 100].map((h, i) => (
              <Box
                key={i}
                sx={{
                  width: 7,
                  height: `${h}%`,
                  borderRadius: '3px 3px 0 0',
                  background: (t) =>
                    i === 4
                      ? `linear-gradient(180deg, ${t.palette.primary.light}, ${t.palette.primary.main})`
                      : t.palette.divider,
                }}
              />
            ))}
          </Stack>
        </GlassCard>
      </motion.div>
    </FloatCard>

    {/* Author identity chip — bottom-left */}
    <FloatCard duration={6} delay={1.1} sx={{ bottom: { xs: '4%', md: '6%' }, left: { xs: '2%', md: '0%' }, zIndex: 2 }}>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.75 }}>
        <GlassCard sx={{ p: 1.25, pr: 2, display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <UserAvatar src="/default-avatar.png" name="Maya Chen" sx={{ width: 34, height: 34 }} />
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', display: 'block', lineHeight: 1.3 }}>
              Maya Chen
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', display: 'block' }}>
              published a new story
            </Typography>
          </Box>
          <Box
            sx={{
              ml: 0.5,
              width: 7,
              height: 7,
              borderRadius: '50%',
              bgcolor: 'success.main',
              boxShadow: '0 0 0 3px rgba(22,163,74,0.18)',
            }}
          />
        </GlassCard>
      </motion.div>
    </FloatCard>
  </Box>
);

// Three capability blocks under the hero.
const FEATURES = [
  {
    icon: <EditNoteIcon />,
    title: 'Create & Publish',
    copy: 'A distraction-free editor with drafts, revisions, and one-click publishing — writing stays the hard part, not the tooling.',
  },
  {
    icon: <ForumIcon />,
    title: 'Engage Community',
    copy: 'Comments, bookmarks, and real-time notifications keep every story a conversation, not a broadcast.',
  },
  {
    icon: <TrendingUpIcon />,
    title: 'Grow Your Reach',
    copy: 'Analytics, writing streaks, badges, and a leaderboard that reward consistency and quality in equal measure.',
  },
];

const FeatureStrip = () => (
  <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
    <Box
      component="motion.div"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={staggerContainer}
      sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: { xs: 2.5, md: 3 } }}
    >
      {FEATURES.map((f) => (
        <motion.div key={f.title} variants={riseIn} style={{ height: '100%' }}>
          <GlassCard
            glowOnHover
            sx={{ height: '100%', p: { xs: 3, md: 3.5 } }}
          >
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.bgSofter',
                color: 'primary.main',
                border: (t) => `1px solid ${t.palette.divider}`,
                mb: 2,
              }}
            >
              {f.icon}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', letterSpacing: '-0.01em' }}>
              {f.title}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', lineHeight: 1.65 }}>
              {f.copy}
            </Typography>
          </GlassCard>
        </motion.div>
      ))}
    </Box>
  </Container>
);

const Home = () => {
  const navigate = useNavigate();
  const isLogin = useSelector(state => state.auth.isLogin);
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const [blogs, setBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [blogsError, setBlogsError] = useState(false);

  // Fetch real, published posts for the landing grid instead of hardcoding
  // dummy cards. A loading skeleton fills the grid while the request is in
  // flight; a failure shows a retry control rather than an empty grid.
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoadingBlogs(true);
        setBlogsError(false);
        const { data } = await axios.get(`/api/v1/blog/all-blog?page=1&limit=${HOME_BLOG_LIMIT}`);
        setBlogs(data.success ? data.blogs || [] : []);
      } catch (error) {
        setBlogsError(true);
      } finally {
        setLoadingBlogs(false);
      }
    };
    fetchBlogs();
  }, []);

  // Re-run the landing feed fetch (used by the community section's retry
  // control when the initial request fails).
  const refetchBlogs = () => {
    setLoadingBlogs(true);
    setBlogsError(false);
    axios
      .get(`/api/v1/blog/all-blog?page=1&limit=${HOME_BLOG_LIMIT}`)
      .then(({ data }) => setBlogs(data.success ? data.blogs || [] : []))
      .catch(() => setBlogsError(true))
      .finally(() => setLoadingBlogs(false));
  };

  const handleSubscribe = async () => {
    const err = validateEmail(email);
    setEmailError(err);
    if (err) {
      setErrorMessage('');
      setSuccessMessage('');
      return;
    }
    setIsSubscribing(true);
    try {
      const response = await axios.post('/api/v1/newsletter/subscribe', { email });
      if (response.data.success) {
        setSuccessMessage("You're in! Check your inbox to confirm. 🎉");
        setErrorMessage('');
        setEmail('');
      } else {
        throw new Error('Subscription failed.');
      }
    } catch (error) {
      setErrorMessage("We couldn't subscribe you — please try again in a moment.");
      setSuccessMessage('');
    } finally {
      setIsSubscribing(false);
    }
  };

  const startWriting = () => navigate(isLogin ? '/create-blog' : '/register');

  return (
    <Box>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <Box sx={{ position: 'relative', overflow: 'hidden', pt: { xs: 5, md: 7 }, pb: { xs: 8, md: 10 } }}>
        <HeroBackdrop />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.05fr 1fr' },
              gap: { xs: 6, md: 4 },
              alignItems: 'center',
            }}
          >
            {/* LEFT — copy */}
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <motion.div variants={riseIn}>
                <Chip
                  label="WRITE • SHARE • INSPIRE"
                  sx={{
                    bgcolor: 'primary.bgSofter',
                    color: 'primary.main',
                    border: (t) => `1px solid ${t.palette.divider}`,
                    fontWeight: 700,
                    letterSpacing: '0.16em',
                    fontSize: '0.68rem',
                    height: 30,
                    mb: 3,
                  }}
                />
              </motion.div>

              <motion.div variants={riseIn}>
                <Typography
                  variant="h1"
                  component="h1"
                  sx={{
                    fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                    fontWeight: 800,
                    fontSize: { xs: '2.7rem', sm: '3.4rem', md: 'clamp(3rem, 4.6vw, 4.3rem)' },
                    lineHeight: 1.06,
                    letterSpacing: '-0.03em',
                    color: 'text.primary',
                    maxWidth: 620,
                  }}
                >
                  A home for{' '}
                  <GradientText sx={{ display: 'inline-block' }}>
                    curious minds.
                  </GradientText>
                </Typography>
              </motion.div>

              <motion.div variants={riseIn}>
                <Typography
                  variant="subtitle1"
                  sx={{ color: 'text.secondary', maxWidth: 540, mt: 2.5, lineHeight: 1.75, fontSize: { xs: '1rem', md: '1.1rem' } }}
                >
                  Inkwell is a modern blogging platform where ideas find their audience.
                  Write freely, explore diverse perspectives, and connect with a global
                  community of creators and readers.
                </Typography>
              </motion.div>

              <motion.div variants={riseIn}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }} alignItems={{ sm: 'center' }}>
                  <GradientButton size="large" endIcon={<ArrowForwardIcon />} onClick={startWriting}>
                    Start Writing
                  </GradientButton>
                  <Button
                    size="large"
                    onClick={() => navigate('/blogs')}
                    sx={{
                      borderRadius: 4,
                      textTransform: 'none',
                      fontWeight: 700,
                      color: 'text.primary',
                      border: (t) => `1px solid ${t.palette.divider}`,
                      bgcolor: 'background.paper',
                      px: 3,
                      '&:hover': {
                        bgcolor: 'primary.bgSofter',
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all .2s ease',
                    }}
                  >
                    Explore Blogs
                  </Button>
                </Stack>
              </motion.div>

              {/* Three small benefits with minimal charcoal line icons. */}
              <motion.div variants={riseIn}>
                <Stack direction="row" spacing={2.5} sx={{ mt: 3.5, flexWrap: 'wrap', rowGap: 1 }}>
                  {[
                    { label: 'Create & Publish', Icon: EditNoteIcon },
                    { label: 'Engage Community', Icon: ForumIcon },
                    { label: 'Grow Your Reach', Icon: TrendingUpIcon },
                  ].map(({ label, Icon }) => (
                    <Stack key={label} direction="row" spacing={0.75} alignItems="center">
                      <Icon sx={{ fontSize: 17, color: 'primary.main' }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {label}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </motion.div>
            </motion.div>

            {/* RIGHT — editorial collage */}
            <HeroCollage />
          </Box>
        </Container>
      </Box>

      {/* ── Feature strip ────────────────────────────────────────────── */}
      <Box sx={{ pb: { xs: 6, md: 8 } }}>
        <FeatureStrip />
      </Box>

      {/* ── Featured stories (real feed, placeholder fallback) ───────── */}
      <CommunitySection
        blogs={blogs}
        loading={loadingBlogs}
        error={blogsError}
        onRetry={refetchBlogs}
        onStartWriting={startWriting}
      />

      {/* ── Social proof ─────────────────────────────────────────────── */}
      <MetricsBand />

      {/* ── Newsletter ───────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ pb: { xs: 8, md: 10 } }}>
        <GlassCard sx={{ p: { xs: 3, md: 5 }, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              top: '-40%',
              left: '50%',
              width: '60%',
              height: '160%',
              transform: 'translateX(-50%)',
              background: 'radial-gradient(circle, rgba(17,17,17,0.04), transparent 70%)',
              filter: 'blur(50px)',
              pointerEvents: 'none',
            }}
          />
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <SectionHeading
              eyebrow="Stay in the loop"
              title="Get the best of Inkwell, weekly"
              subtitle="Fresh stories, writer spotlights, and platform updates — no spam, unsubscribe anytime."
              align="center"
              sx={{ mb: 3 }}
            />
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              justifyContent="center"
              alignItems="center"
            >
              <TextField
                placeholder="you@example.com"
                aria-label="Email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                onBlur={() => setEmailError(validateEmail(email))}
                error={Boolean(emailError)}
                helperText={emailError}
                sx={{ width: '100%', maxWidth: 400 }}
              />
              <GradientButton onClick={handleSubscribe} disabled={isSubscribing} sx={{ whiteSpace: 'nowrap' }}>
                {isSubscribing ? 'Subscribing…' : 'Subscribe'}
              </GradientButton>
            </Stack>
            {successMessage && (
              <Typography variant="body2" sx={{ mt: 2, color: 'success.main' }}>{successMessage}</Typography>
            )}
            {errorMessage && (
              <Typography variant="body2" sx={{ mt: 2, color: 'error.main' }}>{errorMessage}</Typography>
            )}
          </Box>
        </GlassCard>
      </Container>
    </Box>
  );
};

export default Home;