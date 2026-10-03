import React from "react";
import BrandLogo, { QuillGlyph } from "./BrandLogo";
// Imported from its own module rather than the ./ink barrel: the barrel also
// pulls in every ink stylesheet (story cards, stats band, still life…), and
// the footer renders on nearly every route. Loading those globally for one
// button risks an `ink-*` rule colliding with a page that isn't expecting it.
import InkButton from "./ink/InkButton";
import useRequireAuth from "../hooks/useRequireAuth";
import XIcon from "@mui/icons-material/X";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import InstagramIcon from "@mui/icons-material/Instagram";
import "./Footer.css";

/* ─────────────────────────────────────────────────────────────────────
   InkWell — Footer.

   Built from the shared InkWell tokens (see styles/inkwell.css) rather
   than the MUI theme, so it matches the Navbar's dark chrome. Both are the
   app shell: they frame every page, and on the two always-dark editorial
   pages (Home, About) a light footer would leave a visible seam.

   Behaviour is unchanged — same columns, same destinations, same
   useRequireAuth routing, same year stamp, same "coming soon" treatment for
   social destinations that don't exist yet. What changed is the hierarchy:
   a brand statement, three quiet link columns, one warm CTA, an editorial
   pull quote, and a legal row.
   ───────────────────────────────────────────────────────────────────── */

const socials = [
  { label: "X", href: "#", Icon: XIcon },
  { label: "GitHub", href: "#", Icon: GitHubIcon },
  { label: "LinkedIn", href: "#", Icon: LinkedInIcon },
  { label: "Instagram", href: "#", Icon: InstagramIcon },
];

const columns = [
  {
    id: "explore",
    title: "Explore",
    links: [
      { label: "Home", to: "/" },
      { label: "Explore", to: "/explore" },
      { label: "About", to: "/about" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    id: "account",
    title: "Account",
    links: [
      { label: "Login", to: "/login" },
      { label: "Register", to: "/register" },
      { label: "Profile", to: "/profile" },
      { label: "My Blogs", to: "/my-blogs" },
      { label: "Bookmarks", to: "/bookmarks" },
      { label: "Reading History", to: "/reading-history" },
    ],
  },
  {
    id: "writer",
    title: "Writer",
    links: [
      { label: "Create Blog", to: "/create-blog" },
      { label: "Analytics", to: "/analytics" },
      { label: "Rewards", to: "/rewards" },
      { label: "Leaderboard", to: "/leaderboard" },
    ],
  },
];

const Footer = () => {
  const year = new Date().getFullYear();
  const go = useRequireAuth();

  // Every footer destination goes through the same auth gate the rest of the
  // app uses, so an anonymous visitor hitting a protected route is bounced to
  // login rather than seeing an empty page.
  const navProps = (to) => ({
    href: to,
    onClick: (e) => {
      e.preventDefault();
      go(to);
    },
  });

  return (
    <footer className="ink-nav ink-footer">
      {/* Decorative only — a warm glow, a grid that dissolves, and an
          oversized quill watermark. All three sit behind the content. */}
      <div className="ink-foot-glow" aria-hidden="true" />
      <div className="ink-foot-grid" aria-hidden="true" />
      <div className="ink-foot-mark" aria-hidden="true">
        <QuillGlyph sx={{ width: "100%", height: "100%", color: "currentColor" }} />
      </div>

      <div className="ink-foot-inner">
        <div className="ink-foot-main">
          {/* ── Brand statement ─────────────────────────────────────── */}
          <div className="ink-foot-brand">
            <BrandLogo
              size={44}
              tone="light"
              // BrandLogo hardcodes the wordmark's accent span to the global
              // `--accent` var, which is the LIGHT theme's charcoal — invisible
              // on this dark footer. Force it to the brand orange.
              sx={{ "& span": { color: "var(--ink-orange) !important" } }}
            />
            <p className="ink-foot-eyebrow">Write • Share • Inspire</p>
            <p className="ink-foot-lead">A modern home for writers and readers.</p>
            <p className="ink-foot-sub">
              Publish, engage, and grow your voice with a community built for
              curious minds.
            </p>
          </div>

          <div className="ink-foot-social-col">
            <ul className="ink-foot-social">
              {socials.map(({ label, href, Icon }) =>
                href === "#" ? (
                  // No destination yet: stays out of the tab order as a link,
                  // announces itself as coming soon, and never fakes a URL.
                  <li key={label}>
                    <button
                      type="button"
                      className="ink-foot-social-btn is-soon"
                      aria-label={`${label} (coming soon)`}
                    >
                      <Icon sx={{ fontSize: 18 }} />
                    </button>
                  </li>
                ) : (
                  <li key={label}>
                    <a
                      className="ink-foot-social-btn"
                      href={href}
                      aria-label={label}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon sx={{ fontSize: 18 }} />
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* ── Link columns ────────────────────────────────────────── */}
          {columns.map((col) => (
            <div key={col.id} className={`ink-foot-col ink-foot-col--${col.id}`}>
              <h2 className="ink-foot-col-head" id={`ink-foot-${col.id}`}>
                {col.title}
              </h2>
              <ul className="ink-foot-list" aria-labelledby={`ink-foot-${col.id}`}>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a className="ink-foot-link" {...navProps(l.to)}>
                      {l.label}
                      <span className="ink-foot-link-arrow" aria-hidden="true">
                        →
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* ── CTA ─────────────────────────────────────────────────── */}
          <div className="ink-foot-cta">
            <h2 className="ink-foot-cta-title">Have a story to tell?</h2>
            <p className="ink-foot-cta-sub">Your ideas deserve a place to grow.</p>
            <InkButton
              as="a"
              className="ink-foot-cta-btn"
              endIcon={<span aria-hidden="true">→</span>}
              {...navProps("/create-blog")}
            >
              Start Writing
            </InkButton>
          </div>
        </div>

        {/* ── Editorial pull quote ──────────────────────────────────── */}
        <div className="ink-foot-quote">
          <blockquote className="ink-foot-quote-text">
            <span className="ink-foot-quote-mark" aria-hidden="true">
              &ldquo;
            </span>
            Good ideas deserve a place to grow.
          </blockquote>
        </div>

        {/* ── Legal row ─────────────────────────────────────────────── */}
        <div className="ink-foot-legal">
          <p>© {year} InkWell. Crafted for curious minds.</p>
          <p>Built for curious minds, everywhere.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
