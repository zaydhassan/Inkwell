import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import axios from "axios";
import { Box, Button, InputLabel, TextField, Typography, Select, MenuItem, Stack, Skeleton } from "@mui/material";
import { History as HistoryIcon } from "@mui/icons-material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import PhotoOutlinedIcon from "@mui/icons-material/PhotoOutlined";
import toast from "react-hot-toast";
import { toastUpdated, toastScheduled } from "../utils/toasts";
import "quill/dist/quill.snow.css";
import "../styles/quill-terracotta.css";
import Quill from "quill";
import GlassCard from "../components/GlassCard";
import GradientButton from "../components/GradientButton";
import SectionHeading from "../components/SectionHeading";
import BlogRevisionsDrawer from "../components/BlogRevisionsDrawer";
import { StreakChip } from "../components/WritingStreak";
import { celebrateAchievement } from "../components/Celebration";
import { setGamification, fetchUnreadCount } from "../redux/store";
import { useAuth } from "../context/AuthContext";
import DraftRecoveryBanner from "../components/DraftRecoveryBanner";
import {
  editDraftKey,
  loadDraft,
  clearDraft,
  saveDraft,
  makeDebouncedSave,
  normalizeTags,
  isDraftEmpty,
} from "../utils/draftAutosave";

const categories = ["Technology", "Education", "Health", "Entertainment", "Food", "Business", "Social Media", "Travel", "News"];

// Convert an ISO/Date into the "YYYY-MM-DDTHH:MM" string a native
// datetime-local input expects, in the user's local timezone (so the value
// the author sees and edits matches what they mean, regardless of UTC offset).
const toLocalDatetimeInput = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const EditBlog = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useAuth();
    const [inputs, setInputs] = useState({ title: "", description: "", category: "", image: "", tags: [] });
    const [uploadedImage, setUploadedImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    // Prefilled from blog.publishAt on fetch; a future value schedules the
    // post (server auto-publishes at the chosen time). Empty = unschedule.
    const [scheduledFor, setScheduledFor] = useState("");
    // Version-history drawer open state.
    const [historyOpen, setHistoryOpen] = useState(false);
    const quillRef = useRef(null);
    const quillInstance = useRef(null);

    // ---- Draft auto-save + recovery (localStorage) ----
    // Keyed per user + per blog so each draft recovers independently. Null
    // userId/id => skip persistence.
    const userId = user?._id || localStorage.getItem("userId") || null;
    const draftKey = userId && id ? editDraftKey(userId, id) : null;
    const [recovery, setRecovery] = useState(null);
    // Only auto-save after a real edit (dirty). While the recovery banner is up
    // we hold off so a freshly loaded server version never overwrites a
    // still-unrestored local draft.
    const dirtyRef = useRef(false);
    const payloadRef = useRef(null);
    const debouncedRef = useRef(null);
    if (!debouncedRef.current) {
        debouncedRef.current = makeDebouncedSave((key) => {
            if (key && payloadRef.current && !isDraftEmpty(payloadRef.current)) {
                saveDraft(key, payloadRef.current);
            }
        });
    }

    // Initialize the Quill editor once. Keep its HTML output in sync with
    // inputs.description so the existing rich-text formatting is preserved
    // (the old code stripped all HTML into a plain TextField, destroying it).
    useEffect(() => {
        if (!quillInstance.current && quillRef.current) {
            quillInstance.current = new Quill(quillRef.current, {
                theme: "snow",
                placeholder: "Edit your blog...",
                modules: {
                    toolbar: [
                        ["bold", "italic", "underline", "strike"],
                        ["blockquote", "code-block"],
                        [{ header: 1 }, { header: 2 }],
                        [{ list: "ordered" }, { list: "bullet" }],
                        [{ size: ["small", false, "large", "huge"] }],
                        [{ header: [1, 2, 3, 4, 5, 6, false] }],
                        [{ color: [] }, { background: [] }],
                        [{ align: [] }],
                        ["clean"],
                    ],
                },
            });

            quillInstance.current.on("text-change", () => {
                setInputs((prev) => ({ ...prev, description: quillInstance.current.root.innerHTML }));
                dirtyRef.current = true;
            });
        }
    }, []);

    // Draft recovery: surface an unsaved local draft (if any) on open. We only
    // set the banner here — the actual override of server content is deferred
    // to the writer's "Restore" click, so the server version loads first and
    // the editor is never blank.
    useEffect(() => {
        if (!userId || !id) return;
        const rec = loadDraft(editDraftKey(userId, id));
        if (rec && rec.payload && !isDraftEmpty(rec.payload)) {
            setRecovery({ savedAt: rec.savedAt, ...rec.payload });
        }
    }, [userId, id]);

    useEffect(() => {
        const fetchBlogDetails = async () => {
            try {
                const response = await axios.get(`/api/v1/blog/get-blog/${id}`);
                if (response.data.success) {
                    const { title, description, category, image, tags, publishAt } = response.data.blog;
                    const tagNames = (tags || []).map((tag) => (tag.tag_name ? tag.tag_name : tag));
                    setInputs({ title, description: description || "", category, image, tags: tagNames });
                    // Prefill the schedule picker if the post is already scheduled
                    // (a future publishAt). Past/due values are left blank — the
                    // promotion sweep will publish them momentarily.
                    if (publishAt && new Date(publishAt).getTime() > Date.now()) {
                        setScheduledFor(toLocalDatetimeInput(publishAt));
                    } else {
                        setScheduledFor("");
                    }
                    dirtyRef.current = false; // server content loaded; not yet edited
                    // Load the existing HTML into Quill — no stripping.
                    if (quillInstance.current) {
                        quillInstance.current.root.innerHTML = description || "";
                    }
                } else {
                    setFetchError(true);
                }
            } catch (error) {
                setFetchError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchBlogDetails();
    }, [id, navigate]);

    // Auto-save: debounce-write the editor state, but only after a real edit
    // (dirty). Skip while the recovery banner is up so the server version
    // doesn't clobber a still-unrestored local draft.
    useEffect(() => {
        if (recovery) return;
        if (!dirtyRef.current) return;
        if (!draftKey) return;
        payloadRef.current = {
            title: inputs.title,
            description: inputs.description,
            category: inputs.category,
            image: inputs.image || "",
            tags: inputs.tags || [],
        };
        debouncedRef.current.trigger(draftKey);
    }, [draftKey, inputs, uploadedImage, recovery]);

    // Flush any pending save when leaving the page (best-effort).
    useEffect(() => {
        const handler = () => debouncedRef.current.flush(draftKey);
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [draftKey]);

    // Restore a recovered draft over the server-fetched content. Quill is
    // already initialized by the time the banner can be clicked.
    const applyRestore = () => {
        if (!recovery) return;
        setInputs({
            title: recovery.title || "",
            description: recovery.description || "",
            category: recovery.category || "",
            image: recovery.image || "",
            tags: normalizeTags(recovery.tags, "array"),
        });
        setUploadedImage(null); // File objects aren't restorable across sessions
        if (quillInstance.current) {
            quillInstance.current.root.innerHTML = recovery.description || "";
        }
        dirtyRef.current = true; // restored content is the writer's choice — keep it
        setRecovery(null);
    };

    const discardRecovery = () => {
        if (draftKey) clearDraft(draftKey);
        dirtyRef.current = false; // keep server content; don't re-save it as a draft
        setRecovery(null);
    };

    const handleChange = (e) => {
        setInputs({ ...inputs, [e.target.name]: e.target.value });
        dirtyRef.current = true;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadedImage(file);
            dirtyRef.current = true;
        }
    };

    // Save a named manual snapshot of the current editor state. Sent as JSON
    // (no file upload), so the express.json() middleware parses it — not
    // FormData. Re-throws on failure so the drawer skips the refetch.
    const handleSaveSnapshot = async (label) => {
        const { data } = await axios.post(`/api/v1/blog/${id}/revisions`, {
            title: inputs.title,
            description: inputs.description,
            category: inputs.category,
            tags: inputs.tags || [],
            label,
        });
        if (!data.success) throw new Error(data.message || "Couldn't save snapshot.");
        toast.success("Snapshot saved.");
    };

    // Load a snapshot back into the editor + Quill. This does NOT persist — the
    // writer reviews the restored content and clicks Update to keep it. Marks
    // dirty so the autosave picks the restored content up as the working draft.
    const handleRestoreRevision = (rev) => {
        setInputs({
            title: rev.title || "",
            description: rev.description || "",
            category: rev.category || "",
            image: inputs.image, // snapshots don't store images; keep the current one
            tags: Array.isArray(rev.tags) ? rev.tags : [],
        });
        if (quillInstance.current) {
            quillInstance.current.root.innerHTML = rev.description || "";
        }
        dirtyRef.current = true;
        toast.success(`Restored "${rev.label || "Snapshot"}" — click Update to keep.`);
    };

    const handleUpdate = async (scheduleAt = null) => {
        const scheduling = !!scheduleAt;
        if (scheduling) {
            const d = new Date(scheduleAt);
            if (Number.isNaN(d.getTime()) || d.getTime() <= Date.now()) {
                toast.error("Pick a future date and time to schedule.");
                return;
            }
        }
        if (!inputs.title || !inputs.description || !inputs.category) {
            toast.error("Title, description and category are required.");
            return;
        }

        const formData = new FormData();
        formData.append("title", inputs.title);
        formData.append("description", inputs.description);
        formData.append("category", inputs.category);
        formData.append("tags", JSON.stringify(inputs.tags));
        if (scheduling) formData.append("publishAt", new Date(scheduleAt).toISOString());

        if (uploadedImage) {
            formData.append("image", uploadedImage);
        } else if (inputs.image) {
            formData.append("image", inputs.image);
        }

        setIsUpdating(true);
        try {
            // Auth is attached by the axios interceptor (Bearer token); the
            // old manual `user-id` header was spoofable and is removed.
            const response = await axios.put(`/api/v1/blog/update-blog/${id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (response.data.success) {
                // Server now owns the content — drop the local safety net.
                if (draftKey) clearDraft(draftKey);
                if (scheduling) {
                    const when = new Date(scheduleAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
                    toastScheduled(when);
                } else {
                    toastUpdated();
                }
                // A Draft→Published transition awards publish points server-side;
                // sync the store + celebrate when the response carries a delta.
                // (Scheduling never awards points — the sweep does on publish.)
                if (response.data.points !== undefined) {
                    dispatch(setGamification({ points: response.data.points, level: response.data.level, badges: response.data.badges }));
                    celebrateAchievement({ leveledUp: response.data.leveledUp, newBadges: response.data.newBadges, level: response.data.level });
                    if (response.data.leveledUp || (response.data.newBadges && response.data.newBadges.length)) dispatch(fetchUnreadCount());
                }
                navigate("/my-blogs");
            } else {
                throw new Error(response.data.message || "Failed to update blog");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || (scheduling ? "Failed to schedule blog." : "Failed to update blog"));
        } finally {
            setIsUpdating(false);
        }
    };

    if (fetchError) {
        return (
            <Box sx={{ maxWidth: 760, mx: "auto", py: { xs: 4, md: 6 }, px: 2 }}>
                <GlassCard sx={{ p: 6, textAlign: "center" }}>
                    <ErrorOutlineIcon sx={{ fontSize: 44, color: "text.secondary", mb: 1 }} />
                    <Typography variant="h6" sx={{ mb: 1 }}>This story couldn't be loaded</Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                        It may have been deleted, or the connection dropped. Try again or head back to your blogs.
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
                        <Button variant="outlined" color="primary" onClick={() => window.location.reload()}>
                            Retry
                        </Button>
                        <GradientButton onClick={() => navigate("/my-blogs")}>Back to My Blogs</GradientButton>
                    </Stack>
                </GlassCard>
            </Box>
        );
    }

    if (loading) {
        return (
            <Box sx={{ maxWidth: 760, mx: "auto", py: { xs: 4, md: 6 }, px: 2 }}>
                <Skeleton variant="text" width={160} height={38} sx={{ mb: 3 }} />
                <Box sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
                    <Skeleton variant="text" width={64} sx={{ mb: 1 }} />
                    <Skeleton variant="rounded" height={56} sx={{ mb: 3, borderRadius: 2 }} />
                    <Skeleton variant="text" width={90} sx={{ mb: 1 }} />
                    <Skeleton variant="rounded" height={300} sx={{ mb: 3, borderRadius: 2 }} />
                    <Skeleton variant="text" width={80} sx={{ mb: 1 }} />
                    <Skeleton variant="rounded" height={48} sx={{ mb: 3, borderRadius: 2 }} />
                    <Skeleton variant="rounded" height={48} sx={{ width: "60%", borderRadius: 999 }} />
                </Box>
            </Box>
        );
    }

    return (
        <>
        <Box sx={{ maxWidth: 760, mx: "auto", py: { xs: 4, md: 6 }, px: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} sx={{ mb: 4 }}>
                <SectionHeading eyebrow="Writer" title="Edit Blog" align="left" sx={{ mb: 0 }} />
                <StreakChip />
            </Stack>

            {recovery && (
                <DraftRecoveryBanner
                    savedAt={recovery.savedAt}
                    onRestore={applyRestore}
                    onDiscard={discardRecovery}
                />
            )}

            <GlassCard sx={{ p: { xs: 3, md: 4 } }}>
                <InputLabel sx={{ mb: 0.5, color: "text.secondary" }}>Title</InputLabel>
                <TextField name="title" value={inputs.title} onChange={handleChange} fullWidth margin="normal" />

                <InputLabel sx={{ mt: 2, mb: 0.5, color: "text.secondary" }}>Description</InputLabel>
                <Box sx={{ mb: 2, width: "100%" }}>
                    <Box
                        ref={quillRef}
                        sx={{ height: 300, width: "100%" }}
                    />
                </Box>

                <InputLabel sx={{ mb: 0.5, color: "text.secondary" }}>Category</InputLabel>
                <Select name="category" value={inputs.category} onChange={handleChange} fullWidth margin="normal" size="small">
                    {categories.map((category) => (
                        <MenuItem key={category} value={category}>{category}</MenuItem>
                    ))}
                </Select>

                <InputLabel sx={{ mt: 2, mb: 0.5, color: "text.secondary" }}>Tags (comma-separated)</InputLabel>
                <TextField
                    name="tags"
                    value={inputs.tags.join(", ")}
                    onChange={(e) => {
                        setInputs({ ...inputs, tags: e.target.value.split(",").map((tag) => tag.trim()) });
                        dirtyRef.current = true;
                    }}
                    fullWidth
                    margin="normal"
                    size="small"
                />

                <InputLabel sx={{ mt: 2, mb: 0.5, color: "text.secondary" }}>Cover image</InputLabel>
                <Box
                    component="label"
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        p: 2,
                        border: "1px dashed",
                        borderColor: uploadedImage ? "primary.main" : "divider",
                        borderRadius: 2,
                        bgcolor: "action.hover",
                        cursor: "pointer",
                        transition: "border-color 0.2s ease",
                        "&:hover": { borderColor: "primary.light" },
                    }}
                >
                    <PhotoOutlinedIcon sx={{ color: "primary.main" }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {uploadedImage ? uploadedImage.name : "Choose a new cover image"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            Current: {inputs.image || "none"} — leaving this as-is keeps it
                        </Typography>
                    </Box>
                    <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                </Box>

                <Button
                    startIcon={<HistoryIcon />}
                    variant="text"
                    color="primary"
                    onClick={() => setHistoryOpen(true)}
                    sx={{ mt: 3, width: "100%" }}
                >
                    Version history
                </Button>

                <GradientButton onClick={() => handleUpdate()} disabled={isUpdating} sx={{ mt: 1, py: 1.25, width: "100%" }}>
                    {isUpdating ? "Updating…" : "Update Blog"}
                </GradientButton>

                {/* Schedule (or reschedule) this post. Sends publishAt with the
                    current fields; the server stores it as a Draft and the
                    promotion sweep publishes it at the chosen time. */}
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems={{ sm: "center" }}
                    sx={{ mt: 2 }}
                >
                    <TextField
                        label="Schedule for later"
                        type="datetime-local"
                        size="small"
                        value={scheduledFor}
                        onChange={(e) => { setScheduledFor(e.target.value); dirtyRef.current = true; }}
                        InputLabelProps={{ shrink: true }}
                        sx={{ flex: 1, minWidth: 200 }}
                        inputProps={{ min: new Date(Date.now() + 60000).toISOString().slice(0, 16) }}
                        helperText={scheduledFor ? "" : "Leave empty to publish immediately from My Blogs"}
                    />
                    <Button
                        variant="outlined"
                        color="secondary"
                        disabled={!scheduledFor || isUpdating}
                        onClick={() => handleUpdate(scheduledFor)}
                        sx={{ whiteSpace: "nowrap" }}
                    >
                        {isUpdating ? "Scheduling…" : "Schedule"}
                    </Button>
                </Stack>
            </GlassCard>
        </Box>

        <BlogRevisionsDrawer
            blogId={id}
            open={historyOpen}
            onClose={() => setHistoryOpen(false)}
            onSaveSnapshot={handleSaveSnapshot}
            onRestore={handleRestoreRevision}
        />
        </>
    );
};

export default EditBlog;