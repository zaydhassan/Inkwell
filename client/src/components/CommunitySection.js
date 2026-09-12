import React, { useEffect, useMemo, useState } from "react";
import { Box, Container, Typography, Stack } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import BlogGrid from "./BlogGrid";
import BlogCard from "./BlogCard";
import SkeletonBlogCard from "./SkeletonBlogCard";
import PlaceholderBlogCard from "./PlaceholderBlogCard";
import MagneticButton from "./MagneticButton";
import GradientButton from "./GradientButton";
import Tilt from "./Tilt";
import generatePlaceholderPosts from "../data/placeholderPosts";

const POST_COUNT = 6;

// Stagger container — children with matching `hidden`/`visible` variants
// reveal in sequence (Linear-style).
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

// Inline SVG noise → data URI. Very low opacity, overlay blend, so the
// section gets a faint film grain without looking busy.
const NOISE_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// Ambient section background: a hairline grid texture and a noise pass only —
// no colored washes or blobs, keeping the section premium white. Everything
// is pointer-events:none and GPU-friendly (transform/opacity only).
const SectionBackground = () => (
  <Box
    aria-hidden
    sx={{
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      pointerEvents: "none",
      zIndex: 0,
    }}
  >
    {/* Hairline grid texture, faded at edges */}
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        backgroundImage: (t) =>
          `linear-gradient(${t.palette.divider} 1px, transparent 1px), linear-gradient(90deg, ${t.palette.divider} 1px, transparent 1px)`,
        backgroundSize: "44px 44px",
        opacity: 0.5,
        maskImage: "radial-gradient(circle at 50% 40%, #000 0%, transparent 75%)",
        WebkitMaskImage: "radial-gradient(circle at 50% 40%, #000 0%, transparent 75%)",
      }}
    />
    {/* Film grain */}
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        backgroundImage: NOISE_URI,
        opacity: 0.035,
        mixBlendMode: "overlay",
      }}
    />
  </Box>
);

// Animated section header: a pulsing "Fresh Ink" badge, a reveal-animated
// heading, and a glowing gradient underline.
const SectionHeader = () => (
  <Box>
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        sx={{
          display: "inline-flex",
          px: 1.25,
          py: 0.4,
          mb: 1.5,
          borderRadius: 999,
          bgcolor: "primary.bgSofter",
          border: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        <Box
          component="span"
          sx={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            bgcolor: "primary.main",
            boxShadow: "0 0 0 4px rgba(17,17,17,0.12)",
            animation: "underlineGlow 2.4s ease-in-out infinite",
          }}
        />
        <Typography variant="overline" sx={{ color: "primary.main", letterSpacing: "0.14em" }}>
          Fresh Ink
        </Typography>
      </Stack>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
    >
      <Typography
        variant="h3"
        component="h2"
        sx={{
          fontWeight: 800,
          fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
          letterSpacing: "-0.02em",
          color: "text.primary",
        }}
      >
        Stories worth your time.
      </Typography>
      <Typography variant="subtitle1" sx={{ mt: 1, color: "text.secondary" }}>
        Hand-picked stories from the InkWell community.
      </Typography>
      {/* Glowing animated underline */}
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        whileInView={{ width: 64, opacity: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
        style={{
          height: 4,
          borderRadius: 999,
          marginTop: 10,
          background: "linear-gradient(90deg, var(--accent), var(--accent-light))",
          boxShadow: "0 0 16px rgba(17,17,17,0.35)",
          animation: "underlineGlow 2.6s ease-in-out infinite 0.6s",
        }}
      />
    </motion.div>
  </Box>
);

// CTA shown after the grid (always — it nudges visitors toward writing).
const CtaBlock = ({ onStartWriting }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.5 }}
    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
  >
    <Box
      sx={{
        mt: 6,
        textAlign: "center",
        position: "relative",
        px: { xs: 3, md: 6 },
        py: { xs: 5, md: 7 },
        borderRadius: 4,
        overflow: "hidden",
        background: (t) => t.palette.background.paper,
        border: (t) => `1px solid ${t.palette.divider}`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: "-40%",
          left: "50%",
          width: "60%",
          height: "160%",
          transform: "translateX(-50%)",
          background:
            "radial-gradient(circle, rgba(17,17,17,0.05), transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
            letterSpacing: "-0.01em",
            color: "text.primary",
          }}
        >
          Your story could be the first.
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{ mt: 1.5, maxWidth: 560, mx: "auto", color: "text.secondary" }}
        >
          Inspire thousands of readers by publishing your first article.
        </Typography>
        <Box sx={{ mt: 3.5, display: "flex", justifyContent: "center" }}>
          <MagneticButton onClick={onStartWriting}>Start Writing</MagneticButton>
        </Box>
      </Box>
    </Box>
  </motion.div>
);

const CommunitySection = ({ blogs = [], loading = false, error = false, onRetry, onStartWriting }) => {
  // Randomize placeholder content once per mount.
  const placeholders = useMemo(() => generatePlaceholderPosts(POST_COUNT), []);
  // When the feed loads empty, keep skeletons for ~1s then crossfade into
  // the animated placeholders so the page reads as "loading", not "broken".
  const [showPlaceholders, setShowPlaceholders] = useState(false);

  useEffect(() => {
    if (loading || blogs.length > 0 || error) {
      setShowPlaceholders(false);
      return;
    }
    // Empty + done loading: brief skeleton hold, then reveal placeholders.
    const t = setTimeout(() => setShowPlaceholders(true), 1000);
    return () => clearTimeout(t);
  }, [loading, blogs.length, error]);

  const hasBlogs = blogs.length > 0;

  return (
    <Box component="section" sx={{ position: "relative" }}>
      <SectionBackground />
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, py: 6 }}>
        {/* Header + optional "View all" */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 2,
            mb: 4,
          }}
        >
          <SectionHeader />
          {!loading && !error && hasBlogs && (
            <Link to="/blogs" style={{ textDecoration: "none" }}>
              <Typography variant="body2" sx={{ color: "primary.main", fontWeight: 700, whiteSpace: "nowrap" }}>
                View all →
              </Typography>
            </Link>
          )}
        </Box>

        {/* Grid state machine */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skeletons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <BlogGrid>
                {Array.from({ length: POST_COUNT }).map((_, i) => (
                  <SkeletonBlogCard key={i} />
                ))}
              </BlogGrid>
            </motion.div>
          ) : error ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <Box sx={{ gridColumn: "1 / -1", textAlign: "center", py: 6 }}>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  We couldn't load the latest stories. Please try again.
                </Typography>
                <GradientButton onClick={onRetry}>Retry</GradientButton>
              </Box>
            </motion.div>
          ) : hasBlogs ? (
            <motion.div
              key="real"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <BlogGrid>
                {blogs.map((blog) => (
                  <motion.div key={blog._id} variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } } }} style={{ height: "100%" }}>
                    <Tilt>
                      <BlogCard
                        id={blog._id}
                        title={blog.title}
                        description={blog.description}
                        image={blog.image || "/tech1.jpeg"}
                        username={blog.user?.username}
                        profileImage={blog.user?.profile_image}
                        time={blog.created_at}
                        tags={blog.tags?.map((t) => (typeof t === "string" ? t : t?.tag_name)).filter(Boolean)}
                      />
                    </Tilt>
                  </motion.div>
                ))}
              </BlogGrid>
            </motion.div>
          ) : showPlaceholders ? (
            <motion.div
              key="placeholders"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <BlogGrid>
                {placeholders.map((post, i) => (
                  <motion.div
                    key={post.id}
                    variants={{ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}
                    style={{ height: "100%" }}
                  >
                    <Tilt>
                      <PlaceholderBlogCard post={post} index={i} />
                    </Tilt>
                  </motion.div>
                ))}
              </BlogGrid>
            </motion.div>
          ) : (
            <motion.div key="empty-skeletons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <BlogGrid>
                {Array.from({ length: POST_COUNT }).map((_, i) => (
                  <SkeletonBlogCard key={i} />
                ))}
              </BlogGrid>
            </motion.div>
          )}
        </AnimatePresence>

        <CtaBlock onStartWriting={onStartWriting} />
      </Container>
    </Box>
  );
};

export default CommunitySection;