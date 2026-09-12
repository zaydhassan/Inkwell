import React from "react";
import { Avatar } from "@mui/material";

// Derive up to two initials from a display name. "Zayd" → "Z",
// "Zayd Hassan" → "ZH", "one two three" → "OT". Falls back to "U" so the
// avatar is never empty (a blank circle reads as broken).
const getInitials = (name) => {
  if (!name || !String(name).trim()) return "U";
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// A single avatar that always looks right. Pass a profile image URL via `src`
// and a display name via `name`. When `src` is missing or fails to load, MUI's
// <Avatar> automatically falls back to its children — so we render the user's
// initials in a charcoal-tinted circle as the fallback. This replaces the
// old /default-avatar.png placeholder everywhere (Navbar, Profile, BlogCard,
// BlogDetails, Blogs) so avatars are never broken/missing, even offline.
const UserAvatar = ({ src, name, alt, sx, ...rest }) => (
  <Avatar
    src={src || undefined}
    alt={alt || name || "User"}
    sx={{
      // Only tint the background when there's no image to show; once the
      // image loads it covers the background anyway.
      background: src ? undefined : "linear-gradient(135deg, #44403C 0%, #1C1917 100%)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      ...sx,
    }}
    {...rest}
  >
    {getInitials(name)}
  </Avatar>
);

export default UserAvatar;