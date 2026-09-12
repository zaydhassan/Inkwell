import React from "react";
import { Box, Container, Typography, IconButton, Link as MuiLink, Divider, Stack } from "@mui/material";
import BrandLogo from "./BrandLogo";
import useRequireAuth from "../hooks/useRequireAuth";
import XIcon from "@mui/icons-material/X";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import InstagramIcon from "@mui/icons-material/Instagram";

const socials = [
  { label: "X", href: "#", Icon: XIcon },
  { label: "GitHub", href: "#", Icon: GitHubIcon },
  { label: "LinkedIn", href: "#", Icon: LinkedInIcon },
  { label: "Instagram", href: "#", Icon: InstagramIcon },
];

const columns = [
  {
    title: "Explore",
    links: [
      { label: "Home", to: "/" },
      { label: "Blogs", to: "/blogs" },
      { label: "About", to: "/about" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
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

  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        bgcolor: "background.glass",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: (t) => `1px solid ${t.palette.divider}`,
      }}
    >
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "2fr 3fr" },
            gap: 5,
          }}
        >
          {/* Brand */}
          <Box>
            <BrandLogo size={40} showTagline />
            <Typography variant="body2" sx={{ mt: 1.5, color: "text.secondary", maxWidth: 320 }}>
              A modern home for writers and readers. Publish, engage, and earn
              your way up the leaderboard.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              {socials.map(({ label, href, Icon }) => (
                <IconButton
                  key={label}
                  aria-label={href === "#" ? `${label} (coming soon)` : label}
                  href={href === "#" ? undefined : href}
                  size="small"
                  {...(href === "#" ? {} : { component: "a", target: "_blank", rel: "noopener noreferrer" })}
                  sx={{ opacity: href === "#" ? 0.5 : 1 }}
                >
                  <Icon fontSize="small" />
                </IconButton>
              ))}
            </Stack>
          </Box>

          {/* Link columns */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" },
              gap: 3,
            }}
          >
            {columns.map((col) => (
              <Box key={col.title}>
                <Typography variant="overline" sx={{ color: "text.secondary" }}>
                  {col.title}
                </Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {col.links.map((l) => (
                    <MuiLink
                      key={l.label}
                      href={l.to}
                      onClick={(e) => { e.preventDefault(); go(l.to); }}
                      sx={{
                        color: "text.secondary",
                        textDecoration: "none",
                        fontSize: "0.875rem",
                        cursor: "pointer",
                        transition: "color .2s ease",
                        "&:hover": { color: "primary.main" },
                      }}
                    >
                      {l.label}
                    </MuiLink>
                  ))}
                </Stack>
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            © {year} Inkwell. Crafted for writers.
          </Typography>
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            Built for curious minds, everywhere.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;