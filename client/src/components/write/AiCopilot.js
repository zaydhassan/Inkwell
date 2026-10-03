import React, { useState, useEffect, useRef, memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import ReadMoreIcon from "@mui/icons-material/ReadMore";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import ShortTextIcon from "@mui/icons-material/ShortText";
import RateReviewIcon from "@mui/icons-material/RateReview";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import SegmentIcon from "@mui/icons-material/Segment";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import CheckIcon from "@mui/icons-material/Check";
import InkMeter from "../ink/InkMeter";
import { AI_ACTIONS } from "../../services/aiService";
import { EASE } from "../ink/tokens";

/* ─────────────────────────────────────────────────────────────────────
   InkWell AI — the copilot column's first tab.

   Everything dynamic (chat thread, running action, suggestion card, the
   analysis meters) is page state rendered through these props; nothing
   here listens to Quill or keeps its own copy of the draft.

   Honesty contract, mirrored from the service:
     - No provider configured → the offline notice renders and every run
       surfaces the same "AI is currently unavailable" state. Nothing ever
       fakes an output.
     - A result NEVER touches the editor by itself: it opens a
       suggestion card with Accept / Insert / Replace / Copy / Dismiss.
     - Analysis meters read "Not analyzed yet" until a real run returns.
   ───────────────────────────────────────────────────────────────────── */

const SNAP = { duration: 0.22, ease: EASE };

/* Quick-action cards are metadata + an icon; `AI_ACTIONS` (the extensible
   registry) carries the metadata, this map carries the glyphs. A new action
   added to the service shows up here automatically — unknown ids get the
   default sparkle. */
const ACTION_ICONS = {
  improve: AutoFixHighIcon,
  continue: ReadMoreIcon,
  tone: RecordVoiceOverIcon,
  summarize: ShortTextIcon,
  challenge: RateReviewIcon,
  factcheck: FactCheckIcon,
  outline: SegmentIcon,
  research: ManageSearchIcon,
};

const MODE_LABEL = { replace: "Replace selection", insert: "Insert at cursor" };

const AiCopilot = ({
  chat,
  onSendChat,
  onQuickAction,
  runningAction,
  suggestion,
  onSuggestionAction,
  insights,
  analysisBusy,
  onAnalyze,
  enhancements,
  onApplyEnhancement,
  onDismissEnhancement,
  aiConfigured,
}) => {
  const [draft, setDraft] = useState("");
  const [howOpen, setHowOpen] = useState(false);
  const threadRef = useRef(null);

  // Keep the newest chat turn in view as the thread grows.
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.messages.length, chat.busy]);

  const submitChat = () => {
    const text = draft.trim();
    if (!text || chat.busy) return;
    setDraft("");
    onSendChat(text);
  };

  const onKeyDownChat = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitChat();
    }
  };

  const running = chat.busy || Boolean(runningAction);

  return (
    <div className="ist-ai" role="region" aria-label="InkWell AI copilot">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="ist-ai-head">
        <div>
          <p className="ist-ai-title">
            <AutoAwesomeIcon className="ist-ai-title-icon" />
            InkWell AI
          </p>
          <p className="ist-ai-sub">Your personal writing copilot.</p>
        </div>
        <button
          type="button"
          className="ist-ai-how"
          onClick={() => setHowOpen((prev) => !prev)}
          aria-expanded={howOpen}
          aria-controls="ist-ai-how-body"
        >
          How it works?
        </button>
      </div>

      <AnimatePresence initial={false}>
        {howOpen ? (
          <motion.div
            key="how"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SNAP}
            style={{ overflow: "hidden" }}
          >
            <p className="ist-ai-how-body" id="ist-ai-how-body">
              InkWell AI reads your current draft — never writing over it. Everything it
              produces lands in a card you accept or dismiss, so each change stays yours.
              It runs only while a provider is connected.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!aiConfigured ? (
        <div className="ist-ai-offline" role="status">
          <CloudOffIcon className="ist-ai-offline-icon" />
          <div className="ist-ai-offline-text">
            <strong>AI is currently unavailable.</strong>
            <span>Your draft is safe. Try again later.</span>
          </div>
          <p className="ist-ai-offline-hint">
            No provider is connected on this build. Point VITE_AI_BASE_URL (a proxy you
            own) or VITE_AI_PROVIDER + VITE_AI_API_KEY at a model to bring the copilot
            online.
          </p>
        </div>
      ) : null}

      {/* ── Chat thread ─────────────────────────────────────────────────── */}
      <div className="ist-chat" aria-live="polite">
        {chat.messages.length === 0 ? (
          <p className="ist-chat-empty">
            Ask anything about your writing — structure, tone, a tighter opening.
          </p>
        ) : null}

        {chat.messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SNAP}
            className={`ist-chat-msg ${m.role === "user" ? "is-user" : "is-ai"}`}
          >
            {m.text}
          </motion.div>
        ))}

        {chat.busy ? (
          <span className="ist-thinking" role="status">
            <span className="ist-thinking-dot" aria-hidden="true" />
            Thinking…
          </span>
        ) : null}

        <div ref={threadRef} />
      </div>

      {/* ── Chat input ──────────────────────────────────────────────────── */}
      <div className="ist-chat-input">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDownChat}
          placeholder="Ask anything about your writing..."
          aria-label="Ask InkWell AI"
          maxLength={600}
        />
        <button
          type="button"
          className="ist-chat-send"
          onClick={submitChat}
          disabled={!draft.trim() || chat.busy}
          aria-label="Send to InkWell AI"
        >
          <SendIcon />
        </button>
      </div>

      {/* ── Quick actions: the 2×4 assist grid ──────────────────────────── */}
      <p className="ist-ai-eyebrow">Quick actions</p>
      <div className="ist-quick-grid" role="group" aria-label="AI quick actions">
        {AI_ACTIONS.map((action) => {
          const Icon = ACTION_ICONS[action.id] || AutoAwesomeIcon;
          const isRunning = runningAction === action.id;
          const disabled = Boolean(runningAction) && !isRunning;
          return (
            <button
              key={action.id}
              type="button"
              className={`ist-quick${isRunning ? " is-running" : ""}`}
              onClick={() => onQuickAction(action.id)}
              disabled={disabled}
              aria-label={`${action.title} — ${action.desc}`}
            >
              <Icon className="ist-quick-icon" />
              <span className="ist-quick-text">
                <span className="ist-quick-title">
                  {isRunning ? "Thinking…" : action.title}
                </span>
                <span className="ist-quick-desc">{action.desc}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Suggestion card: the only door between a result and the draft ── */}
      <AnimatePresence initial={false}>
        {suggestion ? (
          <motion.div
            key="suggestion"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={SNAP}
            className="ist-suggestion"
            role="dialog"
            aria-label={suggestion.heading || "AI suggestion"}
          >
            <div className="ist-suggestion-head">
              <span className="ist-suggestion-eyebrow">InkWell AI · Suggested improvement</span>
              <button
                type="button"
                className="ist-suggestion-close"
                onClick={() => onSuggestionAction("dismiss")}
                aria-label="Dismiss suggestion"
              >
                <CloseIcon />
              </button>
            </div>
            <p className="ist-suggestion-title">{suggestion.heading}</p>

            {suggestion.mode === "replace" ? (
              <div className="ist-suggestion-diff">
                <p className="ist-suggestion-label">Original</p>
                <p className="ist-suggestion-src">{suggestion.sourceText}</p>
                <p className="ist-suggestion-label ist-suggestion-label--ai">Suggested</p>
                <p className="ist-suggestion-body">{suggestion.resultText}</p>
              </div>
            ) : (
              <p className="ist-suggestion-body">{suggestion.resultText}</p>
            )}

            <div className="ist-suggestion-actions">
              <button
                type="button"
                className="ist-suggest-btn"
                onClick={() => onSuggestionAction("accept")}
                disabled={running}
              >
                <CheckIcon />
                Accept
              </button>
              {/* The extra application path matches the suggestion's own mode:
                  a whole-slice edit offers Replace, a cursor addition offers
                  Insert. Accept always means "use the natural application". */}
              {suggestion.mode === "replace" ? (
                <button
                  type="button"
                  className="ist-suggest-ghost"
                  onClick={() => onSuggestionAction("replace")}
                  disabled={running}
                >
                  {MODE_LABEL.replace}
                </button>
              ) : (
                <button
                  type="button"
                  className="ist-suggest-ghost"
                  onClick={() => onSuggestionAction("insert")}
                  disabled={running}
                >
                  {MODE_LABEL.insert}
                </button>
              )}
              <button
                type="button"
                className="ist-suggest-ghost"
                onClick={() => onSuggestionAction("copy")}
              >
                <ContentCopyIcon />
                Copy
              </button>
              <button
                type="button"
                className="ist-suggest-ghost"
                onClick={() => onSuggestionAction("dismiss")}
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ── AI Insights ─────────────────────────────────────────────────── */}
      <p className="ist-ai-eyebrow">AI Insights</p>
      <div className="ist-insights">
        {analysisBusy ? (
          <span className="ist-insights-working" role="status">
            <span className="ist-thinking-dot" aria-hidden="true" />
            Analyzing your draft…
          </span>
        ) : insights ? (
          <>
            {[
              ["Clarity", insights.clarity],
              ["Readability", insights.readability],
              ["Originality", insights.originality],
            ].map(([label, value]) => (
              <div key={label} className="ist-insight">
                <span className="ist-insight-label">{label}</span>
                <InkMeter className="ist-insight-meter" value={value} label={`${label} score`} />
                <span className="ist-insight-value">{value}</span>
              </div>
            ))}
            <button type="button" className="ist-insight-again" onClick={onAnalyze}>
              <QueryStatsIcon />
              Re-analyze draft
            </button>
          </>
        ) : (
          <div className="ist-insights-empty">
            <p>Not analyzed yet.</p>
            <button type="button" className="ist-insight-cta" onClick={onAnalyze}>
              <QueryStatsIcon />
              Analyze draft
            </button>
          </div>
        )}
      </div>

      {/* ── Suggested enhancements (from the analysis runs) ─────────────── */}
      <p className="ist-ai-eyebrow">Suggested enhancements</p>
      <div className="ist-enhance">
        {enhancements === null ? (
          <p className="ist-enhance-empty">Run draft analysis to surface suggestions.</p>
        ) : enhancements.length === 0 ? (
          <p className="ist-enhance-empty">Nothing flagged right now — the draft reads clean.</p>
        ) : (
          enhancements.map((item, i) => (
            <motion.div
              key={`${item.area}-${i}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SNAP}
              className="ist-enhance-item"
            >
              <div className="ist-enhance-head">
                <span className="ist-enhance-badge">{item.area}</span>
                {item.rewrite ? null : (
                  <span className="ist-enhance-badge ist-enhance-badge--note">note only</span>
                )}
              </div>
              <p className="ist-enhance-note">{item.note}</p>
              <div className="ist-enhance-actions">
                {item.rewrite ? (
                  <button type="button" className="ist-suggest-btn" onClick={() => onApplyEnhancement(item)}>
                    Apply
                  </button>
                ) : null}
                <button type="button" className="ist-suggest-ghost" onClick={() => onDismissEnhancement(i)}>
                  Dismiss
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default memo(AiCopilot);