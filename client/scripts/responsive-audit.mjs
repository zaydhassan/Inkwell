/* ─────────────────────────────────────────────────────────────────────────
   Responsive audit — drives headless Chrome over CDP and reports, for every
   route × viewport, whether the page overflows horizontally and which element
   caused it.

   Read-only: it only navigates, measures and (optionally) screenshots. It
   writes nothing into the app and touches no database.

   Usage:
     node scripts/responsive-audit.mjs                    # measure only
     node scripts/responsive-audit.mjs --shots            # + screenshots
     node scripts/responsive-audit.mjs --only=rewards     # one route (bare
                                                          # substring — see the
                                                          # MSYS note below)

   Requires the Vite dev server on :3000 (and, for the pages that fetch, the
   API on :8080 — but nothing here is required to answer, since the audit only
   asserts layout).
   ───────────────────────────────────────────────────────────────────────── */

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const arg = (name) => (process.argv.find((a) => a.startsWith(`--${name}=`)) || "").slice(name.length + 3);

const ORIGIN = "http://localhost:3000";
/* Overridable so a targeted run can share the machine with a long full sweep
   instead of fighting it for the debugging port. */
const PORT = Number(arg("port")) || 9223;
const SHOTS = process.argv.includes("--shots");
/* Matched as a bare substring, so `--only=rewards` works. Do NOT write
   `--only=/rewards` in Git Bash: MSYS rewrites a leading-slash argument into a
   Windows path ("C:/Program Files/Git/rewards") before node ever sees it. */
const ONLY = arg("only");
/* `--vp=360,900,1440` narrows the matrix. The full sweep is 304 cells and takes
   over an hour against a live API; this is how you get a fast answer about one
   band (e.g. `--vp=360,600,900` around a breakpoint you just moved). */
const VP_FILTER = arg("vp")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter(Boolean);
const SHOT_DIR = "client-audit-shots";

/* The viewport matrix. 900/1023/1024/1100 straddle the nav breakpoint and the
   studio collapse; 700/850 straddle the leaderboard metric band. */
const ALL_VIEWPORTS = [
  [320, 568], [360, 740], [390, 844], [414, 896], [480, 800],
  [600, 900], [700, 900], [768, 1024], [850, 900], [900, 800],
  [1023, 768], [1024, 768], [1100, 800], [1200, 900], [1440, 900], [1920, 1080],
];
const VIEWPORTS = VP_FILTER.length
  ? ALL_VIEWPORTS.filter(([w]) => VP_FILTER.includes(w))
  : ALL_VIEWPORTS;

/* Every routed page. `/login` and `/create-blog` are immersive (App.js strips
   the Navbar/Footer), so their assertions differ — see INVARIANTS below. */
const ROUTES = [
  { path: "/", label: "Home", public: true },
  { path: "/explore", label: "Explore", public: true },
  { path: "/about", label: "About", public: true },
  { path: "/contact", label: "Contact", public: true },
  { path: "/leaderboard", label: "Leaderboard", public: true },
  { path: "/login", label: "Login", public: true, immersive: true },
  { path: "/register", label: "Register", public: true },
  { path: "/forgot-password", label: "ForgotPassword", public: true },
  { path: "/profile", label: "Profile" },
  { path: "/bookmarks", label: "Bookmarks" },
  { path: "/reading-history", label: "ReadingHistory" },
  { path: "/analytics", label: "Analytics" },
  { path: "/rewards", label: "Rewards" },
  { path: "/notifications", label: "Notifications" },
  { path: "/my-blogs", label: "MyBlogs" },
  { path: "/create-blog", label: "CreateBlog", immersive: true },
  { path: "/blog-details/000000000000000000000000", label: "BlogDetails" },
  { path: "/edit-blog/000000000000000000000000", label: "EditBlog" },
  { path: "/admin", label: "Admin", admin: true },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Sessions. The refresh stub must return a whole `user` object, not just a
   token: AuthContext writes `data.user` straight into localStorage, so a
   token-only response clobbers the seeded user and the page renders signed
   out. Role matters too — /admin redirects to / without an Admin seed, which
   would report a clean pass on a page that never rendered. */
/* Role strings are Capitalized and must match server/models/userModel.js's enum
   exactly (['Reader','Writer','Admin']). A lowercase seed looks harmless — the
   page renders, the session looks live — but the two routes that actually gate
   on the value bounce to "/": App.js:50 is `user?.role === "Admin"` and
   CreateBlog.js:302 is `userRole !== 'Writer'`. Both then reported a clean pass
   on the Home page they were redirected to. */
const USERS = {
  writer: { _id: "audit-writer", name: "Audit Writer", role: "Writer", points: 542, level: "Rising", badges: [] },
  reader: { _id: "audit-reader", name: "Audit Reader", role: "Reader", points: 120, level: "New", badges: [] },
  admin: { _id: "audit-admin", name: "Audit Admin", role: "Admin", points: 0, level: "New", badges: [] },
};
let currentUser = USERS.writer;

/* ── A very small CDP client ────────────────────────────────────────────── */
class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.listeners = [];
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      } else if (msg.method) {
        this.listeners.forEach((fn) => fn(msg));
      }
    });
  }

  on(fn) { this.listeners.push(fn); }

  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(payload));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }
      }, 30000);
    });
  }
}

async function connect() {
  // Chrome needs a moment before /json/version answers.
  let wsUrl = null;
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const j = await res.json();
      if (j.webSocketDebuggerUrl) { wsUrl = j.webSocketDebuggerUrl; break; }
    } catch { /* not up yet */ }
    await sleep(250);
  }
  if (!wsUrl) throw new Error("Chrome never exposed a debugging endpoint");
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.addEventListener("open", res, { once: true });
    ws.addEventListener("error", rej, { once: true });
  });
  return new CDP(ws);
}

/* ── The probe, evaluated in the page ────────────────────────────────────── */
function probeSource({ immersive }) {
  return `(() => {
    const vw = window.innerWidth;
    const doc = document.documentElement;

    /* An element that sits inside a scroll/clip container is deliberately
       allowed past the viewport — it is not page-level overflow. Walk the
       ancestors and drop anything that is clipped by one. */
    const clipped = (el) => {
      let p = el.parentElement;
      while (p && p !== doc) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === "auto" || ox === "scroll" || ox === "hidden" || ox === "clip") return true;
        p = p.parentElement;
      }
      return false;
    };

    const offenders = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      if (r.right <= vw + 1 && r.left >= -1) continue;
      if (clipped(el)) continue;
      offenders.push({
        tag: el.tagName.toLowerCase(),
        cls: (typeof el.className === "string" ? el.className : "").slice(0, 90),
        left: Math.round(r.left),
        right: Math.round(r.right),
        width: Math.round(r.width),
      });
    }
    offenders.sort((a, b) => b.right - a.right);

    /* A zero rect is the only visibility test that also accounts for an
       ancestor being display:none — the drawer's links are laid out inside a
       closed Drawer, so their own computed display is still flex. Never pass a
       union selector such as "nav a, nav button": it resolves to the first
       match in document order and would silently report on the wrong control.
       (No backticks in this file's probe comments — they end the template.) */
    const vis = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      return cs.display !== "none" && cs.visibility !== "hidden" && el.getBoundingClientRect().width > 0;
    };

    const out = {
      vw,
      path: location.pathname + location.search,
      docScroll: doc.scrollWidth,
      docClient: doc.clientWidth,
      bodyScroll: document.body.scrollWidth,
      bodyClient: document.body.clientWidth,
      overflow: doc.scrollWidth > doc.clientWidth + 1,
      offenders: offenders.slice(0, 10),
      offenderCount: offenders.length,
      /* The two navigation controls, each resolved by a hook the Navbar itself
         declares: the desktop row is the "Primary" nav landmark, the phone
         control is the button that opens the drawer. */
      navLinksVisible: vis('nav[aria-label="Primary"]'),
      hamburgerVisible: vis('[aria-controls="ink-mobile-nav"]'),
      brandVisible: !!document.body.textContent.includes("Inkwell") || !!document.querySelector("header"),
    };

    /* Is the immersive route actually immersive? App.js strips the chrome. */
    if (${immersive}) out.hasFooter = !!document.querySelector("footer");

    /* Admin: the sidebar must STACK above the content, not sit beside it. Once
       the sidebar is 100% wide a width check alone cannot tell those apart —
       the broken row layout crushes main to a sliver, but so would several
       other failures — so record both rects and compare their tops. */
    /* There are TWO main elements: App.js wraps every route in one, and the
       admin panel nests its own content column inside that. querySelector
       returns the outer shell, whose width is always the viewport — so it
       reported a comfortable 100% on a panel that was actually crushed. Take
       the innermost (last in document order). */
    const mains = document.querySelectorAll("main");
    const main = mains[mains.length - 1];
    if (main) {
      const mr = main.getBoundingClientRect();
      out.mainWidth = Math.round(mr.width);
      out.mainTop = Math.round(mr.top);
      out.mainCount = mains.length;
    }
    const side = document.querySelector('nav[aria-label="Admin sections"]');
    if (side) {
      const sr = side.getBoundingClientRect();
      out.sideWidth = Math.round(sr.width);
      out.sideTop = Math.round(sr.top);
    }

    return JSON.stringify(out);
  })()`;
}

/* ── Run ─────────────────────────────────────────────────────────────────── */
const profileDir = mkdtempSync(join(tmpdir(), "rw-audit-"));
const chrome = spawn(
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--disable-extensions",
    "--window-size=1440,900",
    "about:blank",
  ],
  { stdio: "ignore" }
);

let cdp;
const results = [];
const consoleErrors = [];

try {
  cdp = await connect();

  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });

  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Runtime.enable", {}, sessionId);
  await cdp.send("Network.enable", {}, sessionId);

  /* The session seed cannot be an addScriptToEvaluateOnNewDocument: the user
     has to differ per route (admin vs writer), and the page's own bootstrap
     reads localStorage at mount. So warm up on the origin once, then rewrite
     the keys from the current document before each navigation. */
  await cdp.send("Page.navigate", { url: ORIGIN + "/" }, sessionId);
  await sleep(1200);

  const seedSession = async (user) => {
    /* The stubs read `currentUser`, so it has to follow the route being seeded.
       Leaving it at its initial value answered every /admin request as the
       writer, and the page still rendered, so nothing looked wrong. */
    currentUser = user;
    const { result } = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const u = ${JSON.stringify(user)};
        localStorage.setItem("inkwell-theme", "dark");
        localStorage.setItem("user", JSON.stringify(u));
        localStorage.setItem("userId", u._id);
        localStorage.setItem("userRole", u.role);
        localStorage.setItem("isLogin", "true");
        return localStorage.getItem("userRole");
      })()`,
      returnByValue: true,
    }, sessionId);
    return result.value;
  };

  /* A fixed sleep is not enough. The first time a lazy route is asked for in a
     run, the dev server still has to transform its chunk; under load that can
     outlast any sleep you pick. When it does, the probe reads an empty #root —
     no Navbar, no nav control, a blank white screenshot — which reads exactly
     like a layout defect and is entirely fake. That is what produced the
     phantom "/contact has no navbar at 360px": 360 is the first viewport in the
     matrix, so that cell was the very first /contact request of the run. Poll
     for the app to actually mount instead of guessing. */
  const waitForMount = async (timeoutMs = 20000) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const { result } = await cdp
        .send("Runtime.evaluate", {
          expression: `(() => {
            const r = document.getElementById("root");
            return r ? r.children.length : 0;
          })()`,
          returnByValue: true,
        }, sessionId)
        .catch(() => ({ result: { value: 0 } }));
      if (result.value > 0) return true;
      await sleep(150);
    }
    return false;
  };

  /* Only the refresh route is stubbed — every other request behaves as it does
     for a real visitor, so no test user is ever written to the database. */
  await cdp.send("Fetch.enable", {
    patterns: [
      { urlPattern: "*/api/v1/user/refresh", requestStage: "Request" },
      { urlPattern: "*/api/v1/admin/*", requestStage: "Request" },
    ],
  }, sessionId);

  /* The three admin GETs are stubbed as well. The seeded session is a synthetic
     user, so against the real API they answer 401 and the panel renders nothing
     but "Couldn't load admin data." — every admin layout assertion then passes
     on a page that never drew. (Observed: the 360px admin screenshot was the
     error state.) The fixtures are deliberately obvious non-data so a stubbed
     render can never be read as a real one. */
  const ADMIN_FIXTURES = {
    "/api/v1/admin/users": {
      users: Array.from({ length: 4 }, (_, i) => ({
        _id: `audit-u${i}`, username: `audit_user_${i + 1}`,
        email: `audit${i + 1}@example.invalid`, role: i === 0 ? "Admin" : "Writer",
      })),
    },
    "/api/v1/admin/blogs": {
      blogs: Array.from({ length: 4 }, (_, i) => ({
        _id: `audit-b${i}`, title: `Audit blog title number ${i + 1}`,
        status: i % 2 ? "Draft" : "Published",
      })),
    },
    "/api/v1/admin/comments": {
      comments: Array.from({ length: 4 }, (_, i) => ({
        _id: `audit-c${i}`, content: `Audit comment body ${i + 1}`,
        user_id: { username: `audit_user_${i + 1}` },
      })),
    },
  };

  cdp.on(async (msg) => {
    if (msg.method === "Fetch.requestPaused") {
      const req = msg.params.request;
      const fulfil = async (payload) => {
        /* The id is msg.params.requestId, NOT msg.params.request.requestId —
           the `request` object is the Network.Request (url, method, headers)
           and carries no id. Getting this wrong fails with "Failed to
           deserialize params.requestId", which the catch below used to swallow:
           every stubbed call then hung forever and the page settled into a
           spinner no assertion could see. */
        await cdp.send("Fetch.fulfillRequest", {
          requestId: msg.params.requestId,
          responseCode: 200,
          responseHeaders: [{ name: "Content-Type", value: "application/json" }],
          body: Buffer.from(JSON.stringify(payload)).toString("base64"),
        }, msg.sessionId).catch((e) => {
          if (process.env.AUDIT_NET) console.error("  fulfil FAILED:", String(e.message || e).slice(0, 200));
        });
      };

      // Only GETs, and only for an Admin session — a write must never be faked.
      const adminPath = req.method === "GET"
        ? Object.keys(ADMIN_FIXTURES).find((p) => req.url.includes(p))
        : null;

      /* AUDIT_NET=1 traces every intercepted request and how it was answered —
         the only way to tell a stubbed-but-hanging request from one that was
         never made. */
      if (process.env.AUDIT_NET) {
        console.error(`  net ${req.method} ${req.url.replace(ORIGIN, "")} → `
          + (req.url.includes("/user/refresh") ? "refresh"
            : adminPath && currentUser.role === "Admin" ? `stub ${adminPath}`
            : "passthrough"));
      }

      if (req.url.includes("/user/refresh")) {
        await fulfil({ success: true, accessToken: "audit-token", user: currentUser });
      } else if (adminPath && currentUser.role === "Admin") {
        await fulfil(ADMIN_FIXTURES[adminPath]);
      } else {
        await cdp.send("Fetch.continueRequest", { requestId: req.requestId }, msg.sessionId).catch(() => {});
      }
    }
    if (msg.method === "Runtime.exceptionThrown") {
      consoleErrors.push(msg.params.exceptionDetails?.exception?.description || "exception");
    }
    if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
      consoleErrors.push((msg.params.args || []).map((a) => a.value ?? a.description ?? "").join(" "));
    }
  });

  const routes = ONLY ? ROUTES.filter((r) => r.path.includes(ONLY)) : ROUTES;
  if (!routes.length) {
    throw new Error(`--only="${ONLY}" matched no route; nothing would be measured`);
  }
  if (!VIEWPORTS.length) {
    throw new Error(`--vp="${arg("vp")}" matched no viewport; nothing would be measured`);
  }
  console.log(`auditing ${routes.length} route(s) × ${VIEWPORTS.length} viewports`);

  for (const vp of VIEWPORTS) {
    const [width, height] = vp;
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width, height, deviceScaleFactor: 1, mobile: false,
    }, sessionId);

    for (const route of routes) {
      /* A route that redirects (an unauthenticated /admin, a missing blog id)
         tears down the execution context and every in-flight CDP command with
         it. Without this try/catch one bad cell kills the entire run. */
      try {
        await seedSession(route.admin ? USERS.admin : USERS.writer);
        await cdp.send("Page.navigate", { url: ORIGIN + route.path }, sessionId);
        const mounted = await waitForMount();
        // Let the entrance animations settle and any fetch resolve.
        await sleep(900);

        /* Scroll the whole page so every `whileInView` block mounts, then
           return. Sampling without this reads un-mounted blocks as opacity 0
           and can hide overflow that only exists once the section renders. */
        await cdp.send("Runtime.evaluate", {
          expression: `(async () => {
            const step = window.innerHeight * 0.8;
            for (let y = 0; y < document.body.scrollHeight; y += step) {
              window.scrollTo(0, y);
              await new Promise(r => setTimeout(r, 60));
            }
            window.scrollTo(0, 0);
            await new Promise(r => setTimeout(r, 250));
          })()`,
          awaitPromise: true,
        }, sessionId);

        const { result } = await cdp.send("Runtime.evaluate", {
          expression: probeSource({ immersive: !!route.immersive }),
          returnByValue: true,
        }, sessionId);

        let data;
        try { data = JSON.parse(result.value); } catch { data = { error: "probe failed" }; }
        results.push({ route, width, height, mounted, ...data });

        if (SHOTS) {
          const dir = join(SHOT_DIR, `${width}x${height}`);
          mkdirSync(dir, { recursive: true });
          const shot = await cdp.send("Page.captureScreenshot", {
            format: "png", captureBeyondViewport: true,
          }, sessionId).catch(() => null);
          if (shot?.data) {
            writeFileSync(join(dir, `${route.label}.png`), Buffer.from(shot.data, "base64"));
          }
        }
      } catch (err) {
        results.push({ route, width, height, error: String(err.message || err).slice(0, 120) });
      }
    }
    process.stderr.write(`  measured ${width}×${height}\n`);
  }
} finally {
  try { if (cdp) cdp.ws.close(); } catch { /* already gone */ }
  chrome.kill();
  await sleep(600);
  try { rmSync(profileDir, { recursive: true, force: true }); } catch { /* windows lock */ }
}

/* ── Report ──────────────────────────────────────────────────────────────── */
const bad = results.filter((r) => r.overflow);
const skipped = results.filter((r) => r.error);

/* A route that quietly redirected did not get measured, even though it will
   report "no overflow". This is the false-pass shape: /admin without an Admin
   seed bounces to "/" and looks perfectly healthy. */
const redirected = results.filter((r) => r.path && !r.path.startsWith(r.route.path.split("?")[0]));
console.log("\n=== REDIRECTED (not actually measured) ===");
if (!redirected.length) {
  console.log("  none — every route rendered where it was asked to");
} else {
  const seen = new Set();
  for (const r of redirected) {
    const key = `${r.route.label}→${r.path}`;
    if (seen.has(key)) continue;
    seen.add(key);
    console.log(`  ${r.route.label.padEnd(16)} ${r.route.path} → ${r.path}`);
  }
}

/* A cell whose app never mounted is not a measurement. It must be called out
   before the overflow verdict, because "no overflow" on a blank page is the
   most convincing false pass this tool can produce. */
const unmounted = results.filter((r) => r.mounted === false);
if (unmounted.length) {
  console.log("\n=== NEVER MOUNTED (blank — result is meaningless) ===");
  for (const r of unmounted) console.log(`  ${r.route.label.padEnd(16)} ${r.width}px`);
}

console.log("\n=== HORIZONTAL OVERFLOW ===");
if (!bad.length) {
  console.log("  none — every route fits every viewport");
} else {
  const byRoute = new Map();
  for (const r of bad) {
    if (!byRoute.has(r.route.label)) byRoute.set(r.route.label, []);
    byRoute.get(r.route.label).push(r);
  }
  for (const [label, rows] of byRoute) {
    const widths = rows.map((r) => `${r.width}(+${r.docScroll - r.docClient})`).join(" ");
    console.log(`  ${label.padEnd(16)} ${widths}`);
    const worst = rows.sort((a, b) => (b.docScroll - b.docClient) - (a.docScroll - a.docClient))[0];
    for (const o of worst.offenders.slice(0, 3)) {
      console.log(`      └ <${o.tag} class="${o.cls}"> right=${o.right} w=${o.width}`);
    }
  }
}

/* The Navbar invariant: exactly one navigation control must be reachable.
   Neither rendering is the 900–1199px dead zone; both is a visible duplicate. */
/* Every non-immersive width, not just the band we know was broken — the
   invariant is "exactly one", and it should be checked at the phone widths and
   the desktop widths too, where the other failure mode (a stale control left
   showing) would appear. */
const navBands = results.filter((r) => !r.route.immersive && !r.route.admin && r.mounted !== false && r.width != null && r.navLinksVisible !== undefined);
const navBroken = navBands.filter((r) => !r.navLinksVisible && !r.hamburgerVisible);
const navDuplicate = navBands.filter((r) => r.navLinksVisible && r.hamburgerVisible);
console.log("\n=== NAVBAR (exactly one control per width) ===");
if (!navBroken.length && !navDuplicate.length) {
  console.log(`  ok — exactly one nav control at all ${navBands.length} sampled widths`);
} else {
  const widths = (rows) => [...new Set(rows.map((r) => r.width))].sort((a, b) => a - b).join(", ");
  if (navBroken.length) console.log(`  NO NAV CONTROL at width(s): ${widths(navBroken)}`);
  if (navDuplicate.length) console.log(`  TWO NAV CONTROLS at width(s): ${widths(navDuplicate)}`);
}

/* The Admin panel on a phone: the sidebar must stack ABOVE the content at full
   width, not sit beside it and crush the content to a sliver. */
const admin = results.filter((r) => r.route.admin && r.width <= 480 && r.mainWidth != null);
if (admin.length) {
  console.log("\n=== ADMIN LAYOUT (phone) ===");
  for (const r of admin) {
    const pct = Math.round((r.mainWidth / r.width) * 100);
    const stacked = r.sideTop != null && r.mainTop != null && r.mainTop >= r.sideTop + 20;
    const side = r.sideWidth == null ? "sidebar NOT FOUND" : `sidebar ${r.sideWidth}px @y${r.sideTop}`;
    console.log(`  ${r.width}px → ${side}, main ${r.mainWidth}px @y${r.mainTop} (${pct}% of viewport)`
      + (stacked ? "   stacked ok" : "   ← NOT STACKED"));
  }
}

if (skipped.length) console.log(`\n  (${skipped.length} probe(s) failed to evaluate)`);
if (consoleErrors.length) {
  console.log("\n=== CONSOLE ERRORS ===");
  for (const e of [...new Set(consoleErrors)].slice(0, 12)) console.log("  " + String(e).slice(0, 160));
}

writeFileSync("responsive-audit.json", JSON.stringify(results, null, 2));
console.log(`\n${results.length} measurements → responsive-audit.json`);
if (SHOTS) console.log(`screenshots → ${SHOT_DIR}/`);
