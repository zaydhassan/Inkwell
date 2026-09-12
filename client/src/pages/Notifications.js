import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Stack,
  Tabs,
  Tab,
  CircularProgress,
  Skeleton,
  Button,
} from "@mui/material";
import axios from "axios";
import toast from "react-hot-toast";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ReplyIcon from "@mui/icons-material/Reply";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import NotificationsIcon from "@mui/icons-material/Notifications";
import GlassCard from "../components/GlassCard";
import GradientButton from "../components/GradientButton";
import SectionHeading from "../components/SectionHeading";
import UserAvatar from "../components/UserAvatar";

const TYPE_ICON = {
  like: FavoriteBorderIcon,
  comment: ChatBubbleOutlineIcon,
  reply: ReplyIcon,
  levelUp: EmojiEventsIcon,
  badge: MilitaryTechIcon,
  system: NotificationsIcon,
};

const TYPE_COLOR = {
  like: "var(--accent)",
  comment: "var(--text-secondary)",
  reply: "var(--text-disabled)",
  levelUp: "var(--accent)",
  badge: "var(--accent)",
  system: "var(--text-secondary)",
};

const relativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const Notifications = () => {
  const navigate = useNavigate();
  const [all, setAll] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tab, setTab] = useState(0); // 0 = All, 1 = Unread

  const fetchPage = useCallback(async (p, append) => {
    try {
      if (append) setLoadingMore(true); else setLoading(true);
      const { data } = await axios.get(`/api/v1/notifications?page=${p}&limit=20`);
      setAll((prev) => (append ? [...prev, ...(data.notifications || [])] : data.notifications || []));
      setHasMore(!!data.hasMore);
      setPage(p);
    } catch {
      if (!append) setAll([]);
      toast.error("Couldn't load notifications.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(1, false);
  }, [fetchPage]);

  const visible = tab === 1 ? all.filter((n) => !n.read) : all;

  const handleItemClick = async (n) => {
    // Mark read on the server + locally.
    if (!n.read) {
      try {
        await axios.patch(`/api/v1/notifications/${n._id}/read`);
        setAll((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      } catch {
        // non-critical
      }
    }
    if (n.blog?._id) navigate(`/blog-details/${n.blog._id}`);
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.patch("/api/v1/notifications/read-all");
      setAll((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Couldn't mark notifications as read.");
    }
  };

  const hasUnread = all.some((n) => !n.read);

  return (
    <Box sx={{ minHeight: "100vh", p: { xs: 2, md: 4 } }}>
      <SectionHeading
        eyebrow="Stay in the loop"
        title="Notifications"
        subtitle="Likes, comments, replies, and milestones — all in one place."
        badge
        align="left"
        sx={{ mb: 4 }}
      />

      <Box sx={{ maxWidth: 760, mx: "auto" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="All" />
            <Tab label="Unread" />
          </Tabs>
          {hasUnread && (
            <Button size="small" onClick={handleMarkAllRead} sx={{ textTransform: "none", fontWeight: 700, color: "primary.main" }}>
              Mark all read
            </Button>
          )}
        </Box>

        {loading ? (
          <Stack spacing={1.5}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: 4 }} />
            ))}
          </Stack>
        ) : visible.length === 0 ? (
          <GlassCard sx={{ p: 6, textAlign: "center" }}>
            <NotificationsIcon sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              {tab === 1 ? "No unread notifications" : "You're all caught up"}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {tab === 1
                ? "You've read everything — nice work."
                : "Likes, comments, and milestones will show up here."}
            </Typography>
          </GlassCard>
        ) : (
          <Stack spacing={1.5}>
            {visible.map((n) => {
              const Icon = TYPE_ICON[n.type] || NotificationsIcon;
              const color = TYPE_COLOR[n.type] || "var(--accent)";
              return (
                <GlassCard
                  key={n._id}
                  glowOnHover
                  onClick={() => handleItemClick(n)}
                  sx={{
                    p: 2,
                    cursor: "pointer",
                    display: "flex",
                    gap: 1.5,
                    alignItems: "flex-start",
                    borderLeft: n.read ? undefined : (t) => `3px solid ${t.palette.primary.main}`,
                  }}
                >
                  <Box sx={{ mt: 0.25, color, display: "flex" }}>
                    <Icon />
                  </Box>
                  <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {n.actor && (
                        <UserAvatar
                          src={n.actor.profile_image}
                          name={n.actor.username}
                          sx={{ width: 22, height: 22 }}
                        />
                      )}
                      <Box component="span" sx={{ fontWeight: n.read ? 500 : 700 }}>
                        {n.text || "New notification"}
                      </Box>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {relativeTime(n.created_at)}
                      {n.blog?.title ? ` · ${n.blog.title}` : ""}
                    </Typography>
                  </Stack>
                </GlassCard>
              );
            })}

            {hasMore && tab === 0 && (
              <Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}>
                <GradientButton
                  onClick={() => fetchPage(page + 1, true)}
                  disabled={loadingMore}
                  sx={{ borderRadius: 999, px: 3 }}
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </GradientButton>
              </Box>
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default Notifications;