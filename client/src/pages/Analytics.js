import React, { useEffect, useState } from "react";
import axios from "axios";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
} from "chart.js";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  Grid,
  Typography,
  Stack,
  Skeleton,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CommentIcon from "@mui/icons-material/Comment";
import ArticleIcon from "@mui/icons-material/Article";
import GlassCard from "../components/GlassCard";
import SectionHeading from "../components/SectionHeading";
import GradientButton from "../components/GradientButton";
import { useAuth } from "../context/AuthContext";

// Register everything the three chart types need. LineElement/PointElement/Filler
// are added on top of the AdminPanel registration set.
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler
);

const Analytics = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get("/api/v1/analytics");
        if (data.success) setStats(data);
        else setError(true);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Readers don't author posts — the route is writer-gated server-side, so this
  // is a friendly guard rather than a security boundary.
  if (user && user.role === "Reader") {
    return (
      <Box sx={{ minHeight: "100vh", p: { xs: 2, md: 4 } }}>
        <SectionHeading eyebrow="Writers only" title="Author Analytics" align="left" sx={{ mb: 4 }} />
        <Box sx={{ maxWidth: 720, mx: "auto" }}>
          <GlassCard sx={{ p: 6, textAlign: "center" }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Analytics are for writers</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
              Once you publish an article, your engagement stats will appear here.
            </Typography>
            <GradientButton onClick={() => navigate("/create-blog")}>Write your first post</GradientButton>
          </GlassCard>
        </Box>
      </Box>
    );
  }

  // Skeleton mirrors the dashboard layout: four stat cards + chart panels.
  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', p: { xs: 2, md: 4 } }}>
        <Skeleton variant="text" width={220} height={38} sx={{ mb: 3 }} />
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={120} sx={{ borderRadius: 4 }} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rounded" height={340} sx={{ borderRadius: 4 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rounded" height={340} sx={{ borderRadius: 4 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error || !stats) {
    return (
      <Box sx={{ minHeight: "100vh", p: { xs: 2, md: 4 } }}>
        <SectionHeading eyebrow="Insights" title="Author Analytics" align="left" sx={{ mb: 4 }} />
        <Box sx={{ maxWidth: 720, mx: "auto", textAlign: "center" }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>Couldn’t load your analytics. Please try again.</Typography>
          <GradientButton onClick={() => window.location.reload()}>Retry</GradientButton>
        </Box>
      </Box>
    );
  }

  const { kpis, timeseries, topPosts, categories } = stats;

  const gridColor = theme.palette.divider;
  const textColor = theme.palette.text.secondary;
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: textColor } } },
    scales: {
      x: { ticks: { color: textColor }, grid: { color: gridColor } },
      y: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true },
    },
  };

  const statTile = (label, value, icon) => (
    <GlassCard sx={{ p: 3 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: 2, bgcolor: "brandSoft", color: "primary.main" }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: "Plus Jakarta Sans, Inter, sans-serif", lineHeight: 1 }}>
            {value}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>{label}</Typography>
        </Box>
      </Stack>
    </GlassCard>
  );

  const hasData = kpis.totalPosts > 0;

  return (
    <Box sx={{ minHeight: "100vh", p: { xs: 2, md: 4 } }}>
      <SectionHeading
        eyebrow="Insights"
        title="Author Analytics"
        subtitle="How your writing is performing over the last 30 days."
        badge
        align="left"
        sx={{ mb: 4 }}
      />

      <Box sx={{ maxWidth: 1100, mx: "auto" }}>
        {/* KPIs */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>{statTile("Total Views", kpis.totalViews, <VisibilityIcon />)}</Grid>
          <Grid item xs={12} sm={6} md={3}>{statTile("Total Likes", kpis.totalLikes, <FavoriteIcon />)}</Grid>
          <Grid item xs={12} sm={6} md={3}>{statTile("Total Comments", kpis.totalComments, <CommentIcon />)}</Grid>
          <Grid item xs={12} sm={6} md={3}>{statTile("Published Posts", kpis.publishedPosts, <ArticleIcon />)}</Grid>
        </Grid>

        {!hasData ? (
          <GlassCard sx={{ p: 6, textAlign: "center" }}>
            <Typography variant="h6" sx={{ mb: 1 }}>No posts to analyze yet</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
              Publish your first article and engagement stats will appear here.
            </Typography>
            <GradientButton onClick={() => navigate("/create-blog")}>Create a post</GradientButton>
          </GlassCard>
        ) : (
          <>
            {/* 30-day engagement line chart */}
            <GlassCard sx={{ p: 3, height: 380, mb: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Engagement (last 30 days)</Typography>
              <Box sx={{ height: 300 }}>
                <Line
                  data={{
                    labels: timeseries.labels,
                    datasets: [
                      { label: "Views", data: timeseries.views, borderColor: "#111111", backgroundColor: "rgba(17,17,17,0.10)", fill: true, tension: 0.35 },
                      { label: "Likes", data: timeseries.likes, borderColor: "#52525B", backgroundColor: "rgba(82,82,91,0.12)", fill: true, tension: 0.35 },
                      { label: "Comments", data: timeseries.comments, borderColor: "#9CA3AF", backgroundColor: "rgba(156,163,175,0.12)", fill: true, tension: 0.35 },
                    ],
                  }}
                  options={chartOptions}
                />
              </Box>
            </GlassCard>

            <Grid container spacing={3}>
              {/* Top posts by views */}
              <Grid item xs={12} md={7}>
                <GlassCard sx={{ p: 3, height: 380 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Top posts by views</Typography>
                  <Box sx={{ height: 300 }}>
                    <Bar
                      data={{
                        labels: topPosts.map((p) => p.title.length > 24 ? p.title.slice(0, 24) + "…" : p.title),
                        datasets: [{ label: "Views", data: topPosts.map((p) => p.views), backgroundColor: "#111111", borderRadius: 6 }],
                      }}
                      options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }}
                    />
                  </Box>
                </GlassCard>
              </Grid>

              {/* Category mix */}
              <Grid item xs={12} md={5}>
                <GlassCard sx={{ p: 3, height: 380 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Posts by category</Typography>
                  <Box sx={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {categories.length > 0 ? (
                      <Pie
                        data={{
                          labels: categories.map((c) => c.category),
                          datasets: [{
                            data: categories.map((c) => c.count),
                            backgroundColor: ["#111111", "#52525B", "#A3A3A3", "#404040", "#D4D4D4", "#10B981", "#737373", "#262626"],
                            borderColor: theme.palette.background.paper,
                            borderWidth: 2,
                          }],
                        }}
                        options={{ ...chartOptions, scales: undefined }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">No categories yet.</Typography>
                    )}
                  </Box>
                </GlassCard>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Analytics;