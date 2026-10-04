import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import toast from 'react-hot-toast';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import EditNoteOutlined from '@mui/icons-material/EditNoteOutlined';
import ForumOutlined from '@mui/icons-material/ForumOutlined';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import { validateEmail } from '../utils/validate';
import { toastBookmarked } from '../utils/toasts';
import CommunitySection from '../components/CommunitySection';
import {
  INK,
  staggerContainer,
  riseIn,
  Reveal,
  InkBackdrop,
  InkEyebrow,
  InkHeading,
  InkHighlight,
  InkSectionHead,
  InkPrimaryButton,
  InkGhostButton,
  InkFloatingCard,
  InkFeather,
} from '../components/ink';
import './Home.css';

/* ─────────────────────────────────────────────────────────────────────
   InkWell — Home.

   The product landing / discovery page: cinematic hero, the community's
   freshest stories, and a newsletter CTA. Three sections — the card
   surfaces are reserved for the story grid and the newsletter panel, so
   no two sections read the same.

   There is deliberately no "by the numbers" band: the figures it used to
   show were invented, and InkWell publishes no number it cannot back with
   real data.

   Everything visual comes from the shared InkWell system (styles/
   inkwell.css + components/ink), so this page and About are visibly the
   same product. The page is always dark regardless of the app's
   light/dark theme, which is why it is wrapped in `ink`.
   ───────────────────────────────────────────────────────────────────── */

// How many recent posts to surface on the landing page.
const HOME_BLOG_LIMIT = 6;

// The three compact capabilities under the hero buttons. Deliberately a
// light inline row rather than three cards — see the brief's "do not make
// every section a card" rule.
const CAPABILITIES = [
  { icon: <EditNoteOutlined />, label: 'Create & Publish' },
  { icon: <ForumOutlined />, label: 'Engage Community' },
  { icon: <TrendingUpOutlined />, label: 'Grow Your Reach' },
];

// The hero's floating cards say what InkWell does — never how many people are
// doing it. Nothing here shows a figure, because every figure we could show
// would be invented: InkWell publishes no number it cannot back with real
// data. (See the REAL DATA OR NO DATA note in components/ink/InkStatsBand.)

// One floating card: an orange icon tile, a headline, a sub-line. The same
// shape the About hero's cards use, so both pages speak one visual language.
const HeroCard = ({ float, sx, icon, title, sub }) => (
  <InkFloatingCard float={float} sx={sx}>
    <Box sx={{ p: 1.35, pr: 1.6, display: 'flex', alignItems: 'center', gap: 1.15 }}>
      <Box
        aria-hidden="true"
        sx={{
          width: 34,
          height: 34,
          borderRadius: '12px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: INK.orangeSoft,
          color: INK.orange,
          '& svg': { fontSize: 19 },
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, color: INK.text, lineHeight: 1.35 }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: '0.68rem', color: INK.text3, lineHeight: 1.35 }}>
          {sub}
        </Typography>
      </Box>
    </Box>
  </InkFloatingCard>
);

const HeroVisual = () => (
  <Box className="ink-hero-visual">
    <Box className="ink-hero-halo" aria-hidden="true" />

    {/* The frame. Same `.ink-stage` primitive the About hero uses, so both
        pages share one container: same radius, border, warm spill, glow. */}
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
    >
      <Box className="ink-stage ink-hero-stage">
        <Box
          component="img"
          className="ink-stage-media"
          src="/inkwell-workspace.png"
          alt="A warm, lamplit writing desk — a laptop mid-draft, an open notebook, stacked books and a cup of coffee, with pages rising into the air"
        />
      </Box>
    </motion.div>

    {/* Upper left — the editor. */}
    <HeroCard
      float="ink-float-a"
      sx={{ top: 0, left: { xs: 0, md: '-2%' }, maxWidth: 236 }}
      icon={<EditNoteOutlined />}
      title="Distraction-free editor"
      sub="Draft, refine, publish"
    />

    {/* Right edge — the writing copilot. */}
    <HeroCard
      float="ink-float-b"
      sx={{ top: '38%', right: { xs: 0, md: '-3%' }, maxWidth: 236 }}
      icon={<AutoAwesomeOutlined />}
      title="AI-assisted writing"
      sub="Research and refine"
    />

    {/* Lower left — the community. */}
    <HeroCard
      float="ink-float-c"
      sx={{ bottom: 0, left: { xs: '4%', md: '2%' }, maxWidth: 236 }}
      icon={<GroupsOutlined />}
      title="A community of writers"
      sub="Follow, comment, and grow"
    />
  </Box>
);

const Home = () => {
  const navigate = useNavigate();
  const isLogin = useSelector((state) => state.auth.isLogin);
  const user = useSelector((state) => state.auth.user);

  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const [blogs, setBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [blogsError, setBlogsError] = useState(false);

  // Saved-post ids, fetched ONCE per page load rather than per card, so the
  // grid's bookmark icons reflect real state without N requests.
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

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

  // Seed the grid's bookmark state. Anonymous visitors are skipped so the
  // authed endpoint is never called without a session.
  useEffect(() => {
    let cancelled = false;
    const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');
    if (!isLogin || !currentUser?._id) {
      setBookmarkedIds([]);
      return undefined;
    }
    axios
      .get('/api/v1/bookmarks/ids')
      .then(({ data }) => {
        if (!cancelled && data.success) setBookmarkedIds(data.ids || []);
      })
      .catch(() => {
        // Non-critical — the grid simply renders as un-bookmarked.
      });
    return () => {
      cancelled = true;
    };
  }, [isLogin, user]);

  // Re-run the landing feed fetch (used by the grid's retry control).
  const refetchBlogs = () => {
    setLoadingBlogs(true);
    setBlogsError(false);
    axios
      .get(`/api/v1/blog/all-blog?page=1&limit=${HOME_BLOG_LIMIT}`)
      .then(({ data }) => setBlogs(data.success ? data.blogs || [] : []))
      .catch(() => setBlogsError(true))
      .finally(() => setLoadingBlogs(false));
  };

  // Real bookmark toggle, mirroring the BlogDetails pattern: optimistic
  // flip, revert on failure. Anonymous users are sent to sign in.
  const handleToggleBookmark = async (blogId) => {
    const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');
    if (!isLogin || !currentUser?._id) {
      toast('Log in to save articles.', { icon: '🔒' });
      navigate(`/login?redirect=${encodeURIComponent('/')}`);
      return;
    }
    setBookmarkedIds((prev) =>
      prev.includes(blogId) ? prev.filter((id) => id !== blogId) : [...prev, blogId]
    );
    try {
      const { data } = await axios.post('/api/v1/bookmarks/toggle', { blog: blogId });
      if (data.success) {
        setBookmarkedIds((prev) =>
          data.bookmarked
            ? prev.includes(blogId) ? prev : [...prev, blogId]
            : prev.filter((id) => id !== blogId)
        );
        toastBookmarked(data.bookmarked);
      }
    } catch {
      // Revert the optimistic flip.
      setBookmarkedIds((prev) =>
        prev.includes(blogId) ? prev.filter((id) => id !== blogId) : [...prev, blogId]
      );
      toast.error("Couldn't update bookmark.");
    }
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
    <Box className="ink ink-home" component="main">
      <InkBackdrop hero drift />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <Box component="section" className="ink-hero" aria-label="Introducing InkWell">
        <div className="ink-hero-grid">
          <motion.div
            className="ink-hero-copy"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={riseIn}>
              <InkEyebrow>Write • Share • Inspire</InkEyebrow>
            </motion.div>

            <motion.div variants={riseIn}>
              <InkHeading component="h1" size="hero" sx={{ mt: 2.5 }}>
                A home for
                <br />
                <InkHighlight>curious minds.</InkHighlight>
              </InkHeading>
            </motion.div>

            <motion.div variants={riseIn}>
              <p className="ink-hero-lede">
                InkWell is a modern blogging platform where ideas find their audience. Write
                freely, explore diverse perspectives, and connect with a global community of
                creators and readers.
              </p>
            </motion.div>

            <motion.div variants={riseIn} className="ink-hero-actions">
              <InkPrimaryButton
                size="large"
                onClick={startWriting}
                endIcon={<ArrowForwardRounded sx={{ fontSize: 19 }} />}
              >
                Start writing
              </InkPrimaryButton>
              <InkGhostButton size="large" onClick={() => navigate("/explore")}>
                Explore blogs
              </InkGhostButton>
            </motion.div>

            <motion.div variants={riseIn}>
              <div className="ink-hero-caps">
                {CAPABILITIES.map(({ icon, label }) => (
                  <Box
                    key={label}
                    component="span"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.75,
                      '& svg': { fontSize: 17, color: INK.orange },
                    }}
                  >
                    {icon}
                    <Typography
                      component="span"
                      sx={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: INK.text2,
                      }}
                    >
                      {label}
                    </Typography>
                  </Box>
                ))}
              </div>
            </motion.div>
          </motion.div>

          <HeroVisual />
        </div>
      </Box>

      {/* ── Featured stories (real feed, demo fallback) ───────────────── */}
      <CommunitySection
        blogs={blogs}
        loading={loadingBlogs}
        error={blogsError}
        onRetry={refetchBlogs}
        bookmarkedIds={bookmarkedIds}
        onToggleBookmark={handleToggleBookmark}
      />

      {/* ── Newsletter CTA ───────────────────────────────────────────── */}
      <Box component="section" className="ink-newsletter" aria-label="Newsletter">
        <div className="ink-home-section">
          <Reveal y={30} amount={0.2}>
            <div className="ink-newsletter-panel">
              <div className="ink-newsletter-motif">
                <InkFeather size={64} />
              </div>

              <div className="ink-newsletter-body">
                <InkSectionHead
                  eyebrow="Stay in the loop"
                  title="Get the best of InkWell, weekly"
                  subtitle="Fresh stories, writer spotlights, and platform updates — no spam, unsubscribe anytime."
                />

                <div className="ink-newsletter-form">
                  <input
                    className="ink-input"
                    type="email"
                    placeholder="you@example.com"
                    aria-label="Email address"
                    aria-invalid={Boolean(emailError)}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError('');
                    }}
                    onBlur={() => setEmailError(validateEmail(email))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSubscribe();
                    }}
                  />
                  <InkPrimaryButton
                    onClick={handleSubscribe}
                    disabled={isSubscribing}
                    endIcon={<ArrowForwardRounded sx={{ fontSize: 19 }} />}
                  >
                    {isSubscribing ? 'Subscribing…' : 'Subscribe'}
                  </InkPrimaryButton>
                </div>

                {emailError && (
                  <p className="ink-newsletter-msg ink-newsletter-msg--err" role="alert">
                    {emailError}
                  </p>
                )}
                {successMessage && (
                  <p className="ink-newsletter-msg ink-newsletter-msg--ok" role="status">
                    {successMessage}
                  </p>
                )}
                {errorMessage && (
                  <p className="ink-newsletter-msg ink-newsletter-msg--err" role="alert">
                    {errorMessage}
                  </p>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </Box>
    </Box>
  );
};

export default Home;
