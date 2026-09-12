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

const TYPE_COLOR = {
  like: "var(--accent)",
  comment: "var(--text-secondary)",
  reply: "var(--text-disabled)",
  levelUp: "var(--accent)",
  badge: "var(--accent)",
  system: "var(--text-secondary)",
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
        sx={{ borderRadius: 999, "&:hover": { backgroundColor: "action.hover" } }}
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
            sx: {
              width: 360,
              maxWidth: "92vw",
              mt: 1.5,
              borderRadius: 3,
              boxShadow: (t) => t.customShadows?.card,
              border: (t) => `1px solid ${t.palette.divider}`,
              bgcolor: "background.glass",
              backdropFilter: "blur(14px)",
            },
          },
        }}
      >
        <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Notifications
          </Typography>
          <Button
            size="small"
            onClick={async () => {
              await dispatch(markAllNotificationsRead());
              setRecent((prev) => prev.map((n) => ({ ...n, read: true })));
            }}
            sx={{ textTransform: "none", color: "primary.main", fontWeight: 700 }}
          >
            Mark all read
          </Button>
        </Box>
        <Divider />
        <Box sx={{ maxHeight: 380, overflowY: "auto" }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : recent.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: "center" }}>
              You&apos;re all caught up 🎉
            </Typography>
          ) : (
            recent.map((n) => {
              const Icon = TYPE_ICON[n.type] || NotificationsIcon;
              const color = TYPE_COLOR[n.type] || "var(--accent)";
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
                    borderBottom: (t) => `1px solid ${t.palette.divider}`,
                    bgcolor: n.read ? "transparent" : "brandSoft",
                    "&:hover": { bgcolor: "action.hover" },
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
                      <Box sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                        {n.text || "New notification"}
                      </Box>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {relativeTime(n.created_at)}
                    </Typography>
                  </Stack>
                  {!n.read && (
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main", mt: 0.75 }} />
                  )}
                </Box>
              );
            })
          )}
        </Box>
        <Divider />
        <Box sx={{ p: 1.25, textAlign: "center" }}>
          <Button
            fullWidth
            onClick={() => { handleClose(); navigate("/notifications"); }}
            sx={{ textTransform: "none", fontWeight: 700, color: "primary.main" }}
          >
            View all notifications
          </Button>
        </Box>
      </Popover>
    </>
  );
};

export default NotificationBell;