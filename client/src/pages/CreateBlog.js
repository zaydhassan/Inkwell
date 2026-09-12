import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Box, Button, TextField, Typography, IconButton, Stack, Grid, Chip, Divider } from "@mui/material";
import toast from "react-hot-toast";
import 'quill/dist/quill.snow.css';
import '../styles/quill-terracotta.css';
import Quill from 'quill';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CategoryIcon from '@mui/icons-material/Category';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LinkIcon from '@mui/icons-material/Link';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { validateMinLength, validateRequired } from "../utils/validate";
import { toastPublished, toastDraft, toastScheduled } from "../utils/toasts";
import GlassCard from "../components/GlassCard";
import UserAvatar from "../components/UserAvatar";
import GradientButton from "../components/GradientButton";
import SectionHeading from "../components/SectionHeading";
import DraftRecoveryBanner from "../components/DraftRecoveryBanner";
import { StreakChip } from "../components/WritingStreak";
import { celebrateAchievement } from "../components/Celebration";
import { setGamification, fetchUnreadCount } from "../redux/store";
import {
  newDraftKey,
  loadDraft,
  clearDraft,
  saveDraft,
  makeDebouncedSave,
  normalizeTags,
  isDraftEmpty,
} from "../utils/draftAutosave";

const categories = ['Technology', 'Education', 'Health', 'Entertainment', 'Food', 'Business', 'Social Media', 'Travel', 'News'];

// Quill stores content as HTML; an "empty" editor still holds tags like
// <p><br></p>, so strip tags to tell whether the user actually wrote anything.
const stripHtml = (html) => (html || '').replace(/<\/?[^>]+(>|$)/g, '').trim();

const CreateBlog = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // Read auth from context (single source of truth) instead of localStorage.
  // The server identifies the author from the JWT (req.user._id), so we no
  // longer append a spoofable "user" field or send the legacy "user-id" header.
  const { user } = useAuth();
  const userRole = user?.role;
  const [inputs, setInputs] = useState({ title: "", description: "", image: "", category: "" });
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [useImageUrl, setUseImageUrl] = useState(true);
  // Which action is in flight (null | 'Published' | 'Draft') so both buttons
  // disable during a submit and the active one shows a loading label.
  const [submittingStatus, setSubmittingStatus] = useState(null);
  const [errors, setErrors] = useState({});
  // "Schedule for later": a future datetime that submits the post as a Draft
  // the server auto-publishes at the chosen time (see promoteScheduledBlogs).
  const [scheduledFor, setScheduledFor] = useState("");
  const quillRef = useRef(null);
  const quillInstance = useRef(null);

  // ---- Draft auto-save + recovery (localStorage) ----
  // Keyed per user so a shared machine never cross-contaminates drafts.
  // Null userId => skip persistence entirely (no anonymous keys).
  const userId = user?._id || localStorage.getItem("userId") || null;
  const draftKey = userId ? newDraftKey(userId) : null;
  // recovery holds a loaded local draft ({ savedAt, ...payload }) shown via the
  // banner; null when nothing to recover or after Restore/Discard.
  const [recovery, setRecovery] = useState(null);
  const didMountRef = useRef(false);
  const payloadRef = useRef(null);
  // Autosave indicator state: "idle" → "saving" (change detected, debounce
  // pending) → "saved" (localStorage write done). Drives the byline chip.
  const [saveState, setSaveState] = useState("idle");
  // Stable debounced save instance (created once, reads payloadRef.current).
  const debouncedRef = useRef(null);
  if (!debouncedRef.current) {
    debouncedRef.current = makeDebouncedSave((key) => {
      if (key && payloadRef.current && !isDraftEmpty(payloadRef.current)) {
        saveDraft(key, payloadRef.current);
        setSaveState("saved");
      }
    });
  }

  const location = useLocation();
  const editingBlog = location.state?.blog || null;

  useEffect(() => {
      if (editingBlog) {
          setInputs({
              title: editingBlog.title || "",
              description: editingBlog.description || "",
              image: editingBlog.image || "",
              category: editingBlog.category || "",
              tags: editingBlog.tags ? editingBlog.tags.join(", ") : "",
          });

          if (quillInstance.current) {
              quillInstance.current.root.innerHTML = editingBlog.description || "";
          }
      }
  }, [editingBlog]);

  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  useEffect(() => {
    if (quillInstance.current && transcript) {
      quillInstance.current.root.innerHTML += ` ${transcript}`;
      setInputs((prev) => ({ ...prev, description: quillInstance.current.root.innerHTML }));
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  useEffect(() => {
    // Wait for auth state to resolve before gating. Non-writers are bounced;
    // an unauthenticated user (user stays null) is left to the server, which
    // rejects the create call and the interceptor redirects to login.
    if (!user) return;
    if (userRole !== 'Writer') {
      toast.error('Only Writers can create blogs');
      navigate('/');
    }
  }, [navigate, user, userRole]);

  // Draft recovery: on open, surface any unsaved local draft via the banner.
  // We only set banner state here — the actual restore is deferred to the
  // writer's "Restore" click (applyRestore), so it never races Quill init.
  useEffect(() => {
    if (!userId) return;
    const rec = loadDraft(newDraftKey(userId));
    if (rec && rec.payload && !isDraftEmpty(rec.payload)) {
      setRecovery({ savedAt: rec.savedAt, ...rec.payload });
    }
  }, [userId]);

  useEffect(() => {
    if (!quillInstance.current && quillRef.current) {
      quillInstance.current = new Quill(quillRef.current, {
        theme: 'snow',
        placeholder: 'Write something amazing...',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ header: 1 }, { header: 2 }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ script: 'sub' }, { script: 'super' }],
            [{ indent: '-1' }, { indent: '+1' }],
            [{ direction: 'rtl' }],
            [{ size: ['small', false, 'large', 'huge'] }],
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            [{ color: [] }, { background: [] }],
            [{ font: [] }],
            [{ align: [] }],
            ['clean'],
          ],
        },
      });

      quillInstance.current.on('text-change', () => {
        setInputs((prev) => ({
          ...prev,
          description: quillInstance.current.root.innerHTML,
        }));
      });
    }
  }, [])

  // Auto-save: debounce-write the current editor state. Skip the very first
  // run (don't persist the blank form on open) and skip empty drafts.
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (!draftKey) return;
    payloadRef.current = {
      title: inputs.title,
      description: inputs.description,
      category: inputs.category,
      tags: inputs.tags || "",
      image: inputs.image || "",
      useImageUrl,
    };
    setSaveState("saving");
    debouncedRef.current.trigger(draftKey);
  }, [draftKey, inputs, useImageUrl]);

  // Flush any pending save when leaving the page (best-effort).
  useEffect(() => {
    const handler = () => debouncedRef.current.flush(draftKey);
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [draftKey]);

  // Restore a recovered draft into the form + Quill. Called from the banner's
  // Restore button — by then Quill is already initialized, so writing
  // root.innerHTML is safe and won't be clobbered by the text-change listener.
  const applyRestore = () => {
    if (!recovery) return;
    setInputs({
      title: recovery.title || "",
      description: recovery.description || "",
      image: recovery.image || "",
      category: recovery.category || "",
      tags: normalizeTags(recovery.tags, "string"),
    });
    setUseImageUrl(recovery.useImageUrl !== false);
    setUploadedImage(null); // File objects aren't restorable across sessions
    if (quillInstance.current) {
      quillInstance.current.root.innerHTML = recovery.description || "";
    }
    setRecovery(null);
  };

  const discardRecovery = () => {
    if (draftKey) clearDraft(draftKey);
    setRecovery(null);
  };

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
    setErrors((prev) => { const next = { ...prev }; delete next[e.target.name]; return next; });
  };

  const setFieldError = (field, msg) =>
    setErrors((prev) => {
      const next = { ...prev };
      if (msg) next[field] = msg;
      else delete next[field];
      return next;
    });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setUploadedImage(file);
        setFieldError("image", "");
        // Revoke the previous preview URL so repeated picks don't leak blobs.
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        setImagePreviewUrl(URL.createObjectURL(file));
    }
};

const handleBlogAction = async (status, scheduleAt = null) => {
  // Scheduling: require a valid future date, then submit as a Draft with a
  // publishAt. The server defers both the public listing and the publish
  // points until the promotion sweep flips it to Published.
  const scheduling = !!scheduleAt;
  if (scheduling) {
    const d = new Date(scheduleAt);
    if (Number.isNaN(d.getTime()) || d.getTime() <= Date.now()) {
      toast.error("Pick a future date and time to schedule.");
      return;
    }
  }

  const formData = new FormData();
  formData.append("title", inputs.title);
  formData.append("description", inputs.description);
  formData.append("category", inputs.category);
  formData.append("status", scheduling ? "Draft" : status);
  if (scheduling) formData.append("publishAt", new Date(scheduleAt).toISOString());

  const formattedTags = inputs.tags ? inputs.tags.split(",").map(tag => tag.trim()) : [];
  formData.append("tags", JSON.stringify(formattedTags));

  if (uploadedImage) {
    formData.append("image", uploadedImage);
  } else if (inputs.image) {
    formData.append("image", inputs.image);
  }

    // Inline field-level validation before submitting. Surface errors per
    // field instead of a single generic toast so the user knows what to fix.
    const found = {
      title: validateMinLength(inputs.title, 2, "Title"),
      category: validateRequired(inputs.category, "Category"),
      description: stripHtml(inputs.description) ? "" : "Description is required.",
      image: (uploadedImage || inputs.image) ? "" : "Please upload an image or provide an image URL.",
    };
    const hasErrors = Object.values(found).some(Boolean);
    setErrors(hasErrors ? found : {});
    if (hasErrors) return;

    setSubmittingStatus(scheduling ? "Schedule" : status);
    try {

      const response = await axios.post("/api/v1/blog/create-blog", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        // The server now owns the content — drop the local safety net so a
        // later visit doesn't prompt to restore a stale local copy.
        if (draftKey) clearDraft(draftKey);
        setSaveState("idle");
        if (scheduling) {
          const when = new Date(scheduleAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
          toastScheduled(when);
          navigate("/my-blogs");
        } else {
          if (status === 'Published') toastPublished(); else toastDraft();
          // Publishing awards points server-side; sync the store + celebrate any
          // level-up / badge earned on publish. Drafts earn nothing.
          if (status === 'Published' && response.data.points !== undefined) {
            dispatch(setGamification({ points: response.data.points, level: response.data.level, badges: response.data.badges }));
            celebrateAchievement({ leveledUp: response.data.leveledUp, newBadges: response.data.newBadges, level: response.data.level });
            if (response.data.leveledUp || (response.data.newBadges && response.data.newBadges.length)) dispatch(fetchUnreadCount());
          }
          navigate("/my-blogs");
        }
      } else {
        throw new Error(scheduling ? "Failed to schedule blog." : `Failed to ${status.toLowerCase()} blog.`);
      }
    } catch (error) {
      toast.error(
        (scheduling ? "Failed to schedule blog: " : `Failed to ${status.toLowerCase()} blog: `) +
        (error.response ? error.response.data.message : "Please try again.")
      );
    } finally {
      setSubmittingStatus(null);
    }
  };

  // Live word count + estimated read time, derived from the editor content.
  // Quill keeps an "empty" doc as <p><br></p>, so stripHtml gates the count.
  const wordCount = stripHtml(inputs.description).split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(wordCount / 200));
  // Preview source for the cover: URL string in URL mode, blob for uploads.
  const previewSrc = useImageUrl ? inputs.image : imagePreviewUrl;

  const handleCategoryPick = (cat) => {
    setInputs((prev) => ({ ...prev, category: cat }));
    setFieldError("category", "");
  };

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        py: { xs: 4, md: 6 },
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          backgroundImage: "url('./create.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.25,
          zIndex: -1,
        },
      }}
    >
      <Box sx={{ maxWidth: 980, mx: "auto", px: 2 }}>
        {/* ── Action bar: heading + streak + save / publish ── */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ sm: "center" }}
          sx={{ mb: 3 }}
        >
          <SectionHeading eyebrow="Write" title="Create a Blog" align="left" sx={{ mb: 0 }} />
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <StreakChip />
            <Button
              onClick={() => handleBlogAction('Draft')}
              variant="outlined"
              color="primary"
              disabled={submittingStatus !== null}
              startIcon={<SaveIcon />}
              sx={{ borderRadius: 999, px: 2, textTransform: "none", fontWeight: 600 }}
            >
              {submittingStatus === 'Draft' ? 'Saving…' : submittingStatus === 'Schedule' ? 'Scheduling…' : 'Save Draft'}
            </Button>
            <GradientButton
              onClick={() => handleBlogAction('Published')}
              disabled={submittingStatus !== null}
              startIcon={<SendIcon />}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 700 }}
            >
              {submittingStatus === 'Published' ? 'Publishing…' : 'Publish'}
            </GradientButton>
          </Stack>
        </Stack>

        {recovery && (
          <DraftRecoveryBanner
            savedAt={recovery.savedAt}
            onRestore={applyRestore}
            onDiscard={discardRecovery}
          />
        )}

        <Grid container spacing={3}>
          {/* ── Main column: headline title + rich editor ── */}
          <Grid item xs={12} md={8}>
            <GlassCard sx={{ p: { xs: 2.5, md: 4 } }}>
              {/* Borderless "headline" title — reads like a real editor, not a form field */}
              <TextField
                name="title"
                variant="standard"
                fullWidth
                placeholder="Tell your story…"
                value={inputs.title}
                onChange={handleChange}
                onBlur={() => setFieldError("title", validateMinLength(inputs.title, 2, "Title"))}
                error={Boolean(errors.title)}
                helperText={errors.title}
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    fontSize: { xs: 26, md: 32 },
                    fontWeight: 800,
                    fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
                    pb: 0.5,
                    "&::placeholder": { color: "text.disabled", opacity: 1, fontWeight: 700 },
                  },
                }}
                sx={{ mb: 1 }}
              />

              {/* Byline: author + live word count / read time */}
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <UserAvatar
                    src={user?.profile_image}
                    name={user?.username}
                    sx={{ width: 28, height: 28, fontSize: 14 }}
                  />
                  <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                    {user?.username || "You"}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  {/* Autosave indicator — mirrors Medium's quiet "Saved" affordance */}
                  {draftKey && saveState !== "idle" && (
                    <Chip
                      size="small"
                      label={saveState === "saving" ? "Saving…" : "Draft saved"}
                      variant="outlined"
                      aria-live="polite"
                      sx={{
                        color: saveState === "saving" ? "text.secondary" : "success.main",
                        borderColor: saveState === "saving" ? "divider" : "success.main",
                        fontWeight: 600,
                      }}
                    />
                  )}
                  <Chip
                    size="small"
                    label={`${wordCount} words`}
                    variant="outlined"
                    sx={{ color: "text.secondary", fontWeight: 600 }}
                  />
                  <Chip
                    size="small"
                    label={`${readingTime} min read`}
                    variant="outlined"
                    sx={{ color: "text.secondary", fontWeight: 600 }}
                  />
                </Stack>
              </Stack>
              <Divider sx={{ mb: 2 }} />

              {/* Quill rich editor */}
              <Box sx={{ mb: 1, width: "100%" }}>
                <Box ref={quillRef} sx={{ height: 280, width: "100%" }} />
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                  <IconButton
                    onClick={() => {
                      listening ? SpeechRecognition.stopListening() : SpeechRecognition.startListening({ continuous: true });
                    }}
                    color={listening ? "secondary" : "primary"}
                    aria-label={listening ? "Stop dictation" : "Start dictation"}
                    sx={{
                      border: 1,
                      borderColor: listening ? "secondary.main" : "divider",
                      borderRadius: 999,
                      px: 1.25,
                    }}
                  >
                    {listening ? <MicOffIcon /> : <MicIcon />}
                  </IconButton>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {listening ? "Listening… speak to dictate" : "Voice dictation"}
                  </Typography>
                </Stack>
                {errors.description && (
                  <Typography color="error" variant="caption" sx={{ display: "block", ml: 1, mt: 0.5 }}>
                    {errors.description}
                  </Typography>
                )}
              </Box>
            </GlassCard>
          </Grid>

          {/* ── Side rail: details / cover / schedule ── */}
          <Grid item xs={12} md={4}>
            <Stack spacing={2.5}>
              {/* Details: category chips + tags */}
              <GlassCard sx={{ p: 2.5 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <CategoryIcon sx={{ fontSize: 18, color: "primary.main" }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}>
                    Details
                  </Typography>
                </Stack>

                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  Category
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 0.75,
                    mt: 0.75,
                    mb: errors.category ? 0.5 : 1.75,
                  }}
                >
                  {categories.map((c) => {
                    const active = inputs.category === c;
                    return (
                      <Chip
                        key={c}
                        label={c}
                        size="small"
                        color={active ? "primary" : "default"}
                        variant={active ? "filled" : "outlined"}
                        onClick={() => handleCategoryPick(c)}
                        sx={{ fontWeight: 600, borderRadius: 999 }}
                      />
                    );
                  })}
                </Box>
                {errors.category && (
                  <Typography color="error" variant="caption" sx={{ display: "block", mb: 1.5 }}>
                    {errors.category}
                  </Typography>
                )}

                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.5 }}>
                  <LocalOfferIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                    Tags
                  </Typography>
                </Stack>
                <TextField
                  name="tags"
                  placeholder="comma-separated"
                  value={inputs.tags || ''}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                />
              </GlassCard>

              {/* Cover image: segmented URL/Upload + live preview */}
              <GlassCard sx={{ p: 2.5 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <AddPhotoAlternateIcon sx={{ fontSize: 18, color: "primary.main" }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}>
                    Cover image
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                  <Button
                    variant={useImageUrl ? "contained" : "outlined"}
                    color="primary"
                    size="small"
                    onClick={() => setUseImageUrl(true)}
                    startIcon={<LinkIcon />}
                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 600, flex: 1 }}
                  >
                    URL
                  </Button>
                  <Button
                    variant={!useImageUrl ? "contained" : "outlined"}
                    color="primary"
                    size="small"
                    onClick={() => setUseImageUrl(false)}
                    startIcon={<CloudUploadIcon />}
                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 600, flex: 1 }}
                  >
                    Upload
                  </Button>
                </Stack>

                {useImageUrl ? (
                  <TextField
                    name="image"
                    value={inputs.image}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                    placeholder="https://…"
                  />
                ) : (
                  <Box
                    component="label"
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.5,
                      border: "2px dashed",
                      borderColor: "divider",
                      borderRadius: 2,
                      p: 2,
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "border-color .2s ease, background-color .2s ease",
                      "&:hover": { borderColor: "primary.main", bgcolor: "brandSoft" },
                    }}
                  >
                    <CloudUploadIcon sx={{ color: "text.secondary" }} />
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {uploadedImage ? uploadedImage.name : "Click to choose an image"}
                    </Typography>
                    <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                  </Box>
                )}

                {previewSrc && (
                  <Box
                    component="img"
                    src={previewSrc}
                    alt="Cover preview"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                    sx={{
                      mt: 1.5,
                      width: "100%",
                      maxHeight: 160,
                      objectFit: "cover",
                      borderRadius: 2,
                      border: 1,
                      borderColor: "divider",
                    }}
                  />
                )}
                {errors.image && (
                  <Typography color="error" variant="caption" sx={{ display: "block", mt: 1 }}>
                    {errors.image}
                  </Typography>
                )}
              </GlassCard>

              {/* Schedule for later — stored as a Draft the server auto-publishes
                  at the chosen time. Independent of Save Draft / Publish above. */}
              <GlassCard sx={{ p: 2.5 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <ScheduleIcon sx={{ fontSize: 18, color: "primary.main" }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}>
                    Schedule
                  </Typography>
                </Stack>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.25 }}>
                  Publish automatically at a later time.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
                  <TextField
                    label="Schedule for later"
                    type="datetime-local"
                    size="small"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ flex: 1, minWidth: 0 }}
                    inputProps={{ min: new Date(Date.now() + 60000).toISOString().slice(0, 16) }}
                  />
                  <Button
                    variant="outlined"
                    color="secondary"
                    disabled={!scheduledFor || submittingStatus !== null}
                    onClick={() => handleBlogAction("Draft", scheduledFor)}
                    sx={{ whiteSpace: "nowrap", borderRadius: 999, textTransform: "none", fontWeight: 600 }}
                  >
                    Schedule
                  </Button>
                </Stack>
              </GlassCard>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default CreateBlog;
