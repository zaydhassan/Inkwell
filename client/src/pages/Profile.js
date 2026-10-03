import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from "react-hot-toast";
import { updateUser, setGamification } from '../redux/store';
import { useAuth } from '../context/AuthContext';
import { toastProfileUpdated, toastReward } from "../utils/toasts";
import { validateEmail, validateMinLength, validatePassword } from "../utils/validate";
import { LEVEL_BANDS } from "../components/LeaderboardCard";
import { InkBackdrop, InkSectionHead } from '../components/ink';
import DashboardSidebar from '../components/profile/DashboardSidebar';
import ProfileHero from '../components/profile/ProfileHero';
import ProfileStats from '../components/profile/ProfileStats';
import WritingActivity from '../components/profile/WritingActivity';
import AchievementShelf from '../components/profile/AchievementShelf';
import RewardCard from '../components/profile/RewardCard';
import YourStories from '../components/profile/YourStories';
import ProfileSettings from '../components/profile/ProfileSettings';
import "./Profile.css";

/* ─────────────────────────────────────────────────────────────────────
   Profile — personal creator profile, writing dashboard and achievement hub.

   Sections run in a fixed order, each with its own geometry so that one accent
   colour does not flatten them into six identical cards:

     1 Hero          identity only, full-bleed, no surface
     2 Creator stats quantity, borderless, hairline-separated
     3 Writing       the one quiet surface + 91-cell heatmap
     4 Achievements  three tiles, no outer card
     5 Rewards       the one grid of equal cards
     6 Your stories  a hairline list (drafts included)
     7 Settings      the one plain surface, narrowest measure

   Numbers appear exactly once across the page: identity counts live in the
   hero, accumulated quantities in the stats rail, the writing habit in its own
   section. Two features from the original brief are deliberately absent —
   account deletion and online status — because neither exists server-side, and
   inventing them would mean new backend work.
   ───────────────────────────────────────────────────────────────────── */

const Profile = () => {
  const user = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [loadingRewards, setLoadingRewards] = useState(false);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
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
  const [userBlogs, setUserBlogs] = useState([]);

  // Level thresholds are shared with the Leaderboard page via the
  // LeaderboardCard module so there's one source of truth (see LEVEL_BANDS).
  // The hero owns the wording of the "next level" caption; this is the share
  // of the current band that has been filled.
  const band = LEVEL_BANDS.find((b) => points >= b.min && (b.next === null || points < b.next)) || LEVEL_BANDS[LEVEL_BANDS.length - 1];
  const progress = band.next === null
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
        // The server recomputed points/level/badges from the new total, so push
        // them into both the store (Navbar) and local state (every
        // affordability meter on this page). Without this the page kept showing
        // the old balance and the old "can afford" states until a reload.
        const { remainingPoints, level: newLevel, badges: newBadges } = response.data;
        if (remainingPoints !== undefined) {
          dispatch(setGamification({ points: remainingPoints, level: newLevel, badges: newBadges }));
          setPoints(remainingPoints);
          if (newLevel !== undefined) setLevel(newLevel);
          if (newBadges !== undefined) setBadges(newBadges);
        }
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
      fetchRewards();
      // Followers / following counts for the header card (best-effort).
      axios.get(`/api/v1/follow/info/${user._id}`)
        .then(({ data }) => data.success && setFollowInfo({ followersCount: data.followersCount, followingCount: data.followingCount }))
        .catch(() => {});
      // The writer's own posts, which feed the creator-stats counts and the
      // "Your stories" list. `userBlog.blogs` carries every status, so drafts
      // are counted client-side rather than asked for separately.
      axios.get(`/api/v1/blog/user-blog/${user._id}`)
        .then(({ data }) => {
          if (data.success && Array.isArray(data.userBlog?.blogs)) setUserBlogs(data.userBlog.blogs);
        })
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

      // A failed photo upload used to `return` here, throwing away the username,
      // email and bio the user had just edited. It now flags the failure and
      // carries on, so the text changes still save.
      let imageFailed = false;

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
          imageFailed = true;
          toast.error(error?.response?.data?.message || 'Photo upload failed');
        }
      }

      // updateUser is a createAsyncThunk; unwrap() throws on rejection so we
      // only show success when the server actually persisted the change.
      await dispatch(updateUser(updatedData)).unwrap();
      // Exactly one toast either way — claiming "profile updated" after a
      // failed upload would imply the photo changed too.
      if (imageFailed) {
        toast.error("Saved your details, but the photo wasn't uploaded.");
      } else {
        toastProfileUpdated();
      }
      // Clear the password field after a successful update.
      setPassword('');
    } catch (error) {
      toast.error(error?.message || "Failed to update profile.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Redux + localStorage alone left the httpOnly refresh cookie alive, so the
  // "logged out" session silently re-authenticated on the next refresh.
  // AuthContext.logout() also signs out of Firebase and clears the cookie.
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleRestrictedNavigation = (path) => {
    if (isWriter) {
      navigate(path);
    } else {
      toast.error("Only writer accounts can create and manage blogs.");
    }
  };

  // The rail's view-only concern: two of its entries are writer-gated, the
  // rest are plain routes.
  const handleNavigate = (path, writerOnly = false) => {
    if (writerOnly) handleRestrictedNavigation(path);
    else navigate(path);
  };

  const publishedCount = userBlogs.filter((blog) => blog.status === "Published").length;

  return (
    <Box className="ink ink-profile" component="main">
      <InkBackdrop drift />

      <div className="ink-profile-shell">
        <DashboardSidebar
          topWriters={topWriters}
          topReaders={topReaders}
          currentUserId={user?._id}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />

        <div className="ink-profile-main">
          {/* 1 — identity */}
          <ProfileHero
            user={user}
            level={level}
            points={points}
            followInfo={followInfo}
            progress={progress}
            band={band}
            onAvatarClick={handleAvatarClick}
            fileInputRef={fileInputRef}
            onImageChange={handleImageChange}
          />

          {/* 2 — accumulated quantities */}
          <ProfileStats
            points={points}
            badgesEarned={badges.length}
            published={publishedCount}
            drafts={userBlogs.length - publishedCount}
          />

          {/* 3 — the writing habit. Gated on `user`: WritingStreakCard fetches
              `/api/v1/writing/stats` on mount (authenticateUser), and /profile
              is not a protected route — so for an anonymous visitor that 401
              would run the axios refresh, fail, and hard-redirect to /login.
              The card itself renders nothing without stats, so gating costs
              nothing and keeps the anonymous path on the page. */}
          {user && <WritingActivity />}

          {/* 4 — achievements */}
          <AchievementShelf badges={badges} points={points} />

          {/* 5 — rewards */}
          <section
            className="ink-profile-section ink-profile-section-wide"
            aria-label="Rewards"
          >
            <InkSectionHead
              eyebrow="Spend your points"
              title="Rewards"
              size="compact"
              sx={{ mb: 3 }}
            />

            {loadingRewards ? (
              <p className="ink-profile-empty">Loading rewards…</p>
            ) : Array.isArray(rewards) && rewards.length > 0 ? (
              <div className="ink-reward-grid">
                {rewards.map((reward) => (
                  <RewardCard
                    key={reward._id}
                    reward={reward}
                    points={points}
                    onRedeem={handleRedeem}
                  />
                ))}
              </div>
            ) : (
              <p className="ink-profile-empty">No rewards available yet.</p>
            )}
          </section>

          {/* 6 — the writer's own posts (hidden until there is at least one) */}
          <YourStories posts={userBlogs} />

          {/* 7 — settings */}
          <ProfileSettings
            username={username}
            email={email}
            bio={bio}
            password={password}
            errors={errors}
            isUpdating={isUpdating}
            /* Gated on `user`, not on a loading flag: that flag was only ever
               cleared inside the gated effect, so with no user it stayed true
               and disabled this button forever. */
            disabled={isUpdating || !user}
            setUsername={setUsername}
            setEmail={setEmail}
            setBio={setBio}
            setPassword={setPassword}
            setFieldError={setFieldError}
            onSubmit={() => handleUpdate()}
          />
        </div>
      </div>
    </Box>
  );
};

export default Profile;
