import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  Box, Typography, IconButton, Badge, Drawer, TextField, Button,
  Divider, Menu, MenuItem, Container, Stack, Chip, Grid, Tooltip, Skeleton
} from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { Favorite, FavoriteBorder, Share, Comment, Edit, Delete, Report, Bookmark, BookmarkBorder, AccessTime, Headphones, Pause, PlayArrow, FileDownload } from "@mui/icons-material";
import toast from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useAuth } from "../context/AuthContext";
import { sanitizeHtml, readingTime } from "../utils/sanitize";
import { toastBookmarked, toastComment, toastCommentUpdated, toastCommentDeleted, toastReply, toastExport } from "../utils/toasts";
import { downloadBlogAsPdf, downloadBlogAsMarkdown } from "../utils/exportBlog";
import moment from "moment";
import GlassCard from "../components/GlassCard";
import GradientButton from "../components/GradientButton";
import UserAvatar from "../components/UserAvatar";
import FollowButton from "../components/FollowButton";
import SectionHeading from "../components/SectionHeading";
import ReadingProgress from "../components/ReadingProgress";
import TableOfContents from "../components/TableOfContents";
import BlogGrid from "../components/BlogGrid";
import BlogCard from "../components/BlogCard";
import ListenToBlogBar from "../components/ListenToBlogBar";
import useTextToSpeech from "../hooks/useTextToSpeech";
import { celebrateAchievement } from "../components/Celebration";
import { setGamification, fetchUnreadCount } from "../redux/store";
import "./BlogDetails.css";

const BlogDetails = () => {
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  // Distinguishes "fetch failed" from a normal render so a network error
  // never degrades into a blank article shell.
  const [fetchError, setFetchError] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [recommendations, setRecommendations] = useState([]);
  const [recsError, setRecsError] = useState(false);
  const [editingComment, setEditingComment] = useState({ id: null, text: "" });
  const [replyText, setReplyText] = useState({});
  const [reportedComments, setReportedComments] = useState([]);
  const [commentCount, setCommentCount] = useState(0);
  // Comments are paginated server-side (the endpoint accepts ?page=&limit=).
  // We fetch one page at a time; "Load more" requests the next page and
  // appends. commentCount is the server total so the badge is correct even
  // before every page is loaded.
  const COMMENTS_PER_PAGE = 5;
  const [commentPage, setCommentPage] = useState(1);
  const [commentHasMore, setCommentHasMore] = useState(false);
  // Ref to the article body element — shared by ReadingProgress (scroll %) and
  // TableOfContents (heading anchors + active-heading observer).
  const contentRef = useRef(null);
  const [downloadAnchor, setDownloadAnchor] = useState(null);
  // "Listen to this blog" — browser SpeechSynthesis, driven from the same
  // article body ref the reading-progress bar uses. No API key / per-call cost.
  const tts = useTextToSpeech({ contentRef });

  const fetchCommentsPage = async (page, append) => {
    try {
      const { data } = await axios.get(`/api/v1/comments/${id}?page=${page}&limit=${COMMENTS_PER_PAGE}`);
      if (data.success) {
        setComments((prev) => (append ? [...prev, ...data.comments] : data.comments));
        setCommentCount(data.commentCount ?? data.comments.length);
        setCommentPage(page);
        setCommentHasMore(Boolean(data.hasMore));
      }
    } catch (error) {
      toast.error("Couldn't load comments.");
    }
  };

  // Re-fetch every page the user has currently loaded so the local list stays
  // in sync with the server (e.g. after posting a new comment).
  const reloadLoadedComments = async () => {
    const all = [];
    let meta = null;
    for (let p = 1; p <= commentPage; p++) {
      const { data } = await axios.get(`/api/v1/comments/${id}?page=${p}&limit=${COMMENTS_PER_PAGE}`);
      if (data.success) { all.push(...data.comments); meta = data; }
    }
    setComments(all);
    if (meta) {
      setCommentCount(meta.commentCount ?? all.length);
      setCommentHasMore(Boolean(meta.hasMore));
    }
  };

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Sticky reading actions: a compact glass pill docks to the bottom of the
  // viewport once the reader scrolls past the in-article action row. Hidden
  // while the TTS player bar is mounted so the two never stack.
  const [showStickyBar, setShowStickyBar] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const el = contentRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setShowStickyBar(window.scrollY > 480 && rect.bottom > 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [blog]);

  useEffect(() => {
    const fetchBlogDetails = async () => {
      try {
        setFetchError(false);
        const response = await axios.get(`/api/v1/blog/get-blog/${id}`, {
          headers: { "Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache", "Expires": "0" },
        });
        const likeResponse = await axios.get(`/api/v1/likes/${id}`);

        if (response.data.success) {
          setBlog(response.data.blog);
        } else {
          setFetchError(true);
        }

        if (likeResponse.data.success) {
          const likes = likeResponse.data.likes;
          setLikeCount(likes.length);
          let currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");
          const userLiked = likes.some((like) => like.user_id === currentUser._id);
          setLiked(userLiked);
        } else {
          setLikeCount(0);
          setLiked(false);
        }
      } catch (error) {
        setFetchError(true);
      } finally {
        // Loading is tied to the actual fetch, not an artificial timer.
        setLoading(false);
      }
    };

    // Comments are fetched in their own paginated request (page 1).
    fetchCommentsPage(1, false);

    const fetchRecommendations = async () => {
      try {
        // Content-based related posts scored server-side by shared tags +
        // category + title-keyword overlap (see getRelatedBlogs). This is
        // genuinely "related to THIS article", not just "recent blogs".
        const { data } = await axios.get(`/api/v1/blog/related/${id}?limit=5`);
        if (data.success) {
          setRecommendations(data.related || []);
          setRecsError(false);
        } else {
          setRecsError(true);
        }
      } catch (error) {
        setRecsError(true);
      }
    };

    fetchBlogDetails();
    fetchRecommendations();

    // Seed the bookmark toggle's initial state from the user's saved ids so the
    // icon reflects "already saved" without an extra per-blog request.
    const fetchBookmarkState = async () => {
      let currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");
      if (!currentUser || !currentUser._id) return;
      try {
        const { data } = await axios.get("/api/v1/bookmarks/ids");
        if (data.success) setBookmarked((data.ids || []).includes(id));
      } catch {
        // non-critical — defaults to un-bookmarked
      }
    };
    fetchBookmarkState();
  }, [id, user]);

  const handleLike = async () => {
    try {
      let currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");
      if (!currentUser || !currentUser._id) { toast.error("User not logged in."); return; }

      const { data } = await axios.post(`/api/v1/likes/toggle`, { blog_id: id });
      if (data.success) {
        setLiked(data.liked);
        setLikeCount(data.likeCount);
        // Points are awarded atomically server-side inside the toggle endpoint,
        // so there is no separate (farmable) point call here.
        toast(data.liked ? "+5 Points! Liked the blog." : "-5 Points! Unliked the blog.", { icon: data.liked ? "👍" : "👎" });
        // Sync gamification into the store + celebrate level-ups / new badges.
        if (data.liked && data.points !== undefined) {
          dispatch(setGamification({ points: data.points, level: data.level, badges: data.badges }));
          celebrateAchievement({ leveledUp: data.leveledUp, newBadges: data.newBadges, level: data.level });
          if (data.leveledUp || (data.newBadges && data.newBadges.length)) dispatch(fetchUnreadCount());
        }
      }
      const likeResponse = await axios.get(`/api/v1/likes/${id}`);
      if (likeResponse.data.success) {
        const likes = likeResponse.data.likes;
        setLikeCount(likes.length);
        const userLiked = likes.some((like) => like.user_id === currentUser._id);
        setLiked(userLiked);
      }
    } catch (error) {
      toast.error("Error updating like");
    }
  };

  const handleShareClick = (event) => setAnchorEl(event.currentTarget);
  const handleShareClose = () => setAnchorEl(null);

  const handleBookmark = async () => {
    let currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");
    if (!currentUser || !currentUser._id) { toast.error("Log in to save articles."); return; }
    // Optimistic toggle so the icon flips instantly.
    setBookmarked((prev) => !prev);
    try {
      const { data } = await axios.post("/api/v1/bookmarks/toggle", { blog: id });
      if (data.success) {
        setBookmarked(data.bookmarked);
        toastBookmarked(data.bookmarked);
      }
    } catch {
      // Revert on failure.
      setBookmarked((prev) => !prev);
      toast.error("Couldn't update bookmark.");
    }
  };

  const handleShare = (platform) => {
    if (!blog) return;
    const shareUrl = `${window.location.origin}/blog-details/${id}`;
    const title = encodeURIComponent(blog.title);
    let url = "";
    switch (platform) {
      case "twitter": url = `https://twitter.com/intent/tweet?text=${title}&url=${shareUrl}`; break;
      case "facebook": url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`; break;
      case "linkedin": url = `https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${title}`; break;
      case "whatsapp": url = `https://wa.me/?text=${title} - ${shareUrl}`; break;
      default: return;
    }
    window.open(url, "_blank");
    handleShareClose();
  };

  const handleComment = async () => {
    if (!newComment.trim()) { toast.error("Please write a comment before posting."); return; }
    let currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");
    if (!currentUser || !currentUser._id || !currentUser.role) { toast.error("User data not available."); return; }
    if (!["Reader", "Writer"].includes(currentUser.role)) { toast.error("Only Readers and Writers can leave comments."); return; }
    try {
      const response = await axios.post(`/api/v1/comments`, {
        content: newComment.trim(), blog_id: id, user_id: currentUser._id, role: currentUser.role
      });
      if (response.status === 201) {
        toastComment();
        setNewComment("");
        // The server returns the commenter's gamification delta — sync it and
        // celebrate any level-up / new badge earned by commenting.
        if (response.data && response.data.points !== undefined) {
          dispatch(setGamification({ points: response.data.points, level: response.data.level, badges: response.data.badges }));
          celebrateAchievement({ leveledUp: response.data.leveledUp, newBadges: response.data.newBadges, level: response.data.level });
          if (response.data.leveledUp || (response.data.newBadges && response.data.newBadges.length)) dispatch(fetchUnreadCount());
        }
        // Re-sync the loaded pages with the server. Under oldest-first ordering
        // the new comment lives on a later page, so it appears once the user
        // loads more — consistent with the existing threading.
        await reloadLoadedComments();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding comment");
    }
  };

  const toggleComments = () => setCommentsOpen((prev) => !prev);

  const handleEdit = (commentId) => {
    const commentToEdit = comments.find((c) => c._id === commentId);
    if (commentToEdit) setEditingComment({ id: commentToEdit._id, text: commentToEdit.content });
  };

  const handleEditSave = async (commentId, updatedText) => {
    if (!updatedText.trim()) { toast.error("Comment cannot be empty."); return; }
    try {
      const response = await axios.put(`/api/v1/comments/${commentId}`, { content: updatedText });
      if (response.status === 200) {
        setComments(comments.map((c) => (c._id === commentId ? { ...c, content: updatedText } : c)));
        toastCommentUpdated();
        setEditingComment({ id: null, text: "" });
      }
    } catch (error) {
      toast.error("Failed to update comment.");
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await axios.delete(`/api/v1/comments/${commentId}`);
      setComments(comments.filter((c) => c._id !== commentId));
      setCommentCount((c) => Math.max(0, c - 1));
      toastCommentDeleted();
    } catch (error) {
      toast.error("Failed to delete comment.");
    }
  };

  const handleReport = async (commentId, commentUserId) => {
    if (!commentId || user?._id === commentUserId) { toast.error("You cannot report your own comment."); return; }
    try {
      await axios.post(`/api/v1/comments/report`, { commentId, userId: user._id });
      setReportedComments([...reportedComments, commentId]);
      toast.success("Comment reported successfully!");
    } catch (error) {
      toast.error("Error reporting comment.");
    }
  };

  const handleReply = async (commentId, replyContent) => {
    if (!replyContent.trim()) return toast.error("Reply cannot be empty.");
    try {
      let currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");
      if (!currentUser || !currentUser._id) { toast.error("User not logged in."); return; }
      const { data } = await axios.post(`/api/v1/comments/reply`, {
        parentId: commentId, content: replyContent.trim(), user_id: currentUser._id,
      });
      setComments((prev) => prev.map((c) => (c._id === commentId ? { ...c, replies: [...(c.replies || []), data.reply] } : c)));
      toastReply();
      setReplyText((prev) => ({ ...prev, [commentId]: "" }));
    } catch (error) {
      toast.error("Failed to add reply.");
    }
  };

  // Skeleton mirrors the real article layout (cover, meta, title, body).
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Skeleton variant="rounded" height={{ xs: 260, md: 420 }} sx={{ borderRadius: 4, mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Skeleton variant="circular" width={44} height={44} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width={140} />
                  <Skeleton variant="text" width={100} />
                </Box>
              </Stack>
              <Skeleton variant="text" width="85%" height={44} />
              <Skeleton variant="text" width="60%" height={44} />
              <Skeleton variant="rounded" height={20} width="100%" sx={{ mt: 3 }} />
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} variant="text" width={`${92 - (i % 3) * 12}%`} />
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rounded" height={220} sx={{ borderRadius: 4 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  // Fetch failed: a styled full-page error (never a blank article shell).
  if (fetchError || !blog) {
    return (
      <Container maxWidth="sm" sx={{ py: 12, textAlign: "center" }}>
        <ErrorOutlineIcon sx={{ fontSize: 56, color: "text.disabled", mb: 2 }} />
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          This story couldn't be loaded
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 4 }}>
          The article may have been removed, or something went wrong on our end.
          Check your connection and try again.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <GradientButton onClick={() => window.location.reload()}>Retry</GradientButton>
          <Button variant="outlined" onClick={() => navigate("/blogs")}>Browse all stories</Button>
        </Stack>
      </Container>
    );
  }

  return (
    <>
    <ReadingProgress contentRef={contentRef} />
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      {/* Cover */}
      <Box
        sx={{
          width: "100%",
          height: { xs: 260, md: 420 },
          backgroundImage: `url(${blog?.image || "/tech1.jpeg"})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: 4,
          mb: 3,
          boxShadow: (t) => t.customShadows?.card,
        }}
      />

      <Grid container spacing={3} alignItems="flex-start">
        {/* Article */}
        <Grid item xs={12} md={8}>
      <GlassCard sx={{ p: { xs: 3, md: 5 } }}>
        {/* Meta row */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <UserAvatar src={blog?.user?.profile_image} name={blog?.user?.username} sx={{ border: (t) => `2px solid ${t.palette.primary.main}` }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{blog?.user?.username || "Unknown Author"}</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>{moment(blog?.created_at).format("MMMM DD, YYYY")}</Typography>
              <Box sx={{ mt: 0.75 }}>
                <FollowButton userId={blog?.user?._id} />
              </Box>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip icon={<AccessTime />} label={`${readingTime(blog?.description)} min read`} variant="outlined" size="small" />
            {blog?.category && <Chip label={blog.category} color="primary" variant="filled" />}
          </Stack>
        </Stack>

        <Typography variant="h3" sx={{ mb: 3 }}>{blog?.title}</Typography>

        {/* Actions */}
        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
          <IconButton onClick={handleLike} aria-label={liked ? "Unlike" : "Like"}>
            <Badge badgeContent={likeCount} color="primary">{liked ? <Favorite color="error" /> : <FavoriteBorder />}</Badge>
          </IconButton>
          <IconButton onClick={toggleComments} aria-label="Comments">
            <Badge badgeContent={commentCount} color="primary"><Comment /></Badge>
          </IconButton>
          <IconButton onClick={handleShareClick} aria-label="Share"><Share /></IconButton>
          {tts.supported && (
            <Tooltip title={tts.speaking && !tts.paused ? "Pause narration" : tts.paused ? "Resume narration" : "Listen to this blog"}>
              <IconButton
                onClick={tts.toggle}
                color={tts.speaking || tts.paused ? "primary" : "default"}
                aria-label={tts.speaking && !tts.paused ? "Pause narration" : "Listen to this blog"}
              >
                {tts.speaking && !tts.paused ? <Pause /> : tts.paused ? <PlayArrow /> : <Headphones />}
              </IconButton>
            </Tooltip>
          )}
          {user && (
            <IconButton onClick={handleBookmark} aria-label={bookmarked ? "Remove bookmark" : "Save bookmark"}>
              {bookmarked ? <Bookmark color="primary" /> : <BookmarkBorder />}
            </IconButton>
          )}
          <Tooltip title="Download">
            <IconButton onClick={(e) => setDownloadAnchor(e.currentTarget)} aria-label="Download">
              <FileDownload />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={downloadAnchor}
            open={Boolean(downloadAnchor)}
            onClose={() => setDownloadAnchor(null)}
          >
            <MenuItem
              onClick={async () => {
                setDownloadAnchor(null);
                try {
                  await downloadBlogAsPdf(contentRef.current, blog);
                  toastExport("PDF");
                } catch (err) {
                  toast.error(err?.message || "Couldn't export PDF.");
                }
              }}
            >
              Download as PDF
            </MenuItem>
            <MenuItem
              onClick={async () => {
                setDownloadAnchor(null);
                try {
                  await downloadBlogAsMarkdown(blog);
                  toastExport("Markdown");
                } catch (err) {
                  toast.error(err?.message || "Couldn't export Markdown.");
                }
              }}
            >
              Download as Markdown
            </MenuItem>
          </Menu>
          <Menu anchorEl={anchorEl} open={open} onClose={handleShareClose}>
            <MenuItem onClick={() => handleShare("twitter")}>Share on Twitter</MenuItem>
            <MenuItem onClick={() => handleShare("facebook")}>Share on Facebook</MenuItem>
            <MenuItem onClick={() => handleShare("linkedin")}>Share on LinkedIn</MenuItem>
            <MenuItem onClick={() => handleShare("whatsapp")}>Share on WhatsApp</MenuItem>
          </Menu>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {/* Article body — scoped prose styles in BlogDetails.css. The ref is
            shared with ReadingProgress + TableOfContents. */}
        <Box
          ref={contentRef}
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(blog?.description) }}
        />
      </GlassCard>
        </Grid>

        {/* Table of contents sidebar (desktop) / popover trigger (mobile) */}
        <Grid item xs={12} md={4}>
          <TableOfContents contentRef={contentRef} ready={!!blog} />
        </Grid>
      </Grid>

      {/* Recommendations */}
      {(recommendations.length > 0 || recsError) && (
        <Box sx={{ mt: 6 }}>
          <SectionHeading eyebrow="Keep reading" title="Related reads" badge />
          {recsError ? (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>Couldn’t load recommendations.</Typography>
          ) : (
            <BlogGrid sx={{ mt: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" } }}>
              {recommendations.map((rec) => (
                <BlogCard
                  key={rec._id}
                  id={rec._id}
                  title={rec.title}
                  description={rec.description}
                  image={rec.image}
                  username={rec.user?.username || "Unknown"}
                  time={moment(rec.created_at).format("MMM DD, YYYY")}
                  profileImage={rec.user?.profile_image}
                  tags={Array.isArray(rec.tags) ? rec.tags.map((t) => t?.tag_name?.trim()).filter(Boolean) : []}
                />
              ))}
            </BlogGrid>
          )}
        </Box>
      )}

      {/* Comments drawer */}
      <Drawer anchor="right" open={commentsOpen} onClose={toggleComments} PaperProps={{ sx: { width: { xs: "100%", sm: 420 } } }}>
        <Box sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Comments</Typography>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", flex: 1 }}>
            {comments.length > 0 ? (
              <>
                {comments.map((comment, index) => (
                  <GlassCard key={index} sx={{ p: 2 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <UserAvatar src={comment?.user_id?.profile_image} name={comment?.user_id?.username} />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{comment?.user_id?.username || "Unknown User"}</Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {comment?.date && moment(comment.date).isValid() ? moment(comment.date).format("MMM DD, YYYY") : ""}
                          </Typography>
                        </Box>
                      </Stack>
                      <Box>
                        {user && comment?.user_id?._id && String(user?._id) === String(comment?.user_id?._id) ? (
                          <>
                            <IconButton onClick={() => handleEdit(comment._id)} aria-label="Edit comment" size="small"><Edit fontSize="small" /></IconButton>
                            <IconButton onClick={() => handleDelete(comment._id)} aria-label="Delete comment" size="small"><Delete fontSize="small" color="error" /></IconButton>
                          </>
                        ) : (
                          <IconButton onClick={() => handleReport(comment._id, comment.user_id._id)} disabled={reportedComments.includes(comment._id)} aria-label="Report comment" size="small">
                            <Report fontSize="small" color={reportedComments.includes(comment._id) ? "disabled" : "action"} />
                          </IconButton>
                        )}
                      </Box>
                    </Stack>

                    {editingComment?.id === comment._id ? (
                      <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 1.5 }}>
                        <TextField fullWidth size="small" value={editingComment.text}
                          onChange={(e) => setEditingComment((prev) => ({ ...prev, text: e.target.value }))} />
                        <Button variant="contained" size="small" onClick={() => handleEditSave(comment._id, editingComment.text)}>Save</Button>
                      </Stack>
                    ) : (
                      <Typography variant="body2" sx={{ mt: 1, color: "text.primary" }}>{comment.content || comment.text || "No content available"}</Typography>
                    )}

                    {comment.replies?.map((reply, idx) => (
                      <Box key={idx} sx={{ ml: 4, mt: 1.5, p: 1.5, borderRadius: 2, backgroundColor: "action.hover" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{reply?.user?.username || "Anonymous"}</Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>{reply?.content || "No content available"}</Typography>
                      </Box>
                    ))}

                    {user && comment.user_id && String(user._id) !== String(comment.user_id._id) && (
                      <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 1.5 }}>
                        <TextField fullWidth size="small" placeholder="Write a reply…" value={replyText[comment._id] || ""}
                          onChange={(e) => setReplyText((prev) => ({ ...prev, [comment._id]: e.target.value }))} />
                        <Button variant="outlined" size="small" onClick={() => handleReply(comment._id, replyText[comment._id])}>Reply</Button>
                      </Stack>
                    )}
                  </GlassCard>
                ))}
                {commentHasMore && (
                  <Button fullWidth variant="text" onClick={() => fetchCommentsPage(commentPage + 1, true)}>Load more comments</Button>
                )}
              </>
            ) : (
              <Typography sx={{ color: "text.secondary" }}>No comments yet. Be the first to comment.</Typography>
            )}
          </Box>

          <Stack direction="row" alignItems="center" gap={1.5} sx={{ mt: 2 }}>
            <TextField fullWidth label="Leave a comment" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
            <GradientButton onClick={handleComment} sx={{ height: 56, px: 3 }}>Post</GradientButton>
          </Stack>
        </Box>
      </Drawer>
    </Container>

      {/* Sticky reading actions — appears once the reader scrolls into the
          article body; reuses the same handlers as the in-article row. */}
      <AnimatePresence>
        {showStickyBar && !(tts.supported && (tts.speaking || tts.paused)) && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed",
              left: "50%",
              transform: "translateX(-50%)",
              bottom: 20,
              zIndex: 1100,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                px: 1.5,
                py: 0.75,
                borderRadius: 999,
                bgcolor: "background.glass",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                border: (t) => `1px solid ${t.palette.divider}`,
                boxShadow: (t) => t.customShadows?.glass,
              }}
              role="toolbar"
              aria-label="Article actions"
            >
              <IconButton onClick={handleLike} aria-label={liked ? "Unlike" : "Like"} size="small">
                <Badge badgeContent={likeCount} color="primary">
                  {liked ? <Favorite color="error" fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                </Badge>
              </IconButton>
              <IconButton onClick={toggleComments} aria-label="Comments" size="small">
                <Badge badgeContent={commentCount} color="primary">
                  <Comment fontSize="small" />
                </Badge>
              </IconButton>
              {user && (
                <IconButton onClick={handleBookmark} aria-label={bookmarked ? "Remove bookmark" : "Save bookmark"} size="small">
                  {bookmarked ? <Bookmark color="primary" fontSize="small" /> : <BookmarkBorder fontSize="small" />}
                </IconButton>
              )}
              <IconButton onClick={handleShareClick} aria-label="Share" size="small">
                <Share fontSize="small" />
              </IconButton>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text-to-speech player bar — only mounts while a session is active so
          it never shows on a fresh page load. */}
      {tts.supported && (tts.speaking || tts.paused) && (
        <ListenToBlogBar
          contentRef={contentRef}
          title={blog?.title}
          speaking={tts.speaking}
          paused={tts.paused}
          rate={tts.rate}
          setRate={tts.setRate}
          currentChunk={tts.currentChunk}
          totalChunks={tts.totalChunks}
          currentText={tts.currentText}
          onToggle={tts.toggle}
          onStop={tts.stop}
          onNext={tts.next}
          onPrev={tts.prev}
        />
      )}
    </>
  );
};

export default BlogDetails;
