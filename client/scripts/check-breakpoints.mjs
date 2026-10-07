#!/usr/bin/env node
/**
 * Breakpoint guard — `npm run check:breakpoints`
 *
 * The responsive ladder is a documented contract (see the "THE BREAKPOINT
 * LADDER" block at the top of src/styles/inkwell.css and BREAKPOINT_VALUES in
 * src/theme/theme.js). A media query condition cannot read a custom property,
 * so the numbers are retyped in every file and drift silently — which is
 * exactly how the site ended up with 519/640/767/860/1024/1240 all meaning
 * "tablet".
 *
 * This walks every stylesheet under src/ and fails on any width token that is
 * not on the ladder, so a new @media cannot reintroduce an outlier.
 *
 * Deliberate exceptions are listed in EXCEPTIONS below, each with the reason
 * it is not on the ladder. Adding to that list is a design decision; make it
 * on purpose and leave a comment saying why.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src");

/* The ladder, from inkwell.css / theme.js. Max-width steps carry the `.95`
 * (MUI's own down() convention); a min-width mirror is the round number one
 * pixel above, so the pair leaves no gap on fractional viewports. */
const MAX_WIDTH_LADDER = [479.95, 599.95, 899.95, 1023.95, 1199.95];
const MIN_WIDTH_LADDER = [480, 600, 900, 1024, 1200];

/* file (relative to src/, posix separators) → values it is allowed to use. */
const EXCEPTIONS = {
  "pages/Rewards.css": {
    values: [720, 800, 820, 900],
    why: "hero must hold its 55/45 split at tablet — tuned last pass, see the plan's Decision 1",
  },
  "pages/Login.css": {
    values: [1180, 979.95],
    why: "deliberately tuned split-screen; 599.95 is already on the ladder",
  },
  "pages/CreateBlog.css": {
    values: [1249.95],
    why: "the three-tier 1024–1249.95 studio aside",
  },
  "components/Footer.css": {
    values: [519, 767],
    why: "content-driven, not device tiers: 520px is where the CTA stops fitting a half-width cell, 767px is where the brand statement stops sharing a row",
  },
};

/* Only width conditions are checked. `max-height` (e.g. Login's landscape
 * query) is a viewport-height concern, not part of the horizontal ladder. */
const MEDIA_RE = /@media[^{]*/g;
const CONDITION_RE = /(min|max)-width\s*:\s*([0-9.]+)px/g;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".css")) out.push(full);
  }
  return out;
}

const violations = [];

for (const file of walk(SRC)) {
  const rel = path.relative(SRC, file).split(path.sep).join("/");
  const allowed = new Set(EXCEPTIONS[rel]?.values ?? []);
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);

  lines.forEach((line, i) => {
    for (const media of line.match(MEDIA_RE) ?? []) {
      for (const [, kind, raw] of media.matchAll(CONDITION_RE)) {
        const value = Number(raw);
        const ladder = kind === "max" ? MAX_WIDTH_LADDER : MIN_WIDTH_LADDER;
        if (ladder.includes(value) || allowed.has(value)) continue;
        violations.push({ rel, line: i + 1, kind, value, text: media.trim() });
      }
    }
  });
}

if (!violations.length) {
  console.log("breakpoints: OK — every @media width is on the ladder.");
  process.exit(0);
}

console.error(`breakpoints: ${violations.length} off-ladder width(s)\n`);
for (const v of violations) {
  console.error(`  ${v.rel}:${v.line}  ${v.kind}-width: ${v.value}px`);
  console.error(`      ${v.text}`);
}
console.error(
  "\nUse a ladder value (max-width 479.95 / 599.95 / 899.95 / 1023.95 / 1199.95,\n" +
    "or its min-width mirror 480 / 600 / 900 / 1024 / 1200). Where a grid can\n" +
    "simply reflow, prefer `repeat(auto-fit, minmax(<min>, 1fr))` and delete the\n" +
    "query instead. If the value is genuinely content-driven, add it to\n" +
    "EXCEPTIONS in scripts/check-breakpoints.mjs with the reason."
);
process.exit(1);
