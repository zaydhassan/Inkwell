import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  Stack,
  Divider,
  CircularProgress,
  Button,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import axios from "axios";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ReplyIcon from "@mui/icons-material/Reply";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import { useAuth } from "../context/AuthContext";
import UserAvatar from "./UserAvatar";
import {
  fetchUnreadCount,
  markAllNotificationsRead,
  decrementUnread,
} from "../redux/store";

const TYPE_ICON = {
  like: FavoriteBorderIcon,
  comment: ChatBubbleOutlineIcon,
  reply: ReplyIcon,
  levelUp: EmojiEventsIcon,
  badge: MilitaryTechIcon,
  system: NotificationsIcon,
};

// This bell renders only inside the Navbar (see Navbar.js), so both the
// trigger and its popover are navbar chrome: they read from the shared
// InkWell tokens rather than the app's light MUI theme, so the popover
// doesn't drop out of the dark pill as a light panel. Engagement types take
// the brand orange; neutral/system types stay in the secondary ink tone.
const TYPE_COLOR = {
  like: "var(--ink-orange)",
  comment: "var(--ink-text-2)",
  reply: "var(--ink-text-3)",
  levelUp: "var(--ink-orange)",
  badge: "var(--ink-orange)",
  system: "var(--ink-text-2)",
};

// "2m", "3h", "5d" — lightweight relative time without pulling moment/date libs.
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

const NotificationBell = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const unreadCount = useSelector((state) => state.notifications.unreadCount);
  const [anchorEl, setAnchorEl] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);
  const open = Boolean(anchorEl);

  const handleOpen = async (event) => {
    setAnchorEl(event.currentTarget);
    setLoading(true);
    try {
      const { data } = await axios.get("/api/v1/notifications?page=1&limit=6");
      setRecent(data.notifications || []);
      // Mark what's visible as read so the badge clears.
      if ((data.notifications || []).some((n) => !n.read)) {
        await dispatch(markAllNotificationsRead());
      }
    } catch {
      // silent — the bell is non-critical
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => setAnchorEl(null);

  const handleItemClick = (n) => {
    // Optimistically drop the unread dot for this item.
    if (!n.read) dispatch(decrementUnread());
    handleClose();
    if (n.blog?._id) navigate(`/blog-details/${n.blog._id}`);
    else navigate("/notifications");
  };

  const refreshUnread = () => {
    if (user) dispatch(fetchUnreadCount());
  };

  // Refresh the count whenever the popover is closed (catches reads done on
  // the full page too).
  React.useEffect(() => {
    if (!open) refreshUnread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <IconButton
        onClick={handleOpen}
        color="inherit"
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
        sx={{
          borderRadius: 999,
          color: "var(--ink-text-2)",
          "&:hover": { color: "var(--ink-orange)", backgroundColor: "var(--ink-orange-softer)" },
        }}
      >
        <Badge badgeContent={unreadCount} color="error" overlap="circular">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            className: "ink-nav",
            sx: {
              width: 360,
              maxWidth: "92vw",
              mt: 1.5,
              borderRadius: 3,
              boxShadow: "0 18px 44px rgba(0,0,0,0.5)",
              border: "1px solid var(--ink-border)",
              bgcolor: "var(--ink-bg-alt)",
              backgroundImage: "none",
              color: "var(--ink-text)",
              backdropFilter: "blur(14px)",
            },
          },
        }}
      >
        <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: "var(--ink-text)" }}>
            Notifications
          </Typography>
          <Button
            size="small"
            onClick={async () => {
              await dispatch(markAllNotificationsRead());
              setRecent((prev) => prev.map((n) => ({ ...n, read: true })));
            }}
            sx={{
              textTransform: "none",
              color: "var(--ink-orange)",
              fontWeight: 700,
              "&:hover": { backgroundColor: "var(--ink-orange-softer)" },
            }}
          >
            Mark all read
          </Button>
        </Box>
        <Divider sx={{ borderColor: "var(--ink-border)" }} />
        <Box sx={{ maxHeight: 380, overflowY: "auto" }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : recent.length === 0 ? (
            <Typography variant="body2" sx={{ p: 3, textAlign: "center", color: "var(--ink-text-2)" }}>
              You&apos;re all caught up 🎉
            </Typography>
          ) : (
            recent.map((n) => {
              const Icon = TYPE_ICON[n.type] || NotificationsIcon;
              const color = TYPE_COLOR[n.type] || "var(--ink-orange)";
              return (
                <Box
                  key={n._id}
                  onClick={() => handleItemClick(n)}
                  role="button"
                  tabIndex={0}
                  sx={{
                    px: 2,
                    py: 1.5,
                    display: "flex",
                    gap: 1.5,
                    alignItems: "flex-start",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--ink-border-soft)",
                    bgcolor: n.read ? "transparent" : "var(--ink-orange-softer)",
                    "&:hover": { bgcolor: "var(--ink-border-soft)" },
                  }}
                >
                  <Box sx={{ mt: 0.25, color }}>
                    <Icon fontSize="small" />
                  </Box>
                  <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                    >
                      {n.actor && (
                        <UserAvatar
                          src={n.actor.profile_image}
                          name={n.actor.username}
                          sx={{ width: 20, height: 20 }}
                        />
                      )}
                      <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", color: "var(--ink-text)" }}>
                        {n.text || "New notification"}
                      </Box>
                    </Typography>
                    <Typography variant="caption" sx={{ color: "var(--ink-text-3)" }}>
                      {relativeTime(n.created_at)}
                    </Typography>
                  </Stack>
                  {!n.read && (
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "var(--ink-orange)", mt: 0.75 }} />
                  )}
                </Box>
              );
            })
          )}
        </Box>
        <Divider sx={{ borderColor: "var(--ink-border)" }} />
        <Box sx={{ p: 1.25, textAlign: "center" }}>
          <Button
            fullWidth
            onClick={() => { handleClose(); navigate("/notifications"); }}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              color: "var(--ink-orange)",
              "&:hover": { backgroundColor: "var(--ink-orange-softer)" },
            }}
          >
            View all notifications
          </Button>
        </Box>
      </Popover>
    </>
  );
};

export default NotificationBell;