import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box, Button, TextField, List, ListItem, ListItemButton, ListItemText,
  Chip, Typography, LinearProgress, Skeleton, Link, Divider, Stack,
} from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useNavigate } from 'react-router-dom';
import { updateUser, authActions } from '../redux/store';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ArticleIcon from '@mui/icons-material/Article';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import axios from 'axios';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import RedeemIcon from '@mui/icons-material/CardGiftcard';
import toast from "react-hot-toast";
import { toastProfileUpdated, toastReward } from "../utils/toasts";
import { onActivate } from "../utils/a11y";
import { validateEmail, validateMinLength, validatePassword } from "../utils/validate";
import GlassCard from "../components/GlassCard";
import GradientButton from "../components/GradientButton";
import UserAvatar from "../components/UserAvatar";
import SectionHeading from "../components/SectionHeading";
import LeaderboardCard, { LEVEL_BANDS } from "../components/LeaderboardCard";
import WritingStreakCard from "../components/WritingStreak";

const Profile = () => {
  const user = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [rewards, setRewards] = useState([]);
  const [loadingRewards, setLoadingRewards] = useState(false);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errors, setErrors] = useState({});
  const isWriter = user?.role?.toLowerCase() === "writer";

  const setFieldError = (field, msg) =>
    setErrors((prev) => {
      const next = { ...prev };
      if (msg) next[field] = msg;
      else delete next[field];
      return next;
    });
  const fileInputRef = useRef(null);
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState("Beginner");
  const [badges, setBadges] = useState([]);
  const [topWriters, setTopWriters] = useState([]);
  const [topReaders, setTopReaders] = useState([]);
  const [followInfo, setFollowInfo] = useState({ followersCount: 0, followingCount: 0 });

  // Level thresholds are shared with the Leaderboard page via the
  // LeaderboardCard module so there's one source of truth (see LEVEL_BANDS).
  const band = LEVEL_BANDS.find((b) => points >= b.min && (b.next === null || points < b.next)) || LEVEL_BANDS[LEVEL_BANDS.length - 1];
  const isMaxLevel = band.next === null;
  const nextLevelPoints = isMaxLevel ? points : band.next;
  const progress = isMaxLevel
    ? 100
    : ((points - band.min) / (band.next - band.min)) * 100;

  const fetchUserStats = useCallback(async () => {
    try {
      const response = await axios.get(`/api/v1/user/${user._id}`);
      if (response.data.success) {
        setPoints(response.data.user.points || 0);
        setLevel(response.data.user.level || "Beginner");
        setBadges(response.data.user.badges || []);
      } else {
        toast.error("Couldn't load your stats.");
      }
    } catch (error) {
      toast.error("Couldn't load your stats.");
    }
  }, [user]);

  const fetchRewards = async () => {
    setLoadingRewards(true);
    try {
      const response = await axios.get('/api/v1/rewards');

      if (response.data.success && Array.isArray(response.data.rewards)) {
        setRewards(response.data.rewards);
      } else {
        setRewards([]);
      }
    } catch (error) {
      setRewards([]);
      toast.error("Couldn't load rewards.");
    }
    setLoadingRewards(false);
  };

  const handleRedeem = async (rewardId) => {
    try {
      const response = await axios.post('/api/v1/rewards/redeem', { userId: user._id, rewardId });
      if (response.data.success) {
        toastReward();
      } else {
        toast.error(response.data.message || 'Failed to redeem reward.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to redeem reward.');
    }
  };

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await axios.get(`/api/v1/user/leaderboard`);
      if (response.data.success) {
        setTopWriters(response.data.topWriters || []);
        setTopReaders(response.data.topReaders || []);
      }
    } catch (error) {
      toast.error("Couldn't load the leaderboard.");
    }
  }, []);

  useEffect(() => {
    if (user && user._id) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setBio(user.bio || '');
      fetchUserStats();
      fetchLeaderboard();
      setIsLoading(false);
      fetchRewards();
      // Followers / following counts for the header card (best-effort).
      axios.get(`/api/v1/follow/info/${user._id}`)
        .then(({ data }) => data.success && setFollowInfo({ followersCount: data.followersCount, followingCount: data.followingCount }))
        .catch(() => {});
      // `points` intentionally excluded: setPoints in fetchUserStats would
      // re-trigger this effect and double every fetch on mount.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }
  }, [user, fetchUserStats, fetchLeaderboard]);

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleUpdate(file);
    }
  };

  const handleUpdate = async (selectedImage = null) => {
    if (!user || !user._id) {
      toast.error("⚠️ Cannot update: User data not available.");
      return;
    }

    // Inline validation: username/email are required, and a new password (if
    // provided) must meet the server's 8-char minimum. Bio is free-form.
    const found = {
      username: validateMinLength(username, 2, "Username"),
      email: validateEmail(email),
      password: password.trim() ? validatePassword(password, { min: 8, required: false }) : "",
    };
    const hasErrors = Object.values(found).some(Boolean);
    setErrors(hasErrors ? found : {});
    if (hasErrors) return;

    setIsUpdating(true);
    try {
      const updatedData = { id: user._id, username, email, bio };

      if (password.trim()) {
        updatedData.password = password;
      }

      if (selectedImage) {
        const formData = new FormData();
        formData.append('image', selectedImage);

        try {
          // Use axios (not fetch) so the request interceptor attaches the
          // Bearer access token and the 401-refresh-retry path applies. The
          // old fetch() call sent no Authorization header → 401 every time.
          const { data: imageData } = await axios.post(
            '/api/v1/user/upload-image',
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
          if (imageData?.success && imageData.imageUrl) {
            updatedData.profile_image = imageData.imageUrl;
          } else {
            throw new Error(imageData?.message || 'Image upload failed');
          }
        } catch (error) {
          toast.error(error?.response?.data?.message || 'Failed to upload image');
          return;
        }
      }

      // updateUser is a createAsyncThunk; unwrap() throws on rejection so we
      // only show success when the server actually persisted the change.
      await dispatch(updateUser(updatedData)).unwrap();
      toastProfileUpdated();
      // Clear the password field after a successful update.
      setPassword('');
    } catch (error) {
      toast.error(error?.message || "Failed to update profile.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    dispatch(authActions.logout());
    navigate("/");
  };

  const handleRestrictedNavigation = (path) => {
    if (isWriter) {
      navigate(path);
    } else {
      toast.error("Login as a writer to access this feature");
    }
  };

  const navItem = (label, icon, onClick, active = false) => (
    <ListItem disablePadding>
      <ListItemButton
        onClick={onClick}
        sx={{
          borderRadius: 2,
          mb: 0.5,
          color: active ? "primary.main" : "text.secondary",
          fontWeight: active ? 700 : 500,
          "&:hover": { bgcolor: "brandSoft" },
        }}
      >
        <Box sx={{ mr: 1.5, color: active ? "primary.main" : "text.secondary", display: "flex" }}>{icon}</Box>
        <ListItemText primary={label} />
      </ListItemButton>
    </ListItem>
  );

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, minHeight: "100vh" }}>
        {/* Sidebar */}
        <Box
          sx={{
            width: { xs: "100%", md: 260 },
            p: 2,
            borderRight: { md: `1px solid`, borderColor: { md: "divider" } },
          }}
        >
          <List>
            {navItem("Profile", <AccountCircleIcon fontSize="small" />, () => navigate('/profile'), true)}
            {navItem("My Blogs", <ArticleIcon fontSize="small" />, () => handleRestrictedNavigation('/my-blogs'))}
            {navItem("Create Blog", <AddCircleIcon fontSize="small" />, () => handleRestrictedNavigation('/create-blog'))}
            {navItem("Rewards", <RedeemIcon fontSize="small" />, () => navigate('/rewards'))}
            {navItem("Leaderboard", <LeaderboardIcon fontSize="small" />, () => navigate('/leaderboard'))}
          </List>

          <LeaderboardCard title="Top Writers" rows={topWriters} currentUserId={user?._id} />
          <LeaderboardCard title="Top Readers" rows={topReaders} currentUserId={user?._id} />

          <List sx={{ mt: 2 }}>
            {navItem("Logout", <ExitToAppIcon fontSize="small" />, handleLogout)}
          </List>
        </Box>

        {/* Main */}
        <Box sx={{ flexGrow: 1, p: { xs: 3, md: 5 } }}>
          <SectionHeading eyebrow="Your account" title="Profile" align="left" sx={{ mb: 4 }} />

          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, maxWidth: 640, mx: "auto" }}>
            <UserAvatar
              src={user?.profile_image}
              name={user?.username}
              alt="Your profile picture"
              role="button"
              tabIndex={0}
              sx={{
                width: 110,
                height: 110,
                fontSize: "2rem",
                cursor: 'pointer',
                border: "3px solid",
                borderColor: "primary.main",
                boxShadow: (t) => t.customShadows?.glow,
                transition: "box-shadow 0.3s ease",
                "&:hover": { boxShadow: (t) => t.customShadows?.cardHover },
              }}
              onClick={handleAvatarClick}
              onKeyDown={onActivate(handleAvatarClick)}
            />
            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleImageChange} />

            {/* Header card: role badge + level + points + progress */}
            <GlassCard sx={{ p: 4, width: "100%", textAlign: "center" }}>
              <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: "Plus Jakarta Sans, Inter, sans-serif", mb: 0.5 }}>
                {user?.username || "Your profile"}
              </Typography>
              {bio && (
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, maxWidth: 480, mx: "auto" }}>
                  {bio}
                </Typography>
              )}
              <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                <Chip label={user?.role || "Reader"} color="secondary" size="small" />
                <Chip label={level} color="primary" size="small" />
              </Stack>

              <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: "Plus Jakarta Sans, Inter, sans-serif" }}>
                {points} <Box component="span" sx={{ color: "text.secondary", fontSize: "1rem", fontWeight: 500 }}>points</Box>
              </Typography>

              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 10, borderRadius: 5, mt: 2, bgcolor: "divider" }}
              />

              <Typography variant="caption" sx={{ mt: 1, display: "block", color: "text.secondary" }}>
                {isMaxLevel ? "Max level reached 🏆" : `${progress.toFixed(1)}% to ${nextLevelPoints} points`}
              </Typography>

              <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
                <Chip label={`${followInfo.followersCount} followers`} variant="outlined" size="small" />
                <Chip label={`${followInfo.followingCount} following`} variant="outlined" size="small" />
              </Stack>
            </GlassCard>

            {/* Badges */}
            <Box sx={{ width: "100%", textAlign: "center" }}>
              <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 1 }}>🏅 Badges Earned</Typography>
              {badges.length > 0 ? (
                <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
                  {badges.map((badge, index) => (
                    <Chip key={index} label={badge} color="primary" variant="outlined" sx={{ m: 0.5 }} />
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>No badges yet. Keep engaging!</Typography>
              )}
            </Box>

            {/* Writing streak + daily goal + contribution heatmap */}
            <GlassCard sx={{ p: { xs: 3, md: 4 }, width: "100%" }}>
              <WritingStreakCard />
            </GlassCard>

            {/* Rewards */}
            <GlassCard sx={{ p: 3, width: "100%" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Rewards</Typography>
              {loadingRewards ? (
                <Stack spacing={1.5}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} variant="rounded" height={56} sx={{ borderRadius: 2 }} />
                  ))}
                </Stack>
              ) : Array.isArray(rewards) && rewards.length > 0 ? (
                <List disablePadding>
                  {rewards.map(reward => (
                    <ListItem key={reward._id} disableGutters sx={{ py: 1 }}>
                      <ListItemText
                        primary={reward.name}
                        secondary={`Cost: ${reward.costInPoints} Points`}
                        primaryTypographyProps={{ variant: "body2", fontWeight: 600 }}
                        secondaryTypographyProps={{ variant: "caption" }}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        color="primary"
                        disabled={points < reward.costInPoints}
                        onClick={() => handleRedeem(reward._id)}
                      >
                        Redeem
                      </Button>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>No rewards available yet.</Typography>
              )}
            </GlassCard>

            {/* Edit form */}
            <GlassCard sx={{ p: { xs: 3, md: 4 }, width: "100%" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Edit profile</Typography>
              <TextField
                fullWidth
                margin="normal"
                label="Username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setFieldError("username", ""); }}
                onBlur={() => setFieldError("username", validateMinLength(username, 2, "Username"))}
                error={Boolean(errors.username)}
                helperText={errors.username}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldError("email", ""); }}
                onBlur={() => setFieldError("email", validateEmail(email))}
                error={Boolean(errors.email)}
                helperText={errors.email}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Bio"
                multiline
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Enter new password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldError("password", ""); }}
                onBlur={() => setFieldError("password", password.trim() ? validatePassword(password, { min: 8, required: false }) : "")}
                error={Boolean(errors.password)}
                helperText={errors.password || "Leave blank to keep your current password."}
              />
              <GradientButton
                sx={{ mt: 3, py: 1.25 }}
                onClick={() => handleUpdate()}
                disabled={isLoading || isUpdating}
              >
                {isUpdating ? "Updating…" : "Update Profile"}
              </GradientButton>
            </GlassCard>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default Profile;