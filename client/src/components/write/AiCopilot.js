import React, { useState, useEffect, useRef, memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckIcon from "@mui/icons-material/Check";
import InkMeter from "../ink/InkMeter";
import { AI_ACTIONS } from "../../services/aiService";
import { aiActionIcon } from "./aiActionIcons";
import ResearchSources from "./ResearchSources";
import { EASE } from "../ink/tokens";

/* ─────────────────────────────────────────────────────────────────────
   InkWell AI — the copilot column's first tab.

   Everything dynamic (chat thread, running action, suggestion card, the
   analysis meters, research results) is page state rendered through these
   props; nothing here listens to Quill or keeps its own copy of the draft.

   Honesty contract, mirrored from the service:
     - aiConfigured is tri-state: null = the status probe hasn't answered
       yet (render the online shell), false = the server has no provider
       (offline notice, actions disabled), true = ready. A failed probe
       reports false — never fake-online.
     - A failed run opens an error card that says exactly what happened and
       offers a retry. Nothing ever fakes an output.
     - A result NEVER touches the editor by itself: it opens a suggestion
       card with Accept / Insert / Replace / Copy / Dismiss.
     - Analysis meters read "Not analyzed yet" until a real run returns.
   ───────────────────────────────────────────────────────────────────── */

const SNAP = { duration: 0.22, ease: EASE };

const MODE_LABEL = { replace: "Replace selection", insert: "Insert at cursor" };

// The first grid: the eight actions that were already there. Everything
// newer lives under "More AI actions" so the familiar surface stays put.
const ASSIST_ACTIONS = AI_ACTIONS.filter((a) => (a.group || "assist") === "assist");
const MORE_ACTIONS = AI_ACTIONS.filter(
  (a) => (a.group || "assist") !== "assist" && !a.menuOnly
);

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
  aiError,
  onRetryAi,
  chatSeed,
  researchConfigured,
  researchBusy,
  sources,
  researchError,
  savedUrls,
  onInsertCitation,
  onToggleSaveSource,
}) => {
  const [draft, setDraft] = useState("");
  const [howOpen, setHowOpen] = useState(false);
  // An action with choices (Change Tone, Simplify, Brainstorm) opens a chip
  // row instead of firing straight away.
  const [pendingParam, setPendingParam] = useState(null);
  const threadRef = useRef(null);
  const inputRef = useRef(null);

  // Keep the newest chat turn in view as the thread grows.
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.messages.length, chat.busy]);

  // The offline notice owns the failures it explains; once a run starts the
  // chip row shouldn't linger over it.
  useEffect(() => {
    if (runningAction) setPendingParam(null);
  }, [runningAction]);

  // "Ask AI" from the text-selection menu seeds the input with the passage.
  // The seed is a fresh object each time, so a repeat seed still lands.
  useEffect(() => {
    if (chatSeed?.text) {
      setDraft(chatSeed.text);
      inputRef.current?.focus();
    }
  }, [chatSeed]);

  useEffect(() => {
    if (!pendingParam) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setPendingParam(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pendingParam]);

  const submitChat = () => {
    const text = draft.trim();
    if (!text || chat.busy || aiConfigured === false) return;
    setDraft("");
    onSendChat(text);
  };

  const onKeyDownChat = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitChat();
    }
  };

  const running = chat.busy || Boolean(runningAction) || researchBusy;
  const aiOff = aiConfigured === false;

  const runQuick = (action, param) => {
    setPendingParam(null);
    onQuickAction(action.id, param);
  };

  const renderAction = (action) => {
    const Icon = aiActionIcon(action.id);
    const isRunning = runningAction === action.id;
    // Research can still run without a language model (the server falls back
    // to the provider's own snippet), so it isn't gated by aiOff.
    const isResearch = action.kind === "research";
    const disabled = isRunning
      ? false
      : Boolean(runningAction) || researchBusy || (aiOff && !isResearch);
    return (
      <button
        key={action.id}
        type="button"
        className={`ist-quick${isRunning ? " is-running" : ""}`}
        onClick={() => (action.param ? setPendingParam(action) : runQuick(action))}
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
  };

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

      {/* aiConfigured === null means the probe hasn't answered yet — we show
          the online shell rather than flashing an offline notice that may be
          wrong. Only a definite "no provider" renders the notice. */}
      {aiOff ? (
        <div className="ist-ai-offline" role="status">
          <CloudOffIcon className="ist-ai-offline-icon" />
          <div className="ist-ai-offline-text">
            <strong>AI is currently unavailable.</strong>
            <span>Your draft is safe. Try again later.</span>
          </div>
          <p className="ist-ai-offline-hint">
            No AI provider is connected on this server. Set AI_PROVIDER and a provider key
            server-side to bring the copilot online.
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
          ref={inputRef}
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
          disabled={!draft.trim() || chat.busy || aiOff}
          aria-label="Send to InkWell AI"
        >
          <SendIcon />
        </button>
      </div>

      {/* ── Quick actions: the 2×4 assist grid ──────────────────────────── */}
      <p className="ist-ai-eyebrow">Quick actions</p>
      <div className="ist-quick-grid" role="group" aria-label="AI quick actions">
        {ASSIST_ACTIONS.map(renderAction)}
      </div>

      {/* ── More AI actions: rewrite / edit / generate ──────────────────── */}
      <p className="ist-ai-eyebrow">More AI actions</p>
      <div className="ist-quick-grid" role="group" aria-label="More AI actions">
        {MORE_ACTIONS.map(renderAction)}
      </div>

      {/* ── Parameter picker (tone, simplify level, brainstorm lens) ────── */}
      <AnimatePresence initial={false}>
        {pendingParam ? (
          <motion.div
            key={pendingParam.id}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={SNAP}
            className="ist-param"
            role="radiogroup"
            aria-label={pendingParam.param.label}
          >
            <p className="ist-param-label">{pendingParam.param.label}</p>
            <div className="ist-param-chips">
              {pendingParam.param.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="ist-param-chip"
                  onClick={() => runQuick(pendingParam, option)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button type="button" className="ist-param-cancel" onClick={() => setPendingParam(null)}>
              Cancel
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ── Research sources: real results, or an honest unavailable state ─ */}
      <ResearchSources
        sources={sources}
        busy={researchBusy}
        error={researchError}
        configured={researchConfigured}
        savedUrls={savedUrls}
        onRetry={() => onQuickAction("research")}
        onInsertCitation={onInsertCitation}
        onToggleSave={onToggleSaveSource}
      />

      {/* ── Failure card: exactly what happened, plus a way back ─────────── */}
      <AnimatePresence initial={false}>
        {aiError ? (
          <motion.div
            key="ai-error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={SNAP}
            className="ist-ai-error"
            role="alert"
          >
            <p className="ist-ai-error-title">InkWell AI couldn't complete that request.</p>
            <p className="ist-ai-error-note">Your draft is safe.</p>
            <button type="button" className="ist-suggest-ghost" onClick={onRetryAi}>
              <RefreshIcon />
              Try again
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

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

            {/* Copy-mode results (headlines, excerpts) are text to take away —
                there is no correct place in the draft for them, so they get
                Copy and Dismiss only. */}
            {suggestion.mode === "copy" ? (
              <div className="ist-suggestion-actions">
                <button
                  type="button"
                  className="ist-suggest-btn"
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
            ) : (
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
                {/* The extra application path matches the suggestion's own
                    mode: a whole-slice edit offers Replace, a cursor addition
                    offers Insert. Accept always means "use the natural
                    application". */}
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
            )}
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
