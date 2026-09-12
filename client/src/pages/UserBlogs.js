import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Tab,
  Tabs,
  TextField,
  Typography,
  IconButton,
  Button,
  Chip,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SkeletonBlogCard from "../components/SkeletonBlogCard";
import { motion } from "framer-motion";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PublishIcon from "@mui/icons-material/Publish";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { toastDeleted, toastPublished } from "../utils/toasts";
import GlassCard from "../components/GlassCard";
import SectionHeading from "../components/SectionHeading";

const stripHtml = (html) => {
  return html.replace(/<\/?[^>]+(>|$)/g, "");
};

const UserBlogs = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [filter, setFilter] = useState("published");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const handleTabChange = (event, newValue) => {
    setFilter(newValue);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const getUserBlogs = async () => {
    try {
      setLoading(true);
      setFetchError(false);
      const id = localStorage.getItem("userId");
      const { data } = await axios.get(`/api/v1/blog/user-blog/${id}`);
      if (data?.success) {
        setBlogs(data.userBlog.blogs);
      }
    } catch (error) {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserBlogs();
    // Tabs filter client-side — no refetch needed when the filter changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this blog permanently? This cannot be undone.");
    if (!ok) return;

    try {
      const response = await axios.delete(`/api/v1/blog/delete-blog/${id}`);
      if (response.data.success) {
        toastDeleted();
        setBlogs((prevBlogs) => prevBlogs.filter((blog) => blog._id !== id));
      } else {
        toast.error(response.data.message || "Failed to delete blog.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete blog.");
    }
  };

  const handlePublish = async (id) => {
    try {
      const { data } = await axios.put(`/api/v1/blog/update-blog/${id}`, { status: "Published" });

      if (data.success) {
        toastPublished();
        setBlogs((prevBlogs) =>
          prevBlogs.map((blog) =>
            blog._id === id ? { ...blog, status: "Published", publishAt: null } : blog
          )
        );
      } else {
        throw new Error("Failed to publish blog.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to publish blog.");
    }
  };

  const handleEdit = (blog) => {
    navigate(`/edit-blog/${blog._id}`);
  };

  // A scheduled post is a Draft with a publishAt. It's not a 4th status — the
  // promotion sweep flips it to Published at the chosen time — so we surface
  // it under its own tab and keep plain drafts separate.
  const isScheduled = (blog) => blog.status === "Draft" && blog.publishAt;

  const filteredBlogs = blogs.filter((blog) => {
    const matchesTab =
      filter === "published"
        ? blog.status === "Published"
        : filter === "scheduled"
        ? isScheduled(blog)
        : blog.status === "Draft" && !blog.publishAt; // plain drafts
    return (
      matchesTab &&
      (blog.title.toLowerCase().includes(searchTerm) ||
        stripHtml(blog.description).toLowerCase().includes(searchTerm))
    );
  });

  return (
    <Box sx={{ flexGrow: 1, minHeight: "100vh", p: { xs: 2, md: 4 } }}>
      <SectionHeading
        eyebrow="Your workspace"
        title="My Blogs"
        subtitle="Manage your published stories and drafts."
        align="left"
        sx={{ mb: 4 }}
      />

      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 3, alignItems: { sm: "center" } }}>
        <TextField
          variant="outlined"
          placeholder="Search your blogs"
          aria-label="Search your blogs"
          size="small"
          sx={{ flex: 1, maxWidth: 480 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
          onChange={handleSearchChange}
        />
        <Tabs
          value={filter}
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Published" value="published" />
          <Tab label="Drafts" value="draft" />
          <Tab label="Scheduled" value="scheduled" />
        </Tabs>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
          gap: 3,
        }}
      >
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBlogCard key={i} />
          ))
        ) : fetchError ? (
          <Box sx={{ textAlign: "center", padding: 6, gridColumn: "1 / -1" }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Couldn't load your blogs.
            </Typography>
            <Button variant="outlined" color="primary" onClick={getUserBlogs}>
              Retry
            </Button>
          </Box>
        ) : filteredBlogs.length > 0 ? (
          filteredBlogs.map((blog) => (
            <motion.div
              key={blog._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <GlassCard
                glowOnHover
                onClick={(e) => {
                  if (!e.defaultPrevented) {
                    navigate(`/blog-details/${blog._id}`);
                  }
                }}
                sx={{ cursor: "pointer", display: "flex", flexDirection: "column", height: "100%" }}
              >
                <Box
                  component="img"
                  src={blog.image || "/tech1.jpeg"}
                  alt={blog.title}
                  sx={{ width: "100%", height: 180, objectFit: "cover" }}
                />
                <Box sx={{ p: 2, display: "flex", flexDirection: "column", flexGrow: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Chip
                      size="small"
                      label={
                        blog.status === "Published"
                          ? "Published"
                          : isScheduled(blog)
                          ? `Scheduled ${moment(blog.publishAt).format("MMM Do, h:mm a")}`
                          : "Draft"
                      }
                      color={blog.status === "Published" ? "primary" : isScheduled(blog) ? "secondary" : "default"}
                      variant={blog.status === "Published" ? "filled" : "outlined"}
                    />
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {moment(blog.created_at).format("MMM Do, YYYY")}
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: "Plus Jakarta Sans, Inter, sans-serif", mb: 1 }}>
                    {blog.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, flexGrow: 1 }}>
                    {stripHtml(blog.description).length > 120
                      ? `${stripHtml(blog.description).substring(0, 120)}...`
                      : stripHtml(blog.description)}
                  </Typography>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 1, borderTop: `1px solid`, borderColor: "divider" }}>
                    <Button
                      size="small"
                      variant="text"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/blog-details/${blog._id}`);
                      }}
                    >
                      Read More
                    </Button>
                    <Box>
                      {blog.status === "Published" ? (
                        <IconButton
                          color="error"
                          size="small"
                          aria-label="Delete blog"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(blog._id);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <>
                          <IconButton
                            color="primary"
                            size="small"
                            aria-label="Edit blog"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(blog);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<PublishIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePublish(blog._id);
                            }}
                          >
                            Publish
                          </Button>
                        </>
                      )}
                    </Box>
                  </Box>
                </Box>
              </GlassCard>
            </motion.div>
          ))
        ) : (
          <Box sx={{ textAlign: "center", padding: 6, gridColumn: "1 / -1" }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {filter === "draft" ? "No drafts yet." : filter === "scheduled" ? "No scheduled posts." : "No published blogs yet."}
            </Typography>
            <Button variant="contained" color="primary" onClick={() => navigate("/create-blog")}>
              Create your first blog
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default UserBlogs;
