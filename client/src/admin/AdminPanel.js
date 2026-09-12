import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Pie, Bar } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "@mui/material/styles";
import {
  Box, Typography, Button, CircularProgress, Drawer, List, ListItem, ListItemButton,
  ListItemText, ListItemIcon, Divider, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Stack, Grid, IconButton,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LogoutIcon from "@mui/icons-material/Logout";
import PeopleIcon from "@mui/icons-material/People";
import CommentIcon from "@mui/icons-material/Comment";
import ArticleIcon from "@mui/icons-material/Article";
import GlassCard from "../components/GlassCard";
import SectionHeading from "../components/SectionHeading";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const drawerWidth = 260;

const AdminPanel = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const theme = useTheme();
  const [users, setUsers] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // Cap the number of rows rendered per table so a large dataset can't hang
  // the DOM. The full arrays are still used for the chart aggregations above;
  // only the table bodies are sliced. A note is shown when rows are truncated.
  const MAX_TABLE_ROWS = 100;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(false);
      const [usersRes, blogsRes, commentsRes] = await Promise.all([
        axios.get("/api/v1/admin/users"),
        axios.get("/api/v1/admin/blogs"),
        axios.get("/api/v1/admin/comments")
      ]);

      setUsers(usersRes.data.users || []);
      setBlogs(blogsRes.data.blogs || []);
      setComments(commentsRes.data.comments || []); // Set fetched comments
    } catch (error) {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteComment = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This comment will be deleted permanently!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: theme.palette.error.main,
      confirmButtonText: "Delete",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/v1/admin/comments/${id}`);
        setComments(comments.filter((comment) => comment._id !== id));
        Swal.fire("Deleted!", "The comment has been removed.", "success");
      } catch (error) {
        Swal.fire("Error", "Failed to delete the comment", "error");
      }
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Logout",
      confirmButtonColor: theme.palette.error.main,
    }).then(async (result) => {
      if (result.isConfirmed) {
        // Unified logout: signs out of Firebase, clears the server refresh
        // cookie, and drops local auth state — then route via the SPA router
        // instead of a full-page reload.
        await logout();
        navigate("/login");
      }
    });
  };

  const handleDeleteBlog = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This blog will be deleted permanently!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: theme.palette.error.main,
      confirmButtonText: "Delete",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/v1/blog/delete-blog/${id}`);
        setBlogs(blogs.filter((blog) => blog._id !== id));
        Swal.fire("Deleted!", "The blog has been removed.", "success");
      } catch (error) {
        Swal.fire("Error", "Failed to delete the blog", "error");
      }
    }
  };

  const handleBanUser = async (id) => {
    const result = await Swal.fire({
      title: "Ban User?",
      text: "This user will be banned from the platform!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: theme.palette.error.main,
      confirmButtonText: "Ban",
    });

    if (result.isConfirmed) {
      try {
        await axios.put(`/api/v1/admin/ban-user/${id}`);
        setUsers(users.filter((user) => user._id !== id));
        Swal.fire("User Banned!", "The user is now banned.", "success");
      } catch (error) {
        Swal.fire("Error", "Failed to ban the user", "error");
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (fetchError) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100vh", gap: 2 }}>
        <Typography variant="h6">Couldn't load admin data.</Typography>
        <Button variant="contained" color="primary" onClick={fetchData}>Retry</Button>
      </Box>
    );
  }

  // Reusable "no rows" row for an empty table.
  const EmptyRow = ({ label, colSpan }) => (
    <TableRow>
      <TableCell colSpan={colSpan} align="center" sx={{ py: 4, color: "text.secondary" }}>
        {label}
      </TableCell>
    </TableRow>
  );

  // Shown beneath a table when more rows exist than we render.
  const TruncationNote = ({ total }) => (
    <Typography variant="caption" sx={{ color: "text.secondary", mt: 1, display: "block", px: 1 }}>
      Showing first {MAX_TABLE_ROWS} of {total}. Refine by deleting older entries to view more.
    </Typography>
  );

  const navItem = (label, icon) => (
    <ListItem disablePadding>
      <ListItemButton sx={{ borderRadius: 2, "&:hover": { bgcolor: "brandSoft" } }}>
        <ListItemIcon sx={{ color: "primary.main", minWidth: 36 }}>{icon}</ListItemIcon>
        <ListItemText primary={label} primaryTypographyProps={{ fontWeight: 500 }} />
      </ListItemButton>
    </ListItem>
  );

  const statTile = (label, value, icon) => (
    <GlassCard sx={{ p: 3 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: 2, bgcolor: "brandSoft", color: "primary.main" }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: "Plus Jakarta Sans, Inter, sans-serif", lineHeight: 1 }}>
            {value}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>{label}</Typography>
        </Box>
      </Stack>
    </GlassCard>
  );

  // Theme-derived chart options so ticks/legend flip with the active mode.
  const gridColor = theme.palette.divider;
  const textColor = theme.palette.text.secondary;
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: textColor } },
    },
    scales: {
      x: { ticks: { color: textColor }, grid: { color: gridColor } },
      y: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true },
    },
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <Box
        component="nav"
        sx={{
          width: { xs: "100%", md: drawerWidth },
          flexShrink: { md: 0 },
          borderRight: { md: `1px solid` },
          borderColor: { md: "divider" },
          bgcolor: "background.paper",
          position: { md: "sticky" },
          top: 0,
          height: { md: "100vh" },
          p: 2,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3, px: 1 }}>
          <DashboardIcon sx={{ color: "primary.main" }} />
          <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: "Plus Jakarta Sans, Inter, sans-serif" }}>
            Admin
          </Typography>
        </Box>
        <List>
          {navItem("Users", <PeopleIcon fontSize="small" />)}
          {navItem("Blogs", <ArticleIcon fontSize="small" />)}
          {navItem("Comments", <CommentIcon fontSize="small" />)}
        </List>
        <Box sx={{ mt: "auto" }}>
          <Divider sx={{ mb: 1 }} />
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, color: "error.main", "&:hover": { bgcolor: "action.hover" } }}>
              <ListItemIcon sx={{ color: "error.main", minWidth: 36 }}><LogoutIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
        </Box>
      </Box>

      {/* Main */}
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, minWidth: 0 }}>
        <SectionHeading eyebrow="Overview" title="Admin Panel" align="left" sx={{ mb: 4 }} />

        {/* Stat tiles */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>{statTile("Total Users", users.length, <PeopleIcon />)}</Grid>
          <Grid item xs={12} sm={4}>{statTile("Total Blogs", blogs.length, <ArticleIcon />)}</Grid>
          <Grid item xs={12} sm={4}>{statTile("Total Comments", comments.length, <CommentIcon />)}</Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <GlassCard sx={{ p: 3, height: 360 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>User Roles</Typography>
              <Box sx={{ height: 280 }}>
                <Pie
                  data={{
                    labels: ["Reader", "Writer", "Admin"],
                    datasets: [
                      {
                        data: [
                          users.filter((u) => u.role === "Reader").length,
                          users.filter((u) => u.role === "Writer").length,
                          users.filter((u) => u.role === "Admin").length,
                        ],
                        backgroundColor: ["#111111", "#52525B", "#A3A3A3"],
                        borderColor: theme.palette.background.paper,
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{ ...chartOptions, scales: undefined }}
                />
              </Box>
            </GlassCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <GlassCard sx={{ p: 3, height: 360 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Blog Categories</Typography>
              <Box sx={{ height: 280 }}>
                <Bar
                  data={{
                    labels: [...new Set(blogs.map((blog) => blog.category))],
                    datasets: [
                      {
                        label: "Number of Blogs",
                        data: [...new Set(blogs.map((blog) => blog.category))].map(
                          (cat) => blogs.filter((b) => b.category === cat).length
                        ),
                        backgroundColor: "#111111",
                        borderRadius: 6,
                      },
                    ],
                  }}
                  options={chartOptions}
                />
              </Box>
            </GlassCard>
          </Grid>
        </Grid>

        {/* Users Table */}
        <GlassCard sx={{ p: 0, mb: 4, overflow: "hidden" }}>
          <Box sx={{ p: 2, borderBottom: `1px solid`, borderColor: "divider" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Manage Users</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "brandSoft" }}>
                  <TableCell sx={{ fontWeight: 700 }}>Username</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <EmptyRow label="No users yet." colSpan={4} />
                ) : (
                  users.slice(0, MAX_TABLE_ROWS).map((user) => (
                    <TableRow key={user._id} hover>
                      <TableCell>{user.username}</TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>{user.email}</TableCell>
                      <TableCell><Chip label={user.role} size="small" color={user.role === "Admin" ? "secondary" : "default"} variant="outlined" /></TableCell>
                      <TableCell align="right">
                        <Button size="small" color="error" variant="outlined" onClick={() => handleBanUser(user._id)}>Ban</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {users.length > MAX_TABLE_ROWS && <TruncationNote total={users.length} />}
        </GlassCard>

        {/* Comments Table */}
        <GlassCard sx={{ p: 0, mb: 4, overflow: "hidden" }}>
          <Box sx={{ p: 2, borderBottom: `1px solid`, borderColor: "divider" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Manage Comments</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "brandSoft" }}>
                  <TableCell sx={{ fontWeight: 700 }}>Comment ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Comment Text</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comments.length === 0 ? (
                  <EmptyRow label="No comments yet." colSpan={4} />
                ) : (
                  comments.slice(0, MAX_TABLE_ROWS).map((comment) => (
                    <TableRow key={comment._id} hover>
                      <TableCell sx={{ color: "text.secondary", fontFamily: "monospace", fontSize: "0.75rem" }}>{comment._id}</TableCell>
                      <TableCell sx={{ maxWidth: 360 }}>{comment.content}</TableCell>
                      <TableCell>{comment.user_id ? comment.user_id.username : "No User"}</TableCell>
                      <TableCell align="right">
                        <Button size="small" color="error" variant="outlined" onClick={() => handleDeleteComment(comment._id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {comments.length > MAX_TABLE_ROWS && <TruncationNote total={comments.length} />}
        </GlassCard>

        {/* Blogs Table */}
        <GlassCard sx={{ p: 0, overflow: "hidden" }}>
          <Box sx={{ p: 2, borderBottom: `1px solid`, borderColor: "divider" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Manage Blogs</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "brandSoft" }}>
                  <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {blogs.length === 0 ? (
                  <EmptyRow label="No blogs yet." colSpan={3} />
                ) : (
                  blogs.slice(0, MAX_TABLE_ROWS).map((blog) => (
                    <TableRow key={blog._id} hover>
                      <TableCell>{blog.title}</TableCell>
                      <TableCell>
                        <Chip label={blog.status} size="small" color={blog.status === "Published" ? "primary" : "default"} variant={blog.status === "Published" ? "filled" : "outlined"} />
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" color="error" variant="outlined" onClick={() => handleDeleteBlog(blog._id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {blogs.length > MAX_TABLE_ROWS && <TruncationNote total={blogs.length} />}
        </GlassCard>
      </Box>
    </Box>
  );
};

export default AdminPanel;