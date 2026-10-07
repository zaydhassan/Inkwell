import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Box } from "@mui/material";
import { useDispatch } from "react-redux";
import { InkBackdrop, InkSectionHead } from "../components/ink";
import {
  EarnMethods,
  PointsSummary,
  RewardRow,
  RewardsEmpty,
  RewardsError,
  RewardsSkeleton,
  RewardsHero,
} from "../components/rewards";
import { useAuth } from "../context/AuthContext";
import { setGamification } from "../redux/store";
import { toastReward } from "../utils/toasts";
import { pointsRole } from "../utils/points";
import "./Rewards.css";

/* ─────────────────────────────────────────────────────────────────────
   InkWell — Rewards.

   A presentation of what the API already holds, plus one honest action: the
   redemption the server enforces. Nothing on this page computes a reward, a
   price or a balance — the catalog comes from `GET /api/v1/rewards`, the
   balance is the signed-in user's own `points`, and spending goes through
   the same `POST /api/v1/rewards/redeem` the Profile page calls, with the
   response's `remainingPoints` written back to the store and localStorage.

   REAL DATA OR NO DATA:
     • No placeholder balance. Signed-out visitors are asked to sign in
       rather than shown an invented number.
     • Eligibility is the same `points >= costInPoints` the server checks, so
       a live Redeem button always means the redemption will go through.
     • An empty catalog is an empty state, not a set of sample rewards.
     • The earning rates are the ones the server actually credits.

   Layout: hero (copy · illustration), the balance card, the reward list, and
   the earning methods. The shared navbar and footer come from the app shell
   — this page renders neither of its own.
   ───────────────────────────────────────────────────────────────────── */

/* AuthContext restores the session inside an effect, so on the very first
   render `isLoggedIn` is still false and `user` is still null. Seeding from
   the same localStorage entries the context writes (see AuthContext.login)
   keeps a signed-in reader from seeing "Sign in to see your points" for a
   frame, and the context value replaces it as soon as it settles. Read once,
   at module scope, so nothing re-parses on every render. */
const seedUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const SEEDED = seedUser();
const SEEDED_SIGNED_IN = SEEDED && localStorage.getItem("isLogin") === "true";

const Rewards = () => {
  const { user, isLoggedIn } = useAuth();
  const dispatch = useDispatch();

  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // Balance: seeded for the first frame, then owned by the context and by
  // whatever a redemption returns. `redeemed` maps a reward id to its own
  // in-flight/settled state so one row's spinner never blocks another.
  const [balance, setBalance] = useState(SEEDED ? SEEDED.points ?? null : null);
  const [level, setLevel] = useState(SEEDED ? SEEDED.level ?? null : null);
  const [rowState, setRowState] = useState({});

  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /* One frame of the seeded value, then the context is the only authority —
     including when it says signed OUT, which a module-level seed could never
     report on its own after a logout. Child effects run before the
     provider's, so this lands in the same re-render as the restored session. */
  const [settled, setSettled] = useState(false);
  useEffect(() => setSettled(true), []);

  // The context is authoritative once it has spoken.
  useEffect(() => {
    if (user) {
      if (typeof user.points === "number") setBalance(user.points);
      setLevel(user.level ?? null);
    }
  }, [user]);

  const signedIn = settled ? isLoggedIn : SEEDED_SIGNED_IN;
  const role = pointsRole((settled ? user?.role : SEEDED?.role) ?? null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/v1/rewards");
      if (data.success && Array.isArray(data.rewards)) {
        setRewards(data.rewards);
        setFailed(false);
      } else {
        setRewards([]);
        setFailed(true);
      }
    } catch {
      // The page has nothing useful to say about the cause, so it says only
      // what it knows: the list could not be loaded.
      setRewards([]);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRedeem = async (rewardId) => {
    setRowState((s) => ({ ...s, [rewardId]: "loading" }));
    try {
      const { data } = await axios.post("/api/v1/rewards/redeem", {
        userId: user?._id,
        rewardId,
      });

      if (!data.success) {
        setRowState((s) => ({ ...s, [rewardId]: "idle" }));
        toast.error(data.message || "Couldn't redeem that reward.");
        return;
      }

      toastReward("Reward redeemed successfully.");

      // The server recomputed points/level/badges after the spend, so both
      // the store (Navbar) and this page's balance come from its response —
      // never from a locally subtracted guess.
      const { remainingPoints, level: newLevel, badges: newBadges } = data;
      if (typeof remainingPoints === "number") {
        dispatch(setGamification({ points: remainingPoints, level: newLevel, badges: newBadges }));
        setBalance(remainingPoints);
        if (newLevel !== undefined) setLevel(newLevel);
      }

      // Hold the ✓ long enough to be read, then return the row to normal.
      setRowState((s) => ({ ...s, [rewardId]: "redeemed" }));
      timers.current.push(
        setTimeout(() => setRowState((s) => ({ ...s, [rewardId]: "idle" })), 2600)
      );
    } catch (err) {
      setRowState((s) => ({ ...s, [rewardId]: "idle" }));
      // A 4xx carries a message written for the reader ("Not enough points");
      // anything 5xx is left as a generic line rather than leaking internals.
      const status = err.response?.status;
      toast.error(
        status && status < 500 && err.response.data?.message
          ? err.response.data.message
          : "Couldn't redeem that reward."
      );
    }
  };

  return (
    <Box className="ink ink-rewards" component="main">
      {/* The shared 54px grid, grain and drifting warm glow. */}
      <InkBackdrop hero drift />

      <div className="ink-rw-wrap">
        <RewardsHero />

        <PointsSummary
          points={balance}
          level={level}
          signedIn={signedIn}
          loading={signedIn && balance === null}
        />

        <section className="ink-rw-catalog" aria-labelledby="ink-rw-catalog-title">
          <InkSectionHead
            eyebrow="Reward redemption"
            /* The shared "section" step is tuned for marketing pages; this one
               is the brief's 42–48px. Set on the section head rather than as a
               CSS override so the heading keeps the primitive's family,
               weight and colour and only its size changes. */
            sx={{ "& h2": { fontSize: "clamp(2.5rem, 3.1vw, 3rem)", lineHeight: 1.05 } }}
            title={<span id="ink-rw-catalog-title">Redeem your points</span>}
            subtitle="Each reward is paid for out of the balance above — points come off your total the moment a redemption succeeds."
          />

          <div className="ink-rw-catalog-body">
            {loading ? (
              <RewardsSkeleton />
            ) : failed ? (
              <RewardsError onRetry={load} />
            ) : rewards.length === 0 ? (
              <RewardsEmpty />
            ) : (
              <div className="ink-rw-rows">
                {rewards.map((reward, index) => (
                  <RewardRow
                    key={reward._id}
                    reward={reward}
                    points={balance ?? 0}
                    signedIn={signedIn}
                    state={rowState[reward._id] || "idle"}
                    index={index}
                    onRedeem={handleRedeem}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <EarnMethods role={role} />
      </div>
    </Box>
  );
};

export default Rewards;
