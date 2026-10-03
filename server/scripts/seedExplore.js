/* ─────────────────────────────────────────────────────────────────────
   Demo content for the Explore page.

   The database ships empty of blogs, so Explore had nothing to render. This
   script fills it with a set of realistic, readable stories so the discovery
   experience can be developed and reviewed against real data.

   Rules this script follows:
     • It NEVER touches real accounts or their posts. Every row it creates is
       owned by a demo account whose email ends in `@inkwell.demo`, and every
       delete below is scoped to those accounts. Re-running it replaces the
       demo set and nothing else.
     • Demo authors have no password (their `password` stays undefined), so
       nobody can sign in as one — exactly like an OAuth-only account with no
       local credential.
     • Avatars are left empty, so cards render the initials disc the design
       system already uses instead of depicting a face.
     • No PointEvent rows are written, so the demo accounts never appear on the
       leaderboard (which only ranks users with points > 0).

   Run with:  npm run seed:explore   (from the server directory)
   ───────────────────────────────────────────────────────────────────── */

require("dotenv").config();
const mongoose = require("mongoose");

const blogModel = require("../models/blogModel");
const userModel = require("../models/userModel");
const Tag = require("../models/Tag");
const BlogTag = require("../models/BlogTag");
const Like = require("../models/likeModel");
const Comment = require("../models/commentModel");
const Bookmark = require("../models/bookmarkModel");
const BlogView = require("../models/blogViewModel");
const Notification = require("../models/notificationModel");
const BlogRevision = require("../models/blogRevisionModel");

const DEMO_DOMAIN = "@inkwell.demo";

// Cover art: curated Unsplash CDN URLs, requested at a card-sized width so the
// grid never pulls a full-resolution photo. Every story gets its own image.
const IMG = (id, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const AUTHORS = [
  { username: "Maya Chen", email: `maya.chen${DEMO_DOMAIN}`, bio: "Writes about systems, focus, and the craft of building software." },
  { username: "Liam Okafor", email: `liam.okafor${DEMO_DOMAIN}`, bio: "Backend engineer. Interested in anything that has to survive a traffic spike." },
  { username: "Sofia Ramirez", email: `sofia.ramirez${DEMO_DOMAIN}`, bio: "Product writer and former design lead." },
  { username: "Noah Patel", email: `noah.patel${DEMO_DOMAIN}`, bio: "Learning in public. Notes on teaching, studying, and explaining things well." },
  { username: "Ava Lindqvist", email: `ava.lindqvist${DEMO_DOMAIN}`, bio: "Essays on attention, health, and slow work." },
  { username: "Ethan Brooks", email: `ethan.brooks${DEMO_DOMAIN}`, bio: "Founder twice over. Writes down what went wrong the first time." },
];

// Readers exist only to give the like and comment counts something real behind
// them. They never author a story and they hold no points.
const READERS = [
  "Zara Khalil", "Leo Nakamura", "Isla Moreau", "Devon Park", "Nora Silva",
  "Kai Andersson", "Priya Raman", "Tomas Nowak", "Hana Suzuki", "Omar Haddad",
  "Elena Petrova", "Marcus Reid", "Yuki Tanaka", "Amara Diallo", "Felix Braun",
  "Clara Moretti", "Idris Bello", "Ruth Alvarez",
];

// A short, plain-text comment pool. Comments are attached to real stories at
// real positions so a story's comment count matches what its page shows.
const COMMENT_POOL = [
  "This put words to something I've been circling for months. Thank you.",
  "The second section is the part nobody talks about enough.",
  "Saving this one. I'll be re-reading it before my next project.",
  "I disagreed at first, then you won me over halfway through.",
  "Do you have a longer version of this? I'd read it.",
  "Practical and specific — exactly what I needed today.",
  "Great framing. I've already shared it with two people on my team.",
  "The point about starting smaller than feels satisfying is right.",
  "Been doing this by accident for a year and never named it.",
  "Clear writing on a topic that usually gets buried in jargon.",
];

/* Each story: feed order is newest-first, so `daysAgo` ascends down the list.
   `likes` and `comments` are counts of rows this script actually inserts. */
const POSTS = [
  {
    title: "The Future of AI in Everyday Life",
    category: "Technology",
    tags: ["Artificial Intelligence", "Productivity"],
    image: IMG("1620712943543-bcc4688e7485"),
    author: 0,
    daysAgo: 1,
    views: 3184,
    likes: 21,
    comments: 5,
    description: `
      <p>Most conversations about artificial intelligence start with something dramatic — a machine that writes a novel, a model that passes an exam, a system that replaces a profession. The far more interesting shift is happening quietly, in the middle of ordinary afternoons.</p>
      <p>It looks like this: a support agent drafting a reply from a customer's own words, then editing it for tone. A researcher asking for a summary of forty papers so she can decide which three to actually read. A developer describing a bug in plain language and getting a plausible starting point in return.</p>
      <p>None of these are transformations. They are shortenings — small compressions of the distance between an intention and a finished piece of work. And that, rather than any single dramatic capability, is what changes the shape of a working day. When the cost of a first draft falls close to zero, the scarce resource becomes judgement: knowing which draft is worth keeping.</p>
      <p>The practical consequences are already visible. People who are good at evaluating output are becoming more valuable than people who are merely fast at producing it. Writing a precise request turns out to be a skill in its own right, and a hard one.</p>
      <p>The honest answer to "what will AI do to everyday life" is probably unglamorous. It will remove a great many small frictions, add a new set of small obligations, and leave the genuinely difficult parts of being human exactly where they were.</p>
    `,
  },
  {
    title: "Building Scalable Web Applications",
    category: "Technology",
    tags: ["Architecture", "Backend", "Web Development"],
    image: IMG("1555066931-4365d14bab8c"),
    author: 1,
    daysAgo: 3,
    views: 2410,
    likes: 18,
    comments: 4,
    description: `
      <p>Scalability is usually discussed as though it were a property you buy — a bigger database, more servers, a queue. In practice it is mostly a property you avoid needing for as long as possible.</p>
      <p>The applications that grow gracefully tend to share three habits. First, they keep the request path boring: a request arrives, does its work, and returns. Anything genuinely slow is moved out of that path and into a worker. Second, they treat the database as the constraint it is, with indexes that match real query patterns rather than hopeful guesses. Third, they make the expensive thing measurable, because the first sign of trouble is almost never an error rate — it is a p99 latency that crept up three weeks ago.</p>
      <p>Caching deserves its reputation, but it is a sharp tool. A cache that can serve stale data without anyone noticing is a cache that will eventually hide a bug. Decide deliberately what is allowed to be out of date, and for how long.</p>
      <p>The hardest part is the least technical. Teams scale systems by refusing features that would make the system harder to reason about. Saying no early is cheaper than re-architecting later, and it is the only lever that gets easier the more disciplined you are.</p>
      <p>Start with the simplest thing that can possibly work. Measure it. Only then reach for the machinery.</p>
    `,
  },
  {
    title: "How Developers Learn Faster",
    category: "Education",
    tags: ["Learning", "Career", "Programming"],
    image: IMG("1516110833967-0b5716ca1387"),
    author: 3,
    daysAgo: 5,
    views: 1976,
    likes: 16,
    comments: 4,
    description: `
      <p>The fastest developers I know are not the ones who read the most. They are the ones who close the loop between reading and building soonest.</p>
      <p>Tutorials feel productive because they are frictionless, and that is precisely their danger. Following instructions exercises recognition, not recall. You finish a course able to say "I have seen this" while a blank file still defeats you. The fix is unglamorous: after every concept, build something small enough to finish in an afternoon and different enough that you cannot copy from the tutorial.</p>
      <p>The second habit is reading error messages properly, all the way down. Most people scan for a familiar word and start guessing. The message usually states the problem, the file, and the line. Learning to trust it — and to distrust your first theory — compresses debugging time dramatically.</p>
      <p>Third, learn to read source. Documentation tells you what a function is supposed to do; the source tells you what it actually does. Any library you depend on for more than a week is worth an hour inside.</p>
      <p>None of this is fast in the way that a video series is fast. It is fast in the way that compounds — each thing you learn by struggling connects to the next, and after a year the difference is not marginal. It is the difference between knowing about software and being able to build it.</p>
    `,
  },
  {
    title: "The Art of Explaining Complex Ideas",
    category: "Education",
    tags: ["Writing", "Teaching", "Communication"],
    image: IMG("1481627834876-b7833e8f5570"),
    author: 3,
    daysAgo: 8,
    views: 1542,
    likes: 14,
    comments: 3,
    description: `
      <p>A good explanation is not a simplification. It is a translation, and translation always costs something.</p>
      <p>The most common failure is starting at the wrong altitude. An expert begins with the mechanism, because that is what is interesting to them. A newcomer needs the problem first — what goes wrong without this idea, in terms they already feel. Once the problem is visceral, the mechanism has somewhere to attach.</p>
      <p>Analogies are the working tool, but they need to be spent carefully. A good analogy is load-bearing in exactly one place and obviously imperfect everywhere else. If your comparison requires a paragraph of caveats, it is doing more harm than good. Say what it captures, say what it does not, and move on.</p>
      <p>Then there is the discipline of the example. One concrete case, worked end to end, teaches more than five sketched ones. Real numbers, real names, a real failure mode. Abstractions are how you check understanding afterwards, not how you build it.</p>
      <p>The test of an explanation is not whether it made you feel clear. It is whether the listener can now do something they could not do before — and whether they can explain it to someone else.</p>
    `,
  },
  {
    title: "Small Habits, Big Changes",
    category: "Health",
    tags: ["Habits", "Wellbeing", "Productivity"],
    image: IMG("1499750310107-5fef28a66643"),
    author: 4,
    daysAgo: 11,
    views: 2755,
    likes: 19,
    comments: 5,
    description: `
      <p>Every January, people attempt to become different people. By March, most of them are the same people, and they conclude that they lack discipline. The conclusion is usually wrong — the plan was.</p>
      <p>Sustainable change almost always starts absurdly small. Not thirty minutes of exercise, but two minutes of it. Not a rewritten diet, but one meal that is slightly better. The point is not that two minutes is enough; the point is that two minutes is survivable on the worst day of your week, and surviving the worst day is what makes something a habit rather than a project.</p>
      <p>The second piece is making the behaviour easy to start. Put the shoes by the door, put the book on the pillow, put the water on the desk. Every unit of friction you remove is a unit of willpower you do not have to spend later, and willpower is the least reliable resource you own.</p>
      <p>Finally, decide in advance what "done" means on a bad day. A short walk counts. One paragraph counts. A version of the habit that survives illness, travel, and deadline weeks is worth more than a perfect version that disappears in February.</p>
      <p>Change that lasts is rarely dramatic. It is a series of small, boring decisions that you keep making because they were never big enough to be worth quitting.</p>
    `,
  },
  {
    title: "Sleep Is a Skill, Not a Luxury",
    category: "Health",
    tags: ["Sleep", "Wellbeing"],
    image: IMG("1506126613408-eca07ce68773"),
    author: 4,
    daysAgo: 14,
    views: 1893,
    likes: 15,
    comments: 3,
    description: `
      <p>Most people treat sleep as the thing that happens after everything else is finished. That ordering is exactly backwards, and it is expensive.</p>
      <p>Sleep is not a pause in your work; it is part of it. Memory consolidation, emotional regulation, and the metabolic housekeeping that keeps you well all happen while you are unconscious. A night of five hours does not cost you one hour of tomorrow — it costs you concentration, patience, and judgement for most of the following day.</p>
      <p>Treating sleep as a skill means being deliberate about the three levers that actually matter. Keep the wake-up time fixed, including at weekends; the body calibrates to the start of the day, not the end. Get daylight early, ideally outside, because light is the strongest signal your internal clock reads. And give the last hour of the evening a lower gear — dimmer light, quieter inputs, something that is not a screen full of other people's urgency.</p>
      <p>None of this is exotic advice. The difficulty is that every one of these choices competes with something that feels more urgent tonight. It is worth remembering that the version of you who stays up an extra hour is borrowing from the version who has to work tomorrow.</p>
    `,
  },
  {
    title: "Building Products People Actually Need",
    category: "Business",
    tags: ["Product", "Startups", "Design"],
    image: IMG("1559136555-9303baea8ebd"),
    author: 5,
    daysAgo: 17,
    views: 2233,
    likes: 17,
    comments: 4,
    description: `
      <p>The most common way to fail at product work is to build something impressive that nobody has a reason to open twice.</p>
      <p>Need, in practice, has a specific shape. It shows up as a workaround: the spreadsheet someone maintains by hand, the folder named final_v3_really, the three-step process that everyone has memorised because it is the only way the tool works. Workarounds are the best evidence you will ever get, because they cost someone real effort. Find one and you have found a product.</p>
      <p>The second signal is frequency. A problem you solve weekly will be adopted; a problem you solve yearly will be admired and forgotten. Before building, write down how often the user hits the problem and what they do today. If the answer to the second part is "nothing much," the need is probably not real.</p>
      <p>Then resist the temptation to build the whole thing. Ship the smallest version that removes the workaround it was built for, and watch what people do with it. Their second request is far more informative than your first idea, because it comes with evidence attached.</p>
      <p>Products people need are rarely clever. They are usually a little dull, extremely reliable, and exactly the shape of a problem that already exists.</p>
    `,
  },
  {
    title: "Lessons From Building My First SaaS",
    category: "Business",
    tags: ["Startups", "Engineering", "Lessons"],
    image: IMG("1519389950473-47ba0277781c"),
    author: 5,
    daysAgo: 21,
    views: 1748,
    likes: 13,
    comments: 3,
    description: `
      <p>I spent fourteen months building the wrong thing carefully, which is a more instructive experience than it sounds.</p>
      <p>The first lesson was about scope. I built an administration panel nobody asked for, with permissions and audit logs, before a single customer had logged in. It was well made and it was worthless. The features that mattered in the end were all discovered after launch, by watching people use the parts I had almost cut.</p>
      <p>The second lesson was about pricing. I set the number low because it felt safer, and then spent a year unable to afford support. A price is not a statement about your confidence; it is a filter for who you are building for. Cheap prices attract users who need the most help and pay for the least of it.</p>
      <p>The third was about the difference between a customer and a user. Users sign up because it is free. Customers come back because something breaks when they do not. I learned to count only the second group, and to ask them what they would do if the product vanished tomorrow.</p>
      <p>The business did not work out, but I would do it again. Nothing else teaches you so efficiently where your own judgement is unreliable.</p>
    `,
  },
  {
    title: "Why Deep Work Still Matters",
    category: "Business",
    tags: ["Focus", "Productivity", "Career"],
    image: IMG("1498050108023-c5249f4df085"),
    author: 0,
    daysAgo: 25,
    views: 2087,
    likes: 16,
    comments: 4,
    description: `
      <p>Every tool we use to make communication faster is also a tool for interrupting ourselves more efficiently.</p>
      <p>The work that compounds — writing, designing, reasoning about a system you do not fully understand yet — has a property that most tasks do not: it requires a long, unbroken runway. The first twenty minutes are largely spent reconstructing what you knew last time. Leave and return and you pay that cost again.</p>
      <p>This is why an hour of fragmented attention is not half as valuable as two hours of continuous attention. The arithmetic is not linear; below a certain threshold, the runway is never long enough to take off at all.</p>
      <p>Protecting that runway is a scheduling problem before it is a willpower problem. Put the deep block in the calendar first, before the meetings claim the day. Decide in advance what you are going to work on, because deciding while distracted is how a hard task becomes an impossible one. And accept that some communication will be slower — a reply in four hours instead of four minutes is usually fine, and the culture you build by replying instantly is one nobody can sustain.</p>
      <p>Deep work is not a productivity aesthetic. It is the only mode in which certain kinds of thinking are possible at all.</p>
    `,
  },
  {
    title: "What Makes a Story Worth Telling",
    category: "Entertainment",
    tags: ["Storytelling", "Writing"],
    image: IMG("1456513080510-7bf3a84b82f8"),
    author: 2,
    daysAgo: 29,
    views: 1436,
    likes: 12,
    comments: 3,
    description: `
      <p>Not every true thing is a story. A story is a true thing with a shape — something changed, and we watched it change.</p>
      <p>The shape almost always involves a gap between what the teller expected and what actually happened. Without that gap there is no tension, and without tension there is nothing to hold a listener's attention. This is why anecdotes about smooth successes are so dull: nothing was at stake because nothing surprised anyone.</p>
      <p>It also means the most useful thing you can do before telling a story is to ask what you believed at the start. If you cannot name your own mistaken expectation, you have a report rather than a story. Reports have their place, but they are not what someone remembers on the drive home.</p>
      <p>The second ingredient is specificity. "A difficult conversation" is not a scene; the kitchen table is. Concrete detail is what makes a story available to someone else's imagination, and it is also what makes it credible. Generalities are the sound of somebody summarising rather than remembering.</p>
      <p>Finally, a story needs an ending that pays off the beginning. Not a moral — a resonance. The listener should feel the gap close, even if the conclusion is that it never really closed at all.</p>
    `,
  },
  {
    title: "The Psychology of Writing",
    category: "Entertainment",
    tags: ["Writing", "Creativity"],
    image: IMG("1434030216411-0b793f4b4173"),
    author: 2,
    daysAgo: 33,
    views: 1672,
    likes: 14,
    comments: 3,
    description: `
      <p>Writing is not the process of transferring a finished thought onto a page. It is the process of discovering that you did not have a finished thought.</p>
      <p>This is the single most useful thing to understand about the psychology of the work, because it explains why writing feels so uncomfortable and why that discomfort is not a signal that something is wrong. The confusion you feel in the second paragraph is the point. You are finding out what you actually believe.</p>
      <p>It also explains the resistance that arrives just before you start. Resistance is not laziness; it is a rational response to the prospect of discovering that an idea you are fond of does not hold. The way through is to lower the stakes of the first draft until it feels like notes rather than a verdict.</p>
      <p>Two habits help more than any amount of motivation. Leave a sentence half-finished at the end of a session, so tomorrow begins with an easy move. And separate the draft from the edit by a real gap — a day if you can, ten minutes if you cannot. Editing your own fresh prose means defending it rather than improving it.</p>
      <p>Good writing is mostly the residue of a lot of unremarkable sessions in which nothing felt brilliant and the word count went up anyway.</p>
    `,
  },
  {
    title: "Cooking for One Without Losing the Joy of It",
    category: "Food",
    tags: ["Cooking", "Home", "Wellbeing"],
    image: IMG("1504674900247-0877df9cc836"),
    author: 4,
    daysAgo: 38,
    views: 1194,
    likes: 11,
    comments: 2,
    description: `
      <p>Cooking for one has a bad reputation. The received wisdom is that it is not worth the effort, and the result is a lot of people eating worse than they need to.</p>
      <p>The problem is almost always the recipe, not the appetite. Most recipes are written for four, which means a single person either eats the same thing four nights running or throws half of it away. Both feel like failure, and neither is necessary if you plan for the leftovers to become something else: roast vegetables that reappear in a grain bowl, a pot of beans that becomes soup and then toast.</p>
      <p>The second change is lowering the definition of a meal. Not every dinner needs to be a dish. Good bread, a sharp cheese, tomatoes with salt and oil, and something pickled is a meal, and it takes eight minutes. Being able to assemble rather than cook is what keeps a kitchen in use on tired evenings.</p>
      <p>Then there is the part people skip: set the table. A plate rather than the pan, a glass rather than the bottle, something to read while you eat. Eating alone is not a lesser form of eating, and the small ceremony of it is what separates a meal from refuelling.</p>
      <p>Cook what you like, in amounts that suit you, and stop apologising for the size of the pan.</p>
    `,
  },
  {
    title: "The Case for Travelling Slower",
    category: "Travel",
    tags: ["Travel", "Slow Living"],
    image: IMG("1488646953014-85cb44e25828"),
    author: 1,
    daysAgo: 42,
    views: 1387,
    likes: 12,
    comments: 2,
    description: `
      <p>The most tiring trips I have taken were the ones I planned best. Six cities in eleven days, each one photographed and none of them seen.</p>
      <p>There is a simple reason for this. Travel is a series of small competencies — which door, which ticket, which street, what time the shops close — and every new place resets them to zero. Moving constantly means living permanently in the expensive, exhausting phase of not knowing anything. Staying longer is not a sacrifice; it is the only way to stop paying that tax.</p>
      <p>Staying also changes what you notice. On the third day in a place, you stop performing tourism and start doing ordinary things: buying bread, finding the park people actually use, learning which café has the good seats at four in the afternoon. Those are the hours you remember, and they are the ones a schedule cannot manufacture.</p>
      <p>Practically, this means choosing fewer places and going back to them. It means an apartment with a kitchen instead of a hotel, and a morning with nothing in it. It means accepting that you will leave something unvisited — which is fine, because it gives you a reason to return.</p>
      <p>Travel is not a checklist to complete. It is a place to spend some time.</p>
    `,
  },
  {
    title: "Why Your Feed Leaves You Tired",
    category: "Social Media",
    tags: ["Attention", "Digital Life", "Wellbeing"],
    image: IMG("1516253593875-bd7ba052fbc5"),
    author: 0,
    daysAgo: 47,
    views: 2011,
    likes: 15,
    comments: 4,
    description: `
      <p>Twenty minutes on a feed should be restful. It very often is not, and the reason is not simply that the content is bad.</p>
      <p>A feed is a sequence of unrelated things, each carrying its own emotional instruction: this is outrageous, this is enviable, this is urgent, this is tragic, this is funny. Switching between them costs something. You are not reading a book with a mood; you are running a small emotional context switch every few seconds, dozens of times, without a break.</p>
      <p>Then there is the comparison arithmetic, which runs whether you want it to or not. A feed shows you the highlights of hundreds of lives in sequence, and it does so without the ordinary hours that surround them. It is not that any single post is dishonest. It is that the aggregate is a portrait of a world where nobody is tired, stuck, or between things.</p>
      <p>The fix is less about willpower and more about shape. Give the feed a boundary — a time, a place, a number of minutes — so it stops being the default state of a spare moment. Curate it aggressively: unfollow anything that reliably makes you feel worse, even if you like the person. And replace some of it with something that has an end. A chapter finishes. A feed never does, and that is precisely the problem.</p>
    `,
  },
  {
    title: "What the Next Decade of the Web Looks Like",
    category: "News",
    tags: ["Technology", "Analysis", "Internet"],
    image: IMG("1451187580459-43490279c0fa"),
    author: 1,
    daysAgo: 54,
    views: 1620,
    likes: 13,
    comments: 3,
    description: `
      <p>The most reliable prediction about the next ten years of the web is that it will be less like a fresh start and more like a renovation of a building people are still living in.</p>
      <p>Three pressures are already visible. The first is economic: the advertising model that funded most of the open web is being squeezed from both ends, by stricter privacy defaults and by interfaces that answer questions directly instead of sending people to publishers. Content that used to be paid for by a page view is going to need another reason to exist.</p>
      <p>The second is architectural. For fifteen years the web has centralised around a handful of platforms because that is where the audiences were. The counter-pressure is smaller, unglamorous, and more durable than the last round of hype: personal sites, paid newsletters, and communities with a membership fee. They are not trying to replace the big platforms. They are trying not to depend on them.</p>
      <p>The third is regulatory, and it is the least predictable. Rules about data, competition, and platform responsibility are being written in many jurisdictions at once, and the practical effect for builders is that portability and transparency are becoming design requirements rather than virtues.</p>
      <p>None of this is a prediction of collapse. It is a prediction of consolidation followed by a slow, uneven rebuilding of things worth owning — which is roughly what happened the last time the web changed shape.</p>
    `,
  },
];

/* ── Helpers ─────────────────────────────────────────────────────────── */

// Deterministic picker: no RNG, so re-running the seed produces the same
// engagement layout. Both strides are coprime with the roster size, so the
// indices never repeat inside a single story.
const pickDistinct = (list, offset, count) => {
  const out = [];
  for (let i = 0; i < Math.min(count, list.length); i += 1) {
    out.push(list[(offset * 7 + i * 5) % list.length]);
  }
  return out.filter((v, i, arr) => arr.indexOf(v) === i);
};

const daysAgoDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(9, 30, 0, 0);
  return d;
};

const tagIdCache = new Map();
const resolveTag = async (name) => {
  const key = name.toLowerCase();
  if (tagIdCache.has(key)) return tagIdCache.get(key);
  let tag = await Tag.findOne({ tag_name: name });
  if (!tag) tag = await Tag.create({ tag_name: name });
  tagIdCache.set(key, tag._id);
  return tag._id;
};

/* ── Teardown: remove only what this script created ──────────────────── */
const removeDemoContent = async () => {
  const demoUsers = await userModel.find({ email: new RegExp(`${DEMO_DOMAIN.replace(".", "\\.")}$`) }).select("_id");
  const userIds = demoUsers.map((u) => u._id);

  if (userIds.length) {
    const blogIds = await blogModel.find({ user: { $in: userIds } }).distinct("_id");
    if (blogIds.length) {
      await Promise.all([
        Like.deleteMany({ blog_id: { $in: blogIds } }),
        Comment.deleteMany({ blog_id: { $in: blogIds } }),
        Bookmark.deleteMany({ blog: { $in: blogIds } }),
        BlogView.deleteMany({ blog_id: { $in: blogIds } }),
        Notification.deleteMany({ blog: { $in: blogIds } }),
        BlogRevision.deleteMany({ blog: { $in: blogIds } }),
        BlogTag.deleteMany({ blog_id: { $in: blogIds } }),
      ]);
      await blogModel.deleteMany({ _id: { $in: blogIds } });
    }
    // Anything a demo reader left on someone else's post.
    await Promise.all([
      Like.deleteMany({ user_id: { $in: userIds } }),
      Comment.deleteMany({ user_id: { $in: userIds } }),
      Bookmark.deleteMany({ user: { $in: userIds } }),
      BlogView.deleteMany({ user_id: { $in: userIds } }),
    ]);
    await userModel.deleteMany({ _id: { $in: userIds } });
  }

  // Drop any tag that is now referenced by nothing, so re-seeding does not
  // leave orphaned tag rows behind.
  const orphans = await Tag.aggregate([
    { $lookup: { from: "blogtags", localField: "_id", foreignField: "tag_id", as: "links" } },
    { $match: { links: { $size: 0 } } },
    { $project: { _id: 1, tag_name: 1 } },
  ]);
  if (orphans.length) await Tag.deleteMany({ _id: { $in: orphans.map((t) => t._id) } });

  return { users: userIds.length, orphanTags: orphans.length };
};

/* ── Build ───────────────────────────────────────────────────────────── */
const seed = async () => {
  const removed = await removeDemoContent();

  // Demo authors: no password, so the accounts cannot be signed into.
  const authors = await userModel.insertMany(
    AUTHORS.map((a) => ({ ...a, role: "Writer", profile_image: "", points: 0 }))
  );

  const readers = await userModel.insertMany(
    READERS.map((username, i) => ({
      username,
      email: `reader${i + 1}${DEMO_DOMAIN}`,
      role: "Reader",
      profile_image: "",
      points: 0,
    }))
  );

  // Engagement can come from any demo account. Authors are included so a
  // story's own author is not the only person who ever reacted to it.
  const roster = [...authors, ...readers];

  let likeRows = 0;
  let commentRows = 0;

  for (let i = 0; i < POSTS.length; i += 1) {
    const post = POSTS[i];
    const tagIds = await Promise.all(post.tags.map(resolveTag));
    const createdAt = daysAgoDate(post.daysAgo);

    const blog = await blogModel.create({
      title: post.title,
      description: post.description.trim(),
      image: post.image,
      category: post.category,
      tags: tagIds,
      user: authors[post.author]._id,
      status: "Published",
      publishAt: null,
      views: post.views,
      // created_at/updated_at use the schema's timestamps; override created_at
      // so the feed has a believable spread of dates rather than one batch.
      created_at: createdAt,
      updated_at: createdAt,
    });

    await BlogTag.insertMany(tagIds.map((tag_id) => ({ blog_id: blog._id, tag_id })));

    const likers = pickDistinct(roster, i, post.likes);
    await Like.insertMany(likers.map((user_id) => ({ blog_id: blog._id, user_id, created_at: createdAt })));
    likeRows += likers.length;

    const commenters = pickDistinct(roster, i + 9, post.comments);
    await Comment.insertMany(
      commenters.map((user_id, k) => ({
        blog_id: blog._id,
        user_id,
        content: COMMENT_POOL[(i * 3 + k) % COMMENT_POOL.length],
        created_at: createdAt,
        updated_at: createdAt,
      }))
    );
    commentRows += commenters.length;
  }

  const tagCount = await Tag.countDocuments();

  console.log("");
  console.log("  Explore seed complete");
  console.log("  ────────────────────────────────────────────");
  console.log(`  removed      ${removed.users} demo accounts, ${removed.orphanTags} orphan tags`);
  console.log(`  authors      ${authors.length}`);
  console.log(`  readers      ${readers.length}`);
  console.log(`  stories      ${POSTS.length}`);
  console.log(`  tags         ${tagCount}`);
  console.log(`  likes        ${likeRows}`);
  console.log(`  comments     ${commentRows}`);
  console.log("");
};

(async () => {
  const url = process.env.MONGO_URL;
  if (!url) {
    console.error("MONGO_URL is not set — cannot seed.");
    process.exit(1);
  }
  try {
    await mongoose.connect(url);
    await seed();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    try {
      await mongoose.disconnect();
    } catch {
      /* already down */
    }
    process.exit(1);
  }
})();
