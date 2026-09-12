// ─────────────────────────────────────────────────────────────────────
//  Placeholder content for the homepage "Latest from the community" grid.
//
//  These are purely front-end presentation cards shown when no real blogs
//  exist yet, so the landing page never looks empty. They are NOT persisted
//  to the database and never reach the backend. When real posts arrive,
//  CommunitySection swaps them out automatically.
//
//  Data is randomized once per mount so every page load feels dynamic.
// ─────────────────────────────────────────────────────────────────────

// Premium Unsplash photography, one per topic. Direct CDN URLs with
// sizing params so they load fast and look crisp on retina screens.
const COVER_IMAGES = {
  technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
  programming: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
  ai: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80",
  design: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80",
  startups: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=800&q=80",
  productivity: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80",
  engineering: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
  cybersecurity: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
  cloud: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
  ml: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=800&q=80",
};

// The six editorial placeholder articles, exactly as specified. Titles and
// descriptions are fixed so the grid always reads as a curated set; only the
// metadata (date, engagement, author) is randomized per mount.
const CONTENT = [
  {
    topic: "ai",
    category: "AI",
    image: COVER_IMAGES.ai,
    title: "The Rise of AI Agents",
    description:
      "Autonomous agents are moving from demos into daily workflows. What they can genuinely do today — and where a human still needs to stay in the loop.",
  },
  {
    topic: "technology",
    category: "Technology",
    image: COVER_IMAGES.technology,
    title: "Building Scalable Web Applications",
    description:
      "From caching layers to queue-backed workers, the architecture patterns that keep a growing product fast, reliable, and affordable.",
  },
  {
    topic: "productivity",
    category: "Productivity",
    image: COVER_IMAGES.productivity,
    title: "Small Habits, Big Changes",
    description:
      "Why tiny, repeatable routines beat dramatic overhauls — and how to design habits that survive even your busiest weeks.",
  },
  {
    topic: "design",
    category: "Design",
    image: COVER_IMAGES.design,
    title: "Designing Better Digital Products",
    description:
      "Clarity, restraint, and honest feedback: the quiet principles behind interfaces that people trust and genuinely enjoy using.",
  },
  {
    topic: "engineering",
    category: "Software Engineering",
    image: COVER_IMAGES.engineering,
    title: "The Future of Software Engineering",
    description:
      "AI-assisted development, platform thinking, and taste as a differentiator — what the next decade of building software looks like.",
  },
  {
    topic: "startups",
    category: "Career",
    image: COVER_IMAGES.startups,
    title: "Building Your Career in Tech",
    description:
      "Practical advice on skills, mentors, and deliberate practice for a durable, fulfilling career in technology — no hype required.",
  },
];

// Avatar initials-only "authors" — no real people, just believable names.
const AUTHORS = [
  "Ava Mitchell", "Liam Chen", "Sofia Ramirez", "Noah Patel",
  "Maya Okafor", "Ethan Brooks", "Zara Khalil", "Leo Nakamura",
  "Isla Moreau", "Devon Park", "Nora Silva", "Kai Andersson",
];

// Rotating palette for avatar gradients so each face reads distinct.
const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #44403C 0%, #78716C 100%)",
  "linear-gradient(135deg, #292524 0%, #57534E 100%)",
  "linear-gradient(135deg, #57534E 0%, #A8A29E 100%)",
  "linear-gradient(135deg, #78716C 0%, #D6D3D1 100%)",
  "linear-gradient(135deg, #1C1917 0%, #44403C 100%)",
  "linear-gradient(135deg, #A8A29E 0%, #E7E5E4 100%)",
];

// Deterministic-ish helpers (Math.random is fine here — this runs in the
// browser component tree, not in a constrained workflow sandbox).
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Days ago → a believable past date string (e.g. "Mar 18").
const daysAgoLabel = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Fisher–Yates shuffle so topic order varies per load.
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Build a single placeholder post from a fixed article + random metadata.
const buildPost = (bucket, index) => {
  const author = pick(AUTHORS);
  return {
    id: `placeholder-${index}`,
    placeholder: true,
    title: bucket.title,
    description: bucket.description,
    category: bucket.category,
    image: bucket.image,
    author,
    avatarGradient: AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length],
    date: daysAgoLabel(randInt(1, 28)),
    readingTime: randInt(3, 12),
    likes: randInt(24, 480),
    comments: randInt(3, 64),
    trending: Math.random() > 0.55, // ~45% of cards get a trending badge
  };
};

// Generate `count` randomized placeholder posts. Picks distinct buckets so
// the grid shows a healthy mix of topics.
const generatePlaceholderPosts = (count = 6) =>
  shuffle(CONTENT)
    .slice(0, count)
    .map((bucket, i) => buildPost(bucket, i));

export default generatePlaceholderPosts;