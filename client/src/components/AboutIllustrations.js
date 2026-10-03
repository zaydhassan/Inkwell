import React from "react";
import { Box } from "@mui/material";

/* ─────────────────────────────────────────────────────────────────────
   Original InkWell vector scenes for the About page.

   Both are pure inline SVG — no image assets, no network requests, no
   portrait of any kind — drawn in the page's dark charcoal + warm-orange
   grade so they read as part of the brand rather than stock art.

   Two deliberately different compositions so the page never repeats
   itself:
     · WritingDeskScene  — a cinematic desk mid-draft (laptop, coffee,
       notebook, books, plant, loose pages) for the hero.
     · PhilosophyScene   — an editorial still life (open book, pen,
       feather, rising idea orbs) for "Our philosophy".

   Gradient ids are prefixed `ink-` because SVG ids share one document
   namespace and must not collide with other inline SVG in the app.
   ───────────────────────────────────────────────────────────────────── */

// Warm-black surfaces with orange as the only light source in the scene.
const C = {
  ink: "#0B0A09",
  surface: "#171513",
  raise: "#221D18",
  edge: "#3A3029",
  muted: "#4A423A",
  faint: "rgba(255,255,255,0.09)",
  orange: "#FF6A00",
  tangerine: "#F97316",
  amber: "#FB923C",
  deep: "#C2410C",
  ember: "#7C2D12",
  cream: "#F5F1EA",
  olive: "#6F7A57",
};

// The InkWell quill/feather glyph — the same path the brand mark uses, so
// the motif is literally the logo silhouette at a larger scale.
const FeatherPath = ({ stroke, width = 3, opacity = 1, transform, scale = 1 }) => (
  <g transform={transform} opacity={opacity}>
    <g
      transform={`scale(${scale})`}
      fill="none"
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
      <line x1="16" y1="8" x2="2" y2="22" />
      <line x1="17.5" y1="15" x2="9" y2="15" />
    </g>
  </g>
);

/* ═════════════════════════════════════════════════════════════════════
   Hero — the writing desk, lit warm.
   ═════════════════════════════════════════════════════════════════════ */
export const WritingDeskScene = () => (
  <Box
    component="svg"
    viewBox="0 0 640 520"
    role="img"
    aria-label="An illustration of a warmly lit writing desk with a laptop mid-draft, a notebook, coffee, books and a plant."
    sx={{ width: "100%", height: "auto", display: "block" }}
  >
    <defs>
      <radialGradient id="ink-desk-key" cx="20%" cy="6%" r="72%">
        <stop offset="0%" stopColor={C.orange} stopOpacity="0.17" />
        <stop offset="55%" stopColor={C.deep} stopOpacity="0.06" />
        <stop offset="100%" stopColor={C.deep} stopOpacity="0" />
      </radialGradient>
      <linearGradient id="ink-desk-screen" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0%" stopColor={C.orange} stopOpacity="0.26" />
        <stop offset="60%" stopColor={C.amber} stopOpacity="0.07" />
        <stop offset="100%" stopColor={C.amber} stopOpacity="0" />
      </linearGradient>
      <linearGradient id="ink-desk-top" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2C241D" />
        <stop offset="100%" stopColor="#1A1512" />
      </linearGradient>
      <linearGradient id="ink-desk-fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={C.cream} stopOpacity="0" />
        <stop offset="100%" stopColor={C.cream} stopOpacity="0.10" />
      </linearGradient>
    </defs>

    {/* Key light spilling in from the upper left */}
    <rect x="0" y="0" width="640" height="520" fill="url(#ink-desk-key)" />

    {/* ── Out-of-focus warm bokeh — depth behind the desk ── */}
    <circle cx="92" cy="96" r="34" fill={C.orange} opacity="0.055" />
    <circle cx="150" cy="52" r="18" fill={C.amber} opacity="0.07" />
    <circle cx="560" cy="74" r="42" fill={C.deep} opacity="0.06" />
    <circle cx="612" cy="150" r="22" fill={C.orange} opacity="0.05" />

    {/* ── Floating article pages — the "content" in the air ── */}
    <g transform="rotate(-8 122 148)" opacity="0.92">
      <rect x="72" y="98" width="96" height="112" rx="12" fill={C.raise} stroke={C.faint} strokeWidth="1.5" />
      <rect x="72" y="98" width="96" height="3" rx="1.5" fill={C.orange} opacity="0.7" />
      <rect x="88" y="124" width="46" height="6" rx="3" fill={C.orange} />
      <rect x="88" y="142" width="64" height="4.5" rx="2.25" fill={C.muted} />
      <rect x="88" y="155" width="58" height="4.5" rx="2.25" fill={C.muted} />
      <rect x="88" y="168" width="66" height="4.5" rx="2.25" fill={C.muted} />
      <rect x="88" y="184" width="30" height="10" rx="5" fill={C.orange} opacity="0.22" />
    </g>

    <g transform="rotate(9 540 176)" opacity="0.85">
      <rect x="492" y="126" width="88" height="104" rx="12" fill={C.raise} stroke={C.faint} strokeWidth="1.5" />
      <rect x="508" y="148" width="40" height="6" rx="3" fill={C.amber} />
      <rect x="508" y="166" width="56" height="4.5" rx="2.25" fill={C.muted} />
      <rect x="508" y="179" width="48" height="4.5" rx="2.25" fill={C.muted} />
      <rect x="508" y="192" width="54" height="4.5" rx="2.25" fill={C.muted} />
    </g>

    {/* ── Desk plane: a lit top surface over a darker front face ── */}
    <ellipse cx="330" cy="452" rx="252" ry="20" fill="#000" opacity="0.45" />
    <rect x="52" y="384" width="536" height="10" rx="5" fill="#2B231C" />
    <rect x="52" y="392" width="536" height="18" rx="6" fill="url(#ink-desk-top)" />
    {/* orange rim-light along the front edge — the cinematic catch light */}
    <rect x="52" y="384" width="536" height="2" rx="1" fill="url(#ink-desk-fade)" />
    <rect x="104" y="410" width="15" height="66" rx="7" fill="#151110" />
    <rect x="521" y="410" width="15" height="66" rx="7" fill="#151110" />

    {/* ── Loose article pages on the desk (far left) ── */}
    <g transform="rotate(-5 108 378)">
      <rect x="70" y="352" width="74" height="42" rx="6" fill={C.cream} opacity="0.10" />
      <rect x="80" y="366" width="44" height="4" rx="2" fill={C.cream} opacity="0.16" />
      <rect x="80" y="377" width="52" height="4" rx="2" fill={C.cream} opacity="0.12" />
    </g>

    {/* ── Laptop, mid-draft. Translated down so the base meets the desk
           surface instead of hovering above it. ── */}
    <g transform="translate(0 38)">
      {/* contact shadow, cast onto the desk */}
      <ellipse cx="252" cy="354" rx="126" ry="7" fill="#000" opacity="0.38" />
      {/* screen housing */}
      <rect x="146" y="188" width="212" height="150" rx="12" fill="#0F0D0C" stroke={C.faint} strokeWidth="1.5" />
      {/* warm panel glow behind the words */}
      <rect x="158" y="200" width="188" height="126" rx="7" fill="url(#ink-desk-screen)" />
      {/* the draft */}
      <rect x="176" y="218" width="86" height="9" rx="4.5" fill={C.orange} />
      <rect x="176" y="240" width="150" height="5" rx="2.5" fill={C.cream} opacity="0.20" />
      <rect x="176" y="254" width="132" height="5" rx="2.5" fill={C.cream} opacity="0.15" />
      <rect x="176" y="268" width="144" height="5" rx="2.5" fill={C.cream} opacity="0.15" />
      <rect x="176" y="282" width="112" height="5" rx="2.5" fill={C.cream} opacity="0.15" />
      <rect x="176" y="298" width="64" height="5" rx="2.5" fill={C.cream} opacity="0.10" />
      {/* blinking caret at the end of the line */}
      <rect className="ink-caret" x="244" y="296" width="3" height="9" rx="1.5" fill={C.orange} />
      {/* base */}
      <path d="M134 338 h236 l-18 14 h-200 z" fill="#241D18" />
      <rect x="134" y="336" width="236" height="3" rx="1.5" fill={C.orange} opacity="0.22" />
      {/* screen catch light */}
      <rect x="146" y="188" width="212" height="1.5" rx="0.75" fill={C.cream} opacity="0.16" />
    </g>

    {/* ── Coffee, still warm ── */}
    <g>
      <ellipse cx="418" cy="392" rx="30" ry="5" fill="#000" opacity="0.4" />
      <path d="M396 348 h44 v34 a10 10 0 0 1 -10 10 h-24 a10 10 0 0 1 -10 -10 z" fill={C.deep} />
      <path d="M396 348 h44 v33 h-44 z" fill={C.orange} opacity="0.35" />
      <path d="M440 356 a10 10 0 1 1 0 18" stroke={C.orange} strokeWidth="5" fill="none" />
      <rect x="396" y="348" width="44" height="2.5" rx="1.25" fill={C.cream} opacity="0.22" />
      <path className="ink-steam" d="M410 340 c 3 -7 -3 -10 0 -18" stroke={C.amber} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path className="ink-steam" style={{ animationDelay: "-1.6s" }} d="M426 342 c 3 -7 -3 -10 0 -18" stroke={C.amber} strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>

    {/* ── Notebook + pen ── */}
    <g transform="rotate(7 496 364)">
      <rect x="466" y="336" width="72" height="52" rx="7" fill={C.raise} stroke={C.faint} strokeWidth="1.5" />
      <rect x="466" y="336" width="7" height="52" rx="3.5" fill={C.orange} />
      <rect x="484" y="352" width="40" height="4.5" rx="2.25" fill={C.cream} opacity="0.18" />
      <rect x="484" y="364" width="32" height="4.5" rx="2.25" fill={C.cream} opacity="0.13" />
      <rect x="484" y="376" width="36" height="4.5" rx="2.25" fill={C.cream} opacity="0.13" />
    </g>
    {/* ── Pen, resting on the desk in front of the notebook ── */}
    <g transform="rotate(-7 480 389)">
      <rect x="424" y="386" width="104" height="7" rx="3.5" fill="#33291F" stroke={C.faint} strokeWidth="1" />
      <rect x="424" y="386" width="16" height="7" rx="3.5" fill={C.orange} />
      <path d="M528 386 l16 3.5 l-16 3.5 z" fill={C.amber} />
      <rect x="446" y="387.6" width="74" height="1.8" rx="0.9" fill={C.cream} opacity="0.32" />
    </g>

    {/* ── Books stacked at the right ── */}
    <g transform="translate(0 12) rotate(-2 578 366)">
      <rect x="544" y="366" width="86" height="14" rx="4" fill={C.orange} />
      <rect x="550" y="351" width="76" height="14" rx="4" fill="#2B241E" />
      <rect x="556" y="336" width="66" height="14" rx="4" fill={C.cream} opacity="0.14" />
      <rect x="550" y="351" width="76" height="2" rx="1" fill={C.cream} opacity="0.12" />
    </g>

    {/* ── Plant, back left of the desk ── */}
    <g transform="translate(96 0)">
      <path d="M56 392 h30 l-5 -28 h-20 z" fill={C.ember} />
      <path d="M71 364 C 58 348, 58 330, 70 318 C 78 330, 78 350, 71 364 Z" fill={C.olive} />
      <path d="M71 364 C 84 350, 88 336, 83 322 C 72 332, 67 350, 71 364 Z" fill={C.olive} opacity="0.72" />
      <path d="M70 364 C 66 350, 60 342, 50 338 C 54 352, 62 361, 70 364 Z" fill={C.olive} opacity="0.55" />
    </g>

    {/* ── Feather + sparkles ── */}
    <FeatherPath transform="translate(392 118) rotate(16)" scale={2.5} stroke={C.orange} width={0.9} opacity={0.75} />
    <FeatherPath transform="translate(214 62) rotate(-22)" scale={1.5} stroke={C.amber} width={1.3} opacity={0.4} />
    <circle className="ink-pulse" cx="330" cy="120" r="3.5" fill={C.orange} />
    <circle cx="586" cy="240" r="2.5" fill={C.amber} opacity="0.5" />
    <circle cx="46" cy="252" r="2.5" fill={C.amber} opacity="0.45" />
    <path d="M336 62 l0 12 M330 68 l12 0" stroke={C.amber} strokeWidth="2.4" strokeLinecap="round" opacity="0.5" />
  </Box>
);

/* ═════════════════════════════════════════════════════════════════════
   Philosophy — an editorial still life: books, notebook, pen, pages and
   a feather, with abstract ideas rising off the page.
   ═════════════════════════════════════════════════════════════════════ */
export const PhilosophyScene = () => (
  <Box
    component="svg"
    viewBox="0 0 520 480"
    role="img"
    aria-label="An illustration of an open book with a pen and feather, and abstract idea forms rising from its pages."
    sx={{ width: "100%", height: "auto", display: "block" }}
  >
    <defs>
      <radialGradient id="ink-phil-key" cx="62%" cy="14%" r="78%">
        <stop offset="0%" stopColor={C.orange} stopOpacity="0.15" />
        <stop offset="60%" stopColor={C.deep} stopOpacity="0.05" />
        <stop offset="100%" stopColor={C.deep} stopOpacity="0" />
      </radialGradient>
      <linearGradient id="ink-phil-page" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.20" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.07" />
      </linearGradient>
      <linearGradient id="ink-phil-orb" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={C.orange} stopOpacity="0.55" />
        <stop offset="100%" stopColor={C.deep} stopOpacity="0.10" />
      </linearGradient>
    </defs>

    <rect x="0" y="0" width="520" height="480" fill="url(#ink-phil-key)" />

    {/* Abstract ideas rising off the pages — rings and orbs, nothing literal */}
    <g className="ink-drift-a">
      <circle cx="150" cy="120" r="34" fill="none" stroke={C.orange} strokeWidth="1.5" opacity="0.35" />
      <circle cx="150" cy="120" r="19" fill="url(#ink-phil-orb)" opacity="0.5" />
    </g>
    <g className="ink-drift-b">
      <circle cx="352" cy="86" r="24" fill="url(#ink-phil-orb)" opacity="0.45" />
      <circle cx="352" cy="86" r="40" fill="none" stroke={C.amber} strokeWidth="1.2" opacity="0.22" />
    </g>
    <circle cx="262" cy="52" r="9" fill={C.amber} opacity="0.35" />
    <circle cx="452" cy="176" r="6" fill={C.orange} opacity="0.3" />
    <circle cx="70" cy="228" r="5" fill={C.orange} opacity="0.25" />

    {/* Rising pages — a small fan of sheets lifting away from the book */}
    <g transform="rotate(-14 196 236)" opacity="0.85">
      <rect x="146" y="188" width="100" height="126" rx="10" fill="url(#ink-phil-page)" stroke={C.faint} strokeWidth="1.2" />
      <rect x="164" y="212" width="42" height="6" rx="3" fill={C.orange} opacity="0.8" />
      <rect x="164" y="232" width="62" height="4.5" rx="2.25" fill={C.cream} opacity="0.16" />
      <rect x="164" y="245" width="52" height="4.5" rx="2.25" fill={C.cream} opacity="0.13" />
      <rect x="164" y="258" width="58" height="4.5" rx="2.25" fill={C.cream} opacity="0.13" />
    </g>
    <g transform="rotate(11 330 250)" opacity="0.7">
      <rect x="286" y="204" width="92" height="116" rx="10" fill="url(#ink-phil-page)" stroke={C.faint} strokeWidth="1.2" />
      <rect x="302" y="228" width="36" height="6" rx="3" fill={C.amber} opacity="0.7" />
      <rect x="302" y="248" width="56" height="4.5" rx="2.25" fill={C.cream} opacity="0.14" />
      <rect x="302" y="261" width="46" height="4.5" rx="2.25" fill={C.cream} opacity="0.12" />
    </g>

    {/* ── The open book ── */}
    <g>
      <ellipse cx="262" cy="424" rx="196" ry="18" fill="#000" opacity="0.45" />
      {/* cover, showing beneath the spread */}
      <path d="M74 392 h376 v18 a10 10 0 0 1 -10 10 h-356 a10 10 0 0 1 -10 -10 z" fill={C.ember} />
      {/* left page */}
      <path d="M84 316 c 62 -18, 118 -14, 176 8 v76 c -58 -20, -114 -24, -176 -6 z" fill="#1F1A16" stroke={C.faint} strokeWidth="1.2" />
      {/* right page */}
      <path d="M436 316 c -62 -18, -118 -14, -176 8 v76 c 58 -20, 114 -24, 176 -6 z" fill="#241E19" stroke={C.faint} strokeWidth="1.2" />
      {/* spine shadow */}
      <path d="M260 324 v76" stroke="#000" strokeWidth="8" opacity="0.35" />
      {/* text on the left page */}
      <rect x="106" y="342" width="60" height="5" rx="2.5" fill={C.orange} opacity="0.85" />
      <rect x="106" y="358" width="110" height="4" rx="2" fill={C.cream} opacity="0.15" />
      <rect x="106" y="370" width="96" height="4" rx="2" fill={C.cream} opacity="0.12" />
      <rect x="106" y="382" width="104" height="4" rx="2" fill={C.cream} opacity="0.12" />
      {/* text on the right page */}
      <rect x="302" y="346" width="88" height="4" rx="2" fill={C.cream} opacity="0.15" />
      <rect x="302" y="358" width="104" height="4" rx="2" fill={C.cream} opacity="0.12" />
      <rect x="302" y="370" width="72" height="4" rx="2" fill={C.cream} opacity="0.12" />
      <rect x="302" y="384" width="44" height="5" rx="2.5" fill={C.amber} opacity="0.5" />
      {/* warm light across the spread */}
      <path d="M84 316 c 62 -18, 118 -14, 176 8 v6 c -58 -22, -114 -26, -176 -8 z" fill={C.orange} opacity="0.18" />
      <path d="M436 316 c -62 -18, -118 -14, -176 8 v6 c 58 -22, 114 -26, 176 -8 z" fill={C.orange} opacity="0.14" />
    </g>

    {/* ── Pen resting across the gutter ── */}
    <g transform="rotate(-24 300 392)">
      {/* slim dark barrel with a warm cap band and a tapered nib */}
      <rect x="250" y="389" width="92" height="7" rx="3.5" fill="#2E2721" stroke={C.faint} strokeWidth="1" />
      <rect x="250" y="389" width="16" height="7" rx="3.5" fill={C.orange} />
      <path d="M342 389 l16 3.5 l-16 3.5 z" fill={C.amber} />
      {/* catch light along the top of the barrel */}
      <rect x="272" y="390.6" width="64" height="1.6" rx="0.8" fill={C.cream} opacity="0.32" />
    </g>

    {/* ── Feather, front and centre-right ── */}
    <FeatherPath transform="translate(392 268) rotate(20)" scale={4} stroke={C.orange} width={0.6} opacity={0.9} />
    <FeatherPath transform="translate(96 106) rotate(-30)" scale={1.8} stroke={C.amber} width={1} opacity={0.35} />

    {/* A few closed books propped at the left, for editorial weight */}
    <g transform="rotate(-4 74 388)">
      <rect x="30" y="372" width="88" height="16" rx="4" fill="#2B241E" />
      <rect x="36" y="355" width="78" height="16" rx="4" fill={C.ember} />
      <rect x="42" y="338" width="68" height="16" rx="4" fill={C.cream} opacity="0.13" />
      <rect x="36" y="355" width="78" height="2" rx="1" fill={C.cream} opacity="0.10" />
    </g>
  </Box>
);
