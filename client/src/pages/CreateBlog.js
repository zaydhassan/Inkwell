import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Box } from "@mui/material";
import toast from "react-hot-toast";
import 'quill/dist/quill.snow.css';
import Quill from 'quill';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useAuth } from "../context/AuthContext";
import { validateMinLength, validateRequired } from "../utils/validate";
import { toastPublished, toastDraft, toastScheduled } from "../utils/toasts";
import DraftRecoveryBanner from "../components/DraftRecoveryBanner";
import { celebrateAchievement } from "../components/Celebration";
import { InkBackdrop } from "../components/ink";
import StudioTopBar from "../components/write/StudioTopBar";
import StudioRail from "../components/write/StudioRail";
import StudioSide from "../components/write/StudioSide";
import EditorCanvas from "../components/write/EditorCanvas";
import AiCopilot from "../components/write/AiCopilot";
import SeoPanel from "../components/write/SeoPanel";
import TemplatesPopover, { TEMPLATES } from "../components/write/TemplatesPopover";
import PreviewOverlay from "../components/write/PreviewOverlay";
import DetailsPanel from "../components/write/DetailsPanel";
import CoverPanel from "../components/write/CoverPanel";
import SchedulePanel from "../components/write/SchedulePanel";
import ChecklistPanel from "../components/write/ChecklistPanel";
import { setGamification, fetchUnreadCount } from "../redux/store";
import {
  isAiConfigured,
  runAiAction,
  findAiAction,
  runChatTurn,
  runDraftAnalysis,
} from "../services/aiService";
import {
  newDraftKey,
  loadDraft,
  clearDraft,
  saveDraft,
  makeDebouncedSave,
  normalizeTags,
  isDraftEmpty,
} from "../utils/draftAutosave";
// Last, so the page's ink skin and layout win any tie against Quill's
// stock snow theme. (The old light-only `styles/quill-terracotta.css` is
// deliberately NOT imported here — Edit Blog still owns it.)
import './CreateBlog.css';

const categories = ['Technology', 'Education', 'Health', 'Entertainment', 'Food', 'Business', 'Social Media', 'Travel', 'News'];

// Quill stores content as HTML; an "empty" editor still holds tags like
// <p><br></p>, so strip tags to tell whether the user actually wrote anything.
const stripHtml = (html) => (html || '').replace(/<\/?[^>]+(>|$)/g, '').trim();

// Accessible names for the Quill toolbar. Its snow-theme buttons contain only
// an SVG, so they ship with NO accessible name at all — a screen reader
// announces them as "button". Names are derived from each button's own ql-*
// class plus its `value` attribute, which is what distinguishes ordered from
// bulleted lists, sub from superscript, and the two indent directions.
const TOOLBAR_BUTTON_LABELS = {
  "ql-bold": () => "Bold",
  "ql-italic": () => "Italic",
  "ql-underline": () => "Underline",
  "ql-strike": () => "Strikethrough",
  "ql-blockquote": () => "Block quote",
  "ql-code-block": () => "Code block",
  "ql-list": (value) => (value === "ordered" ? "Numbered list" : "Bulleted list"),
  "ql-script": (value) => (value === "sub" ? "Subscript" : "Superscript"),
  "ql-indent": (value) => (value === "+1" ? "Increase indent" : "Decrease indent"),
  "ql-direction": () => "Right-to-left text",
  "ql-clean": () => "Clear formatting",
};

// The dropdown pickers (size, heading, colour, highlight, font, align) are
// focusable spans, so they need a role and a name for the same reason.
const TOOLBAR_PICKER_LABELS = {
  "ql-size": "Text size",
  "ql-header": "Heading level",
  "ql-color": "Text colour",
  "ql-background": "Highlight colour",
  "ql-font": "Font",
  "ql-align": "Alignment",
};

// Suggestion text is model output, i.e. untrusted-ish content — it is pasted
// through Quill's clipboard parsing only as escaped paragraphs, never raw.
const escapeHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// Blocks split on blank lines; single newlines stay inside the block (<br/>).
const suggestionToHtml = (text) =>
  String(text)
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");

// Bounds of the paragraph the caret sits in, so paragraph-scoped actions pick
// the right slice without asking the writer to select it.
const findParagraphBounds = (text, at) => {
  const start = text.lastIndexOf("\n", Math.max(0, at - 1)) + 1;
  const end = text.indexOf("\n", at) === -1 ? text.length : text.indexOf("\n", at);
  return { start, end };
};

const CreateBlog = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // Read auth from context (single source of truth) instead of localStorage.
  // The server identifies the author from the JWT (req.user._id), so we no
  // longer append a spoofable "user" field or send the legacy "user-id" header.
  const { user } = useAuth();
  const userRole = user?.role;
  const [inputs, setInputs] = useState({ title: "", description: "", image: "", category: "", tags: "" });
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [useImageUrl, setUseImageUrl] = useState(true);
  // Which action is in flight (null | 'Published' | 'Draft' | 'Schedule') so
  // every button disables during a submit and the active one shows a loading
  // label.
  const [submittingStatus, setSubmittingStatus] = useState(null);
  const [errors, setErrors] = useState({});
  // "Schedule for later": a future datetime that submits the post as a Draft
  // the server auto-publishes at the chosen time (see promoteScheduledBlogs).
  // The panel splits this into a date field and a time field, but the two
  // are only ever an input detail — `scheduledFor` remains the single
  // "YYYY-MM-DDTHH:mm" string that handleBlogAction validates and submits.
  const [scheduledFor, setScheduledFor] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const quillRef = useRef(null);
  const quillInstance = useRef(null);

  // ── Studio shell state ────────────────────────────────────────────────
  // Right panel tabs: "ai" (default) | "details" | "seo" | "publish".
  const [activeTab, setActiveTab] = useState("ai");
  // Mobile/tablet: the same panel becomes a bottom drawer. Single DOM
  // instance in both modes (StudioSide), so tab state survives the switch.
  const [panelOpen, setPanelOpen] = useState(false);
  // Distraction-free: hides rail + panel; Escape exits.
  const [immersive, setImmersive] = useState(false);
  // Draft preview overlay + the two rail/popover surfaces.
  const [previewOpen, setPreviewOpen] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  // Autosave stamping: recorded when a write actually lands, so the top bar
  // can show "Autosaved Ns ago" without pretending anything happened.
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // ── AI copilot state (all of it page-owned; AiCopilot is props-only) ──
  const [aiConfigured] = useState(() => isAiConfigured());
  const [chat, setChat] = useState({ messages: [], busy: false });
  const [runningAction, setRunningAction] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [insights, setInsights] = useState(null);
  const [analysisBusy, setAnalysisBusy] = useState(false);
  // null until the first analysis run — the UI's "not analyzed yet" state.
  const [enhancements, setEnhancements] = useState(null);

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
  // pending) → "saved" (localStorage write done). Drives the top bar chip.
  const [saveState, setSaveState] = useState("idle");
  // Stable debounced save instance (created once, reads payloadRef.current).
  const debouncedRef = useRef(null);
  if (!debouncedRef.current) {
    debouncedRef.current = makeDebouncedSave((key) => {
      if (key && payloadRef.current && !isDraftEmpty(payloadRef.current)) {
        saveDraft(key, payloadRef.current);
        setSaveState("saved");
        setLastSavedAt(Date.now());
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

  // The two schedule inputs are one value. Deriving it here means the submit
  // path never learns that the panel changed shape.
  useEffect(() => {
    setScheduledFor(scheduleDate && scheduleTime ? `${scheduleDate}T${scheduleTime}` : "");
  }, [scheduleDate, scheduleTime]);

  useEffect(() => {
    if (!quillInstance.current && quillRef.current) {
      quillInstance.current = new Quill(quillRef.current, {
        theme: 'snow',
        placeholder: 'Start writing your story...',
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

  // Name the editor's controls for assistive tech. Runs once, after the init
  // effect above; idempotent (anything already named is skipped) and purely
  // additive — Quill's own roles, tabindex and event wiring are untouched.
  useEffect(() => {
    const toolbar = quillInstance.current?.getModule("toolbar");
    const root = toolbar?.container;
    if (!root) return;

    root.querySelectorAll("button").forEach((btn) => {
      const key = [...btn.classList].find((c) => c.startsWith("ql-") && c !== "ql-active");
      const label = TOOLBAR_BUTTON_LABELS[key]?.(btn.getAttribute("value"));
      if (label && !btn.getAttribute("aria-label")) btn.setAttribute("aria-label", label);
    });

    root.querySelectorAll(".ql-picker-label").forEach((el) => {
      const picker = el.closest(".ql-picker");
      const key = [...(picker?.classList || [])].find((c) => c.startsWith("ql-"));
      const label = TOOLBAR_PICKER_LABELS[key];
      if (!label) return;
      if (!el.getAttribute("aria-label")) el.setAttribute("aria-label", label);
      if (!el.getAttribute("role")) el.setAttribute("role", "button");
    });
  }, []);

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
    // An empty payload is skipped by the debounced write (below), which would
    // leave the chip sitting on "Saving…" forever (React StrictMode remounts
    // run past the first-write skip). Idle out instead, and drop the stored
    // copy — an emptied form has superseded anything previously saved.
    if (isDraftEmpty(payloadRef.current)) {
      clearDraft(draftKey);
      setSaveState("idle");
      setLastSavedAt(null);
      return;
    }
    setSaveState("saving");
    debouncedRef.current.trigger(draftKey);
  }, [draftKey, inputs, useImageUrl]);

  // Flush any pending save when leaving the page (best-effort).
  useEffect(() => {
    const handler = () => debouncedRef.current.flush(draftKey);
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [draftKey]);

  // Object URLs are not collected on their own. Re-picking a file and removing
  // the cover both revoke already; this closes the last leak — the preview URL
  // still live when the writer navigates away.
  const previewUrlRef = useRef("");
  useEffect(() => {
    previewUrlRef.current = imagePreviewUrl;
  }, [imagePreviewUrl]);
  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    []
  );

  // Distraction-free exits on Escape — the one affordance the mode hides
  // should never be the only way out of it.
  useEffect(() => {
    if (!immersive) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setImmersive(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [immersive]);

  // ⌘K / Ctrl+K opens the copilot (the spec'd shortcut). The global command
  // palette steps aside while this page flags itself, so the binding can't
  // double-fire (see CommandPalette.js). The ref indirection keeps the
  // listener mounted once while the handler stays current.
  const openAssistantRef = useRef(null);
  useEffect(() => {
    document.body.dataset.inkCaptureK = "1";
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openAssistantRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      delete document.body.dataset.inkCaptureK;
      window.removeEventListener("keydown", onKey);
    };
  }, []);

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
        setCoverOpen(false);
    }
};

// Clear both cover sources at once — the uploaded File and the URL string —
// so the "Add a cover image" checklist line and the submit validation agree
// that there is no cover. Did not exist before; nothing else calls it.
const handleRemoveCover = () => {
  setUploadedImage(null);
  setInputs((prev) => ({ ...prev, image: "" }));
  if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
  setImagePreviewUrl("");
  setFieldError("image", "");
  setCoverOpen(false);
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
        setLastSavedAt(null);
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
            // Warm confetti: the default burst is greyscale, which vanishes
            // against this dark canvas.
            celebrateAchievement({
              leveledUp: response.data.leveledUp,
              newBadges: response.data.newBadges,
              level: response.data.level,
              colors: ["#FF6A00", "#FF8A3D", "#FFD9BF", "#FFF3EA"],
            });
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

  const toggleDictation = () => {
    if (listening) SpeechRecognition.stopListening();
    else SpeechRecognition.startListening({ continuous: true });
  };

  // Is there anything for autosave to actually persist? `makeDebouncedSave`
  // skips empty payloads, so the indicator needs this to avoid sitting on
  // "Saving…" forever once the writer clears the form. Presentation only —
  // the save path itself is untouched.
  const hasDraftContent = Boolean(
    (inputs.title || "").trim() ||
      stripHtml(inputs.description) ||
      (inputs.category || "").trim() ||
      (inputs.tags || "").trim() ||
      (inputs.image || "").trim()
  );

  // The checklist reports the SAME four rules handleBlogAction enforces below,
  // so it can never promise something the submit would then refuse.
  const checklist = [
    { label: "Add a title", done: !validateMinLength(inputs.title, 2, "Title") },
    { label: "Select a category", done: !validateRequired(inputs.category, "Category") },
    { label: "Add a cover image", done: Boolean(uploadedImage || inputs.image) },
    { label: "Write content", done: Boolean(stripHtml(inputs.description)) },
  ];

  /* ─────────────────────────────────────────────────────────────────────
     AI wiring — context routing, honest failure, human-first application.
     ───────────────────────────────────────────────────────────────────── */

  // The honest "not available" line the copilot speaks instead of pretending
  // a run succeeded. Used by chat + quick actions + analysis alike.
  const UNAVAILABLE =
    "AI is currently unavailable. Your draft is safe. Try again later.";

  const pushUnavailable = () =>
    setChat((c) => ({ ...c, messages: [...c.messages, { role: "ai", text: UNAVAILABLE }] }));

  // Context slice for the quick actions. `want` is the action's target:
  //   selection → highlighted text, else the paragraph the caret sits in
  //   article   → the whole draft
  // When the slice comes from the document, its coordinates come back too so
  // a "Replace" can later verify the draft still matches before it fires.
  const aiContext = (want = "article") => {
    const q = quillInstance.current;
    const articleText = q ? q.getText().trim() : "";
    if (want !== "selection" || !q) {
      return { title: inputs.title, category: inputs.category, tags: inputs.tags || "", articleText, slice: articleText, sliceIndex: null, sliceLength: 0 };
    }
    const range = q.getSelection(true) || { index: 0, length: 0 }; // never throws
    if (range.length > 0) {
      const slice = q.getText(range.index, range.length);
      return {
        title: inputs.title,
        category: inputs.category,
        tags: inputs.tags || "",
        articleText,
        slice: slice.trim(),
        sliceIndex: range.index,
        sliceLength: range.length,
      };
    }
    // Caret in an unselected paragraph — expand to that paragraph's bounds.
    const text = q.getText();
    const { start, end } = findParagraphBounds(text, range.index);
    return {
      title: inputs.title,
      category: inputs.category,
      tags: inputs.tags || "",
      articleText,
      slice: text.slice(start, end).trim(),
      sliceIndex: start,
      sliceLength: end - start,
    };
  };

  const ensureAiTab = () => {
    setActiveTab("ai");
    setPanelOpen(true);
    // Focus the chat input once the panel (drawer, on small screens) painted.
    setTimeout(() => {
      document.querySelector(".ist-chat-input input")?.focus();
    }, 120);
  };
  openAssistantRef.current = ensureAiTab;

  const sendChat = async (text) => {
    setChat((c) => ({ ...c, messages: [...c.messages, { role: "user", text }], busy: true }));
    const transcript = [...chat.messages, { role: "user", text }];
    const draft = aiContext();
    const res = await runChatTurn(
      { title: inputs.title, wordCount, articleText: draft.articleText },
      transcript
    );
    setChat((c) => ({
      ...c,
      busy: false,
      messages: [...c.messages, { role: "ai", text: res.ok ? res.text : UNAVAILABLE }],
    }));
  };

  const runQuickAction = async (actionId) => {
    const action = findAiAction(actionId);
    if (!action || runningAction) return;
    const ctx = aiContext(action.target);
    if ((action.target === "selection" && !ctx.slice) || (!ctx.articleText && !ctx.title)) {
      toast.error(
        action.target === "selection"
          ? "Highlight some text (or place the caret in a paragraph) first."
          : "Write something first — even a rough note is enough."
      );
      return;
    }
    setActiveTab("ai");
    setRunningAction(actionId);
    const res = await runAiAction(actionId, { ...ctx, topic: ctx.title });
    setRunningAction(null);
    if (!res.ok) {
      // Never fake it: surface the honest unavailable line in the thread.
      pushUnavailable();
      return;
    }
    setSuggestion({
      heading: action.title,
      mode: action.mode,
      resultText: res.text,
      // For replace-mode suggestions: remember where the slice came from so
      // "Replace" only fires if the draft still matches it.
      sourceText: ctx.slice,
      replaceIndex: ctx.sliceIndex,
      replaceLen: ctx.sliceLength,
    });
  };

  const runAnalysis = async () => {
    if (analysisBusy) return;
    if (!stripHtml(inputs.description)) {
      toast.error("Write something first — analysis needs a draft.");
      return;
    }
    setAnalysisBusy(true);
    const res = await runDraftAnalysis(aiContext());
    setAnalysisBusy(false);
    if (res.ok) {
      setInsights(res.insights);
      setEnhancements(res.enhancements.length ? res.enhancements : []);
    } else {
      setInsights(null);
      pushUnavailable();
    }
  };

  const insertSuggestionHtml = (text) => {
    const q = quillInstance.current;
    if (!q) return;
    const range = q.getSelection(true);
    const index = range?.index ?? q.getLength();
    q.clipboard.dangerouslyPasteHTML(index, suggestionToHtml(text), "user");
  };

  const handleSuggestionAction = async (mode) => {
    if (!suggestion) return;
    const q = quillInstance.current;

    if (mode === "dismiss") {
      setSuggestion(null);
      return;
    }

    if (mode === "copy") {
      try {
        await navigator.clipboard.writeText(suggestion.resultText);
        toast.success("Copied to clipboard");
      } catch {
        toast.error("Copy failed — your browser blocked clipboard access.");
      }
      return;
    }

    // "Accept" is the natural application of the suggestion's own mode.
    if (mode === "accept") mode = suggestion.mode === "replace" ? "replace" : "insert";

    if (mode === "insert") {
      if (!q) return;
      insertSuggestionHtml(suggestion.resultText);
      setSuggestion(null);
      toast.success("Inserted at your cursor");
      return;
    }

    // Replace: only fires if the draft still reads exactly like the slice the
    // suggestion was built from - otherwise the writer is asked to re-run.
    if (mode === "replace") {
      if (!q || suggestion.replaceIndex == null || suggestion.replaceLen <= 0) {
        toast.error("The source text moved — re-run the action.");
        return;
      }
      const current = q.getText(suggestion.replaceIndex, suggestion.replaceLen).trim();
      if (current !== suggestion.sourceText) {
        toast.error("Your draft changed since this suggestion — re-run the action.");
        return;
      }
      q.deleteText(suggestion.replaceIndex, suggestion.replaceLen, "user");
      q.clipboard.dangerouslyPasteHTML(suggestion.replaceIndex, suggestionToHtml(suggestion.resultText), "user");
      setSuggestion(null);
      toast.success("Replaced");
    }
  };

  const applyEnhancement = (item) => {
    // Human-first: the rewrite opens in the suggestion card (Insert at
    // cursor) — it never modifies the draft on its own.
    setSuggestion({
      heading: `${item.area} · suggested rewrite`,
      mode: "insert",
      resultText: item.rewrite,
      sourceText: "",
      replaceIndex: null,
      replaceLen: 0,
    });
  };

  const dismissEnhancement = (index) =>
    setEnhancements((list) => (list || []).filter((_, i) => i !== index));

  /* ── Templates: pour a scaffold in at the end of the draft ──────────── */

  const applyTemplate = (template) => {
    const q = quillInstance.current;
    if (!q) return;
    const html = TEMPLATES.find((t) => t.id === template.id)?.html || template.html;
    const index = q.getLength();
    q.clipboard.dangerouslyPasteHTML(index, html, "user");
    setTemplatesOpen(false);
    toast.success(`${template.title} scaffold added`);
  };

  /* ── Slots for the right panel ─────────────────────────────────────── */

  const aiEl = (
    <AiCopilot
      chat={chat}
      onSendChat={sendChat}
      onQuickAction={runQuickAction}
      runningAction={runningAction}
      suggestion={suggestion}
      onSuggestionAction={handleSuggestionAction}
      insights={insights}
      analysisBusy={analysisBusy}
      onAnalyze={runAnalysis}
      enhancements={enhancements}
      onApplyEnhancement={applyEnhancement}
      onDismissEnhancement={dismissEnhancement}
      aiConfigured={aiConfigured}
    />
  );

  const detailsEl = (
    <DetailsPanel
      categories={categories}
      category={inputs.category}
      onPickCategory={handleCategoryPick}
      categoryError={errors.category}
      tags={inputs.tags || ""}
      onTagsChange={handleChange}
      // The Details tab's metadata readout and goal meter both run off the
      // page's existing live counters — the same two the SEO tab uses, so the
      // two panels can never disagree about the length of the draft.
      wordCount={wordCount}
      readingTime={readingTime}
    />
  );

  const seoEl = (
    <SeoPanel
      title={inputs.title}
      wordCount={wordCount}
      readingTime={readingTime}
      tags={inputs.tags || ""}
      category={inputs.category}
      hasCover={Boolean(uploadedImage || inputs.image)}
    />
  );

  const publishEl = (
    <>
      <CoverPanel
        useImageUrl={useImageUrl}
        onUseImageUrl={setUseImageUrl}
        imageUrl={inputs.image}
        onImageChange={handleChange}
        uploadedImage={uploadedImage}
        onFileChange={handleFileChange}
        previewSrc={previewSrc}
        onRemoveCover={handleRemoveCover}
        imageError={errors.image}
      />
      <SchedulePanel
        date={scheduleDate}
        time={scheduleTime}
        onDateChange={(e) => setScheduleDate(e.target.value)}
        onTimeChange={(e) => setScheduleTime(e.target.value)}
        onSchedule={() => handleBlogAction("Draft", scheduledFor)}
        disabled={!scheduledFor || submittingStatus !== null}
        busy={submittingStatus === "Schedule"}
      />
      <ChecklistPanel items={checklist} />
    </>
  );

  return (
    <Box
      className="ink ink-write"
      component="main"
      data-immersive={immersive || undefined}
      data-panel-open={panelOpen || undefined}
      data-ai-panel={
        panelOpen && activeTab === "ai" ? "true" : undefined
      }
    >
      {/* Ambient decoration — behind everything, never interactive. The page
          shell carries the matching z-index 1 (see CreateBlog.css). */}
      <InkBackdrop drift />

      <div className="ink-write-shell">
        <StudioTopBar
          saveState={saveState}
          lastSavedAt={lastSavedAt}
          hasDraftContent={hasDraftContent}
          draftKey={draftKey}
          wordCount={wordCount}
          readingTime={readingTime}
          submittingStatus={submittingStatus}
          onSaveDraft={() => handleBlogAction('Draft')}
          onPublish={() => handleBlogAction('Published')}
          onPreview={() => setPreviewOpen(true)}
          onOpenAi={ensureAiTab}
          aiOpen={panelOpen && activeTab === "ai"}
        />

        <div className="ist-row">
          <StudioRail
            active="write"
            onTemplates={() => setTemplatesOpen((prev) => !prev)}
            onAiTools={ensureAiTab}
          />

          <div className="ist-main">
            {recovery && (
              <DraftRecoveryBanner
                tone="ink"
                savedAt={recovery.savedAt}
                onRestore={applyRestore}
                onDiscard={discardRecovery}
              />
            )}

            <EditorCanvas
              quillRef={quillRef}
              title={inputs.title}
              onTitleChange={handleChange}
              onTitleBlur={() => setFieldError("title", validateMinLength(inputs.title, 2, "Title"))}
              titleError={errors.title}
              username={user?.username}
              profileImage={user?.profile_image}
              wordCount={wordCount}
              readingTime={readingTime}
              descriptionError={errors.description}
              listening={listening}
              onToggleDictation={toggleDictation}
              immersive={immersive}
              onToggleImmersive={() => setImmersive((prev) => !prev)}
              coverOpen={coverOpen}
              onToggleCover={() => setCoverOpen((prev) => !prev)}
              previewSrc={previewSrc}
              uploadedImage={uploadedImage}
              useImageUrl={useImageUrl}
              onUseImageUrl={setUseImageUrl}
              imageUrl={inputs.image}
              onImageChange={handleChange}
              onFileChange={handleFileChange}
              onRemoveCover={handleRemoveCover}
              imageError={errors.image}
              onOpenAi={ensureAiTab}
            />

            {/* Floating "Ask InkWell AI" entry — the copilot's doorknob. */}
            <button type="button" className="ist-ai-pill" onClick={ensureAiTab}>
              <span aria-hidden="true">✦</span>
              Ask InkWell AI…
              <kbd className="ist-ai-pill-kbd" aria-hidden="true">⌘K</kbd>
            </button>
          </div>

          <StudioSide
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            aiEl={aiEl}
            detailsEl={detailsEl}
            seoEl={seoEl}
            publishEl={publishEl}
            onCloseDrawer={() => setPanelOpen(false)}
            onTemplates={() => setTemplatesOpen(true)}
          />
        </div>
      </div>

      <TemplatesPopover
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onPick={applyTemplate}
      />

      <PreviewOverlay
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={inputs.title}
        category={inputs.category}
        coverSrc={previewSrc}
        username={user?.username}
        profileImage={user?.profile_image}
        descriptionHtml={inputs.description}
        wordCount={wordCount}
        readingTime={readingTime}
      />

      {panelOpen ? (
        <button
          type="button"
          className="ist-drawer-backdrop"
          aria-label="Close panel"
          onClick={() => setPanelOpen(false)}
          tabIndex={-1}
        />
      ) : null}
    </Box>
  );
};

export default CreateBlog;