import confetti from "canvas-confetti";
import toast from "react-hot-toast";

// The greyscale burst — reads correctly on the light theme, which is where
// every caller except Create Blog lives.
const DEFAULT_COLORS = ["#111111", "#52525B", "#A3A3A3", "#D4D4D4"];

// Fire a short confetti burst. canvas-confetti draws on its own canvas, so this
// is safe to call from any handler with no setup/teardown.
//
// `colors` is optional: the dark editorial pages pass warm values, because the
// default greys are near-invisible against a #0F0E0D canvas. Omitting it keeps
// every existing caller's burst byte-identical.
const burst = (colors = DEFAULT_COLORS) => {
  confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 }, colors });
  // A second smaller burst from the sides for a richer effect.
  setTimeout(() => {
    confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0, y: 0.65 }, colors });
    confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1, y: 0.65 }, colors });
  }, 180);
};

// Celebrate a level-up and/or newly earned badges returned by an awarding
// endpoint (like / comment / publish). No-ops when there's nothing to celebrate
// so callers can pass the raw server delta through unconditionally.
//
//   celebrateAchievement({ leveledUp, newBadges, level })
//   celebrateAchievement({ leveledUp, newBadges, level, colors })  // dark pages
export const celebrateAchievement = ({ leveledUp, newBadges = [], level, colors } = {}) => {
  if (!leveledUp && (!newBadges || newBadges.length === 0)) return;

  if (leveledUp && level) {
    burst(colors);
    toast.success(`🏆 Level up! You're now a "${level}".`, {
      duration: 4000,
      icon: null,
      style: { fontWeight: 700 },
    });
  }

  if (newBadges && newBadges.length > 0) {
    // Small delay so a level-up toast and badge toast don't overlap perfectly.
    setTimeout(() => {
      newBadges.forEach((badge) => {
        if (!leveledUp) burst(colors);
        toast.success(`🎖️ New badge: ${badge}`, {
          duration: 4000,
          icon: null,
          style: { fontWeight: 700 },
        });
      });
    }, leveledUp ? 600 : 0);
  }
};