import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Button, Box, CircularProgress } from "@mui/material";
import { PersonAddAlt1, PersonRemove } from "@mui/icons-material";
import toast from "react-hot-toast";
import { toastFollow } from "../utils/toasts";
import { useAuth } from "../context/AuthContext";

// Follow / unfollow a single author. Self-contained: reads the current user
// from AuthContext and hides itself when the viewer is the author (you can't
// follow yourself) or when there's no logged-in viewer.
//
// Fetches GET /api/v1/follow/info/:userId once for the initial state, then
// toggles with POST /api/v1/follow/:userId. The follower count is shown next
// to the button.
const FollowButton = ({ userId, size = "small" }) => {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const fetchInfo = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await axios.get(`/api/v1/follow/info/${userId}`);
      if (data.success) {
        setFollowing(!!data.isFollowing);
        setCount(data.followersCount || 0);
      }
    } catch {
      /* silent — button just won't show follow state */
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    fetchInfo();
  }, [fetchInfo]);

  // Don't render for anonymous viewers or for the author's own post.
  if (!user || !userId || String(user._id) === String(userId)) return null;

  const toggle = async () => {
    setBusy(true);
    const prev = following;
    setFollowing(!prev); // optimistic
    try {
      const { data } = await axios.post(`/api/v1/follow/${userId}`);
      if (data.success) {
        setFollowing(!!data.following);
        setCount(data.followersCount ?? count);
        toastFollow(!!data.following);
      } else {
        setFollowing(prev); // revert
      }
    } catch (err) {
      setFollowing(prev); // revert
      toast.error(err.response?.data?.message || "Couldn't update follow.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <CircularProgress size={16} sx={{ color: "text.secondary" }} />;
  }

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
      <Button
        size={size}
        variant={following ? "outlined" : "contained"}
        color="primary"
        disabled={busy}
        onClick={toggle}
        startIcon={following ? <PersonRemove /> : <PersonAddAlt1 />}
        sx={{ whiteSpace: "nowrap", borderRadius: 999 }}
      >
        {following ? "Following" : "Follow"}
      </Button>
      <Box component="span" sx={{ fontSize: 12, color: "text.secondary" }}>
        {count} {count === 1 ? "follower" : "followers"}
      </Box>
    </Box>
  );
};

export default FollowButton;