import React, { lazy, Suspense } from 'react';
import { CssBaseline, ThemeProvider as MuiThemeProvider, Box, CircularProgress } from '@mui/material';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { lightTheme, darkTheme } from './theme/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary";
import CommandPalette from "./components/CommandPalette";

// Route-level code-splitting: each page is loaded on demand via React.lazy so
// the initial bundle only contains the shell (Navbar, providers, theme) + the
// page the user actually visits. Admin users never download the reader pages
// and vice-versa. Keep the shell (Navbar, Toaster, providers) eager so the
// chrome renders instantly.
const Home = lazy(() => import("./pages/Home"));
const Blogs = lazy(() => import("./pages/Blogs"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const UserBlogs = lazy(() => import("./pages/UserBlogs"));
const CreateBlog = lazy(() => import("./pages/CreateBlog"));
const BlogDetails = lazy(() => import("./pages/BlogDetails"));
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import('./pages/About'));
const Profile = lazy(() => import("./pages/Profile"));
const Rewards = lazy(() => import("./pages/Rewards"));
const EditBlog = lazy(() => import("./pages/EditBlog"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Bookmarks = lazy(() => import("./pages/Bookmarks"));
const ReadingHistory = lazy(() => import("./pages/ReadingHistory"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const AdminPanel = lazy(() => import("./admin/AdminPanel"));

const PageFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
    <CircularProgress />
  </Box>
);

function AppWrapper() {
  const { theme } = useTheme();
  const themeInstance = theme === 'dark' ? darkTheme : lightTheme;

  const user = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();
  const isAdmin = user?.role === "Admin";
  const isAdminRoute = location.pathname.startsWith("/admin");
  // The redesigned login page owns its own chrome (theme toggle + back home).
  const isImmersiveAuthRoute = location.pathname === "/login";

  return (
    <MuiThemeProvider theme={themeInstance}>
      <CssBaseline />
      <CommandPalette />
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {!isAdminRoute && !isImmersiveAuthRoute && <Navbar />}
        {/* Global toast shell — a glass card on the theme's surface. The
            unique per-event badges/icons live in utils/toasts.js. */}
        <Toaster
          position="top-center"
          gutter={10}
          toastOptions={{
            duration: 3200,
            style: {
              background: "var(--surface-glass)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: "1px solid var(--divider)",
              color: "var(--text)",
              borderRadius: "14px",
              boxShadow: "var(--shadow-card)",
              fontSize: "0.875rem",
              fontWeight: 500,
              padding: "10px 14px",
            },
          }}
        />
        <Box component="main" sx={{ flex: 1 }}>
          <Suspense fallback={<PageFallback />}>
          <ErrorBoundary>
            <Routes>
            {!isAdmin && (
                <>
                  <Route path="/" element={<Home />} />
                  <Route path="/blogs" element={<Blogs />} />
                  <Route path="/my-blogs" element={<UserBlogs />} />
                  <Route path="/blog-details/:id" element={<BlogDetails />} />
                  <Route path="/create-blog" element={<CreateBlog />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/category/:category" element={<Blogs />} />
                  <Route path="/rewards" element={<Rewards />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/bookmarks" element={<Bookmarks />} />
                  <Route path="/reading-history" element={<ReadingHistory />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/edit-blog/:id" element={<EditBlog />} />
                </>
              )}

              {isAdmin ? (
                <Route path="/admin/*" element={<AdminPanel />} />
              ) : (
                <Route path="/admin/*" element={<Navigate to="/" />} />
              )}

              <Route path="*" element={<Navigate to={isAdmin ? "/admin" : "/"} />} />
            </Routes>
          </ErrorBoundary>
          </Suspense>
        </Box>
        {!isAdminRoute && !isImmersiveAuthRoute && <Footer />}
      </Box>
    </MuiThemeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppWrapper />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
