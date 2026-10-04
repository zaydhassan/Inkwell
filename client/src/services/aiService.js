// ─────────────────────────────────────────────────────────────────────
//  InkWell AI — the writing copilot's service layer.
//
//  A single, provider-agnostic entry point (runAiRequest) that every AI
//  surface goes through, plus AI_ACTIONS — the extensible registry of quick
//  actions and how each turns the writer's context into a prompt.
//
//  Transport is chosen at call time:
//    1. VITE_AI_BASE_URL, if set explicitly — a proxy you own.
//    2. Otherwise the server's built-in proxy at the RELATIVE path
//       /api/v1/ai/complete. The real provider key lives on the server and
//       never ships to the browser; these calls go through the app's axios
//       instance, so they carry the access token and silently refresh it.
//    3. A direct provider (VITE_AI_PROVIDER + VITE_AI_API_KEY) for local
//       experiments only — the key would ship in the bundle.
//
//  Honesty rules this module enforces for its callers:
//    - fetchAiStatus() is the authoritative online/offline signal.
//    - Requests NEVER resolve with fake text. Unconfigured, failing, or
//      timed-out calls return { ok: false, reason } so the UI can say
//      "AI is currently unavailable" truthfully.
// ─────────────────────────────────────────────────────────────────────

import axios from "axios";

const env = import.meta.env;

const CONFIG = {
  provider: (env.VITE_AI_PROVIDER || "").trim().toLowerCase(),
  apiKey: (env.VITE_AI_API_KEY || "").trim(),
  model: (env.VITE_AI_MODEL || "").trim(),
  explicitProxy: (env.VITE_AI_BASE_URL || "").trim(),
  timeoutMs: 45000,
};

// The server proxy is always available at a relative path — no build-time
// variable required (the Docker client build has no VITE_* AI env).
const PROXY_URL = CONFIG.explicitProxy || "/api/v1/ai/complete";
const STATUS_URL = "/api/v1/ai/status";
const RESEARCH_URL = "/api/v1/ai/research";

const directConfigured = () =>
  ["openai", "gemini", "anthropic"].includes(CONFIG.provider) && Boolean(CONFIG.apiKey);

// A transport exists whenever the proxy does (always) or a direct provider is
// set. The authoritative "is a provider actually configured?" answer comes
// from fetchAiStatus() — this is only about whether we have something to call.
export const isAiConfigured = () => Boolean(CONFIG.explicitProxy) || directConfigured() || true;

/* ── Transport ─────────────────────────────────────────────────────── */

const REQUEST_TIMEOUT_MS = 45000;

// Normalise an axios failure into the shared reason vocabulary so every
// caller can branch on `reason` without knowing which transport ran.
const mapAxiosError = (err) => {
  if (
    err?.code === "ECONNABORTED" ||
    err?.name === "CanceledError" ||
    err?.name === "AbortError"
  ) {
    return { ok: false, reason: "timeout" };
  }
  const status = err?.response?.status;
  const data = err?.response?.data;
  if (data?.reason) return { ok: false, reason: data.reason, status, detail: data.message };
  if (!err?.response) return { ok: false, reason: "network" };
  return { ok: false, reason: "http", status, detail: data?.message || "" };
};

// Direct-provider path (dev only): raw fetch, since these must NOT inherit
// the app JWT / 401-redirect behaviour.
const postJson = async (url, headers, body) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      let detail = "";
      let reason;
      try {
        const errBody = await res.json();
        detail = errBody?.error?.message || errBody?.error || errBody?.message || "";
        reason = errBody?.reason;
      } catch {
        // Non-JSON error body — the status code is message enough.
      }
      return { ok: false, reason: reason || "http", status: res.status, detail: `${res.status}${detail ? ` — ${detail}` : ""}` };
    }
    return { ok: true, data: await res.json() };
  } catch (err) {
    if (err?.name === "AbortError") return { ok: false, reason: "timeout" };
    return { ok: false, reason: "network" };
  } finally {
    clearTimeout(timer);
  }
};

// Proxy path: reuse the shared axios instance so the auth interceptor
// attaches the token and refreshes it on 401.
const postProxy = async (url, payload) => {
  try {
    const { data } = await axios.post(url, payload, { timeout: REQUEST_TIMEOUT_MS });
    return { ok: true, data };
  } catch (err) {
    return mapAxiosError(err);
  }
};

// Pull the plain completion text out of whichever provider shape answered.
const extractText = (data) => {
  if (typeof data?.output === "string") return data.output; // our server proxy
  if (typeof data?.text === "string") return data.text;
  if (typeof data?.output_text === "string") return data.output_text; // OpenAI Responses
  const choice = data?.choices?.[0]?.message?.content; // OpenAI chat
  if (typeof choice === "string") return choice;
  const gemini = data?.candidates?.[0]?.content?.parts?.map((p) => p?.text || "").join(""); // Gemini
  if (gemini) return gemini;
  const anthropic = data?.content?.map((b) => b?.text || "").join(""); // Anthropic messages
  if (anthropic) return anthropic;
  return "";
};

/* The one call everything funnels through. */
export const runAiRequest = async ({ system, messages, action, maxTokens, temperature }) => {
  const last = messages[messages.length - 1]?.content || "";
  const history = messages.length > 1 ? messages.slice(0, -1) : [];

  let result;
  if (!CONFIG.explicitProxy && directConfigured()) {
    if (CONFIG.provider === "openai") {
      result = await postJson(
        "https://api.openai.com/v1/chat/completions",
        { Authorization: `Bearer ${CONFIG.apiKey}` },
        {
          model: CONFIG.model || "gpt-4o-mini",
          messages: [
            ...(system ? [{ role: "system", content: system }] : []),
            ...history.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: last },
          ],
        }
      );
    } else if (CONFIG.provider === "gemini") {
      result = await postJson(
        `https://generativelanguage.googleapis.com/v1beta/models/${
          CONFIG.model || "gemini-2.0-flash"
        }:generateContent?key=${encodeURIComponent(CONFIG.apiKey)}`,
        {},
        {
          ...(system ? { system_instruction: { parts: [{ text: system }] } } : {}),
          contents: [...history, { role: "user", parts: [{ text: last }] }].map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
        }
      );
    } else {
      result = await postJson(
        "https://api.anthropic.com/v1/messages",
        {
          "x-api-key": CONFIG.apiKey,
          "anthropic-version": "2023-06-01",
          // Anthropic requires an explicit opt-in for direct browser calls.
          "anthropic-dangerous-direct-browser-access": "true",
        },
        {
          model: CONFIG.model || "claude-3-5-haiku-20241022",
          max_tokens: 1600,
          ...(system ? { system } : {}),
          messages: [...history, { role: "user", content: last }].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }
      );
    }
  } else {
    // Server proxy — the production path. Only the fields the server reads.
    result = await postProxy(PROXY_URL, {
      system,
      prompt: last,
      history,
      ...(action ? { action } : {}),
      ...(maxTokens ? { maxTokens } : {}),
      ...(temperature !== undefined ? { temperature } : {}),
    });
  }

  if (!result.ok) return result;

  const text = extractText(result.data).trim();
  if (!text) return { ok: false, reason: "bad-response" };
  return { ok: true, text };
};

/* ── Status probe ──────────────────────────────────────────────────────
   The server knows whether a provider key is set; the client cannot. This
   is the honest online/offline signal the studio renders from. A failed
   probe is reported offline, never fake-online. */
export const fetchAiStatus = async () => {
  try {
    const { data } = await axios.get(STATUS_URL, { timeout: 8000 });
    return {
      ok: true,
      configured: Boolean(data?.configured),
      provider: data?.provider || null,
      research: data?.research || { configured: false, provider: null },
    };
  } catch {
    return { ok: false, configured: false, provider: null, research: { configured: false, provider: null } };
  }
};

/* ─── Quick actions ────────────────────────────────────────────────────
   `target` is the context slice the action needs (routed by the UI):
     selection  — highlighted text if any, else the current paragraph
     article    — the whole draft
   `mode` is how a result is meant to be applied:
     replace    — Original vs Suggested; Replace swaps the source text
     insert     — Insert at the caret (new content)
     note       — commentary for the writer (Copy only)
     copy       — text to copy (titles, excerpts); never touches the draft
   `param` (optional) describes a picker — tone, simplify level, lens. Its
   chosen option is passed to `system`/`buildPrompt` as the second argument;
   actions without `param` ignore it. `group`/`menuOnly` shape the UI only.
   ───────────────────────────────────────────────────────────────────── */

export const TONE_OPTIONS = [
  { id: "professional", label: "Professional", prompt: "a polished, professional tone suited to a business or industry audience" },
  { id: "conversational", label: "Conversational", prompt: "a relaxed, conversational tone, as if talking to a friend" },
  { id: "academic", label: "Academic", prompt: "a formal, academic tone with measured, evidence-aware phrasing" },
  { id: "friendly", label: "Friendly", prompt: "a warm, friendly tone that feels welcoming" },
  { id: "persuasive", label: "Persuasive", prompt: "a persuasive tone that builds a clear case for the author's view" },
  { id: "storytelling", label: "Storytelling", prompt: "a storytelling tone, using narrative momentum and concrete imagery" },
  { id: "technical", label: "Technical", prompt: "a precise, technical tone for a specialist audience" },
  { id: "simple", label: "Simple", prompt: "a deliberately simple tone, using plain words and short sentences" },
  { id: "bold", label: "Bold", prompt: "a bold, confident tone with direct, punchy statements" },
  { id: "editorial", label: "Editorial", prompt: "an editorial tone — authoritative and opinionated but fair" },
];

export const SIMPLIFY_OPTIONS = [
  { id: "beginner", label: "Beginner", grade: "use short sentences, everyday words, and a 6th–8th grade reading level" },
  { id: "intermediate", label: "Intermediate", grade: "use a clear, general-audience style at roughly a 10th-grade reading level" },
  { id: "expert", label: "Expert", grade: "use precise, field-appropriate terminology without over-explaining basics" },
];

export const AI_ACTIONS = [
  {
    id: "improve",
    title: "Improve Writing",
    desc: "Clearer & sharper",
    target: "selection",
    mode: "replace",
    system:
      "You are InkWell's writing copilot. Rewrite the given passage so it is clearer, sharper, and reads naturally for a blog audience. Keep the author's meaning and voice. Return ONLY the rewritten passage — no preamble, no quotes around it, no markdown fence.",
    buildPrompt: (c) => `Passage to rewrite:\n${c.slice}`,
  },
  {
    id: "continue",
    title: "Continue Writing",
    desc: "Pick up where left off",
    target: "article",
    mode: "insert",
    system:
      "You are InkWell's writing copilot. Continue the draft below by writing the next 2-4 sentences in the same voice and register. Do not repeat what is already there. Return ONLY the new continuation sentences.",
    buildPrompt: (c) => `Title: ${c.title || "(untitled)"}\n\nDraft so far:\n${c.articleText}`,
  },
  {
    id: "tone",
    title: "Change Tone",
    desc: "Tone & style",
    target: "selection",
    mode: "replace",
    param: { name: "tone", label: "Choose a tone", options: TONE_OPTIONS },
    system: (p) =>
      `You are InkWell's writing copilot. Recast the passage below in ${
        p?.prompt || "a polished, professional tone"
      } while keeping every fact it states and the author's meaning. Return ONLY the recast passage — no preamble, no quotes.`,
    buildPrompt: (c, p) => `Passage to recast (${p?.label || "Professional"}):\n${c.slice}`,
  },
  {
    id: "summarize",
    title: "Summarize",
    desc: "Concise version",
    target: "article",
    mode: "insert",
    system:
      "You are InkWell's writing copilot. Summarize the draft below in 2-3 tight sentences a reader could use as a standfirst. Return ONLY the summary.",
    buildPrompt: (c) => `Draft to summarize:\n${c.articleText}`,
  },
  {
    id: "challenge",
    title: "Challenge My Idea",
    desc: "Critical feedback",
    target: "article",
    mode: "note",
    system:
      "You are InkWell's thoughtful editor. Give critical feedback on the draft below: name its strongest claim, then the weakest point in its argument, and one concrete objection a skeptical reader would raise. Be specific and brief — 3 short sentences max.",
    buildPrompt: (c) => `Title: ${c.title || "(untitled)"}\n\nDraft:\n${c.articleText}`,
  },
  {
    id: "factcheck",
    title: "Fact Check",
    desc: "Verify claims",
    target: "article",
    mode: "note",
    system:
      "You are InkWell's research assistant. List every checkable factual claim in the draft below, each on one line starting with a bullet, with a verdict: plausible / needs a source / likely wrong. Do not invent sources.",
    buildPrompt: (c) => `Draft:\n${c.articleText}`,
  },
  {
    id: "outline",
    title: "Generate Outline",
    desc: "Structured outline",
    target: "article",
    mode: "insert",
    system:
      "You are InkWell's writing copilot. Produce a short structured outline (4-6 headings, one line under each) for a blog post about the subject below. Return ONLY the outline as plain lines, with '## ' headings.",
    buildPrompt: (c) =>
      `Title: ${c.title || "(untitled)"}\nCategory: ${c.category || "—"}\nNotes so far:\n${c.articleText || c.topic || c.title}`,
  },
  {
    id: "research",
    title: "Research Sources",
    desc: "Real sources from the web",
    target: "article",
    mode: "note",
    kind: "research", // handled by runResearch, not runAiAction
    system: "",
    buildPrompt: (c) => c.title || c.articleText || "",
  },

  // ── Edit-group actions (shown under "More AI actions") ──────────────
  {
    id: "rewrite",
    title: "Rewrite",
    desc: "Fresh phrasing",
    target: "selection",
    mode: "replace",
    group: "edit",
    system:
      "You are InkWell's writing copilot. Rewrite the passage below from scratch so it is clearer, more engaging, and flows better, while preserving the author's meaning, facts, and voice. Do not add new claims. Return ONLY the rewritten passage — no preamble, no quotes, no markdown fence.",
    buildPrompt: (c) => `Passage to rewrite:\n${c.slice}`,
  },
  {
    id: "shorter",
    title: "Make Shorter",
    desc: "Tighter, same meaning",
    target: "selection",
    mode: "replace",
    group: "edit",
    system:
      "You are InkWell's writing copilot. Tighten the passage below to roughly half its length. Cut redundancy, filler, and hedging while keeping every essential fact and the author's voice. Return ONLY the shortened passage — no preamble, no quotes.",
    buildPrompt: (c) => `Passage to shorten:\n${c.slice}`,
  },
  {
    id: "longer",
    title: "Make Longer",
    desc: "More depth & detail",
    target: "selection",
    mode: "replace",
    group: "edit",
    system:
      "You are InkWell's writing copilot. Expand the passage below with concrete detail, examples, or explanation that support what it already says. Add no invented facts, statistics, or quotes. Roughly double its length. Return ONLY the expanded passage — no preamble, no quotes.",
    buildPrompt: (c) => `Passage to expand:\n${c.slice}`,
  },
  {
    id: "simplify",
    title: "Simplify",
    desc: "Plain-language rewrite",
    target: "selection",
    mode: "replace",
    group: "edit",
    param: { name: "level", label: "Explain at which level?", options: SIMPLIFY_OPTIONS },
    system: (p) =>
      `You are InkWell's writing copilot. Rewrite the passage below for a ${
        p?.label || "Intermediate"
      } reader — ${p?.grade || "a clear, general-audience style"}. Keep every fact and the author's meaning; do not add new claims. Return ONLY the simplified passage — no preamble, no quotes.`,
    buildPrompt: (c, p) => `Passage to simplify (${p?.label || "Intermediate"}):\n${c.slice}`,
  },
  {
    id: "grammar",
    title: "Fix Grammar",
    desc: "Spelling & punctuation",
    target: "selection",
    mode: "replace",
    group: "edit",
    system:
      "You are InkWell's copy editor. Fix grammar, spelling, punctuation, and obvious typos in the passage below. Preserve the author's wording and voice — change only what is incorrect. Return ONLY the corrected passage — no preamble, no explanation, no quotes.",
    buildPrompt: (c) => `Passage to correct:\n${c.slice}`,
  },
  {
    id: "explain",
    title: "Explain",
    desc: "What this passage says",
    target: "selection",
    mode: "note",
    group: "edit",
    menuOnly: true,
    system:
      "You are InkWell's writing tutor. Explain in 2-4 plain sentences what the passage below is saying and why it works or doesn't, as if to the author. Do not rewrite it yet. Return ONLY the explanation.",
    buildPrompt: (c) => `Passage:\n${c.slice}`,
  },

  // ── Generate-group actions ──────────────────────────────────────────
  {
    id: "brainstorm",
    title: "Brainstorm",
    desc: "Ideas, angles, hooks",
    target: "article",
    mode: "note",
    group: "generate",
    param: {
      name: "lens",
      label: "What should I generate?",
      options: [
        { id: "ideas", label: "Article ideas", focus: "distinct article ideas a writer could develop" },
        { id: "angles", label: "Fresh angles", focus: "fresh angles or takes on the topic that avoid the obvious" },
        { id: "hooks", label: "Opening hooks", focus: "opening hooks — first lines that make a reader keep reading" },
      ],
    },
    system: (p) =>
      `You are InkWell's brainstorm partner. Generate 6 ${
        p?.focus || "distinct article ideas"
      } for a blog post on the subject below. One per line, each a single specific sentence — no numbering, no preamble.`,
    buildPrompt: (c) =>
      `Topic: ${c.title || c.topic || "(untitled)"}\nCategory: ${c.category || "—"}\nDraft notes:\n${
        c.articleText || c.slice || ""
      }`,
  },
  {
    id: "intro",
    title: "Generate Introduction",
    desc: "Opening paragraph",
    target: "article",
    mode: "insert",
    group: "generate",
    system:
      "You are InkWell's writing copilot. Write an opening paragraph (2-4 sentences) for the blog draft below that hooks the reader and states what the piece is about. Match the draft's voice and tone. Use only what the draft supports — invent no facts. Return ONLY the paragraph — no heading, no preamble.",
    buildPrompt: (c) => `Title: ${c.title || "(untitled)"}\nDraft:\n${c.articleText || "(empty)"}`,
  },
  {
    id: "conclusion",
    title: "Generate Conclusion",
    desc: "Closing paragraph",
    target: "article",
    mode: "insert",
    group: "generate",
    system:
      "You are InkWell's writing copilot. Write a closing paragraph (2-4 sentences) that lands the draft's main point and gives the reader a takeaway or next step. Match the draft's voice. Invent no facts. Return ONLY the paragraph — no heading, no preamble.",
    buildPrompt: (c) => `Title: ${c.title || "(untitled)"}\nDraft:\n${c.articleText || "(empty)"}`,
  },
  {
    id: "headline",
    title: "Generate Headline",
    desc: "Title options",
    target: "article",
    mode: "copy",
    group: "generate",
    system:
      "You are InkWell's headline editor. Write 5 headline options for the draft below, one per line. Each under 70 characters, specific, and free of clickbait or claims the draft does not support. Return ONLY the lines — no numbering, no preamble.",
    buildPrompt: (c) => `Draft:\n${c.articleText}`,
  },
  {
    id: "excerpt",
    title: "Generate Excerpt",
    desc: "Meta description",
    target: "article",
    mode: "copy",
    group: "generate",
    system:
      "You are InkWell's editor. Write a meta description for the draft below in 1-2 sentences, 150 characters max, that accurately summarises it and gives a reader a reason to open it. Invent nothing. Return ONLY the description.",
    buildPrompt: (c) => `Draft:\n${c.articleText}`,
  },
];

export const findAiAction = (id) => AI_ACTIONS.find((a) => a.id === id);

/* Route an action id to its provider call with the right context slice and
   the writer's chosen option (tone, simplify level, lens). */
export const runAiAction = async (actionId, ctx, param) => {
  const action = findAiAction(actionId);
  if (!action) return { ok: false, reason: "bad-action" };
  const system = typeof action.system === "function" ? action.system(param) : action.system;
  return runAiRequest({
    system,
    action: action.id,
    messages: [{ role: "user", content: action.buildPrompt(ctx, param) }],
  });
};

/* ─── Draft analysis (AI Insights + suggested enhancements) ──────────── */

const ANALYZE_SYSTEM =
  "You are InkWell's writing analyst. Analyse the draft and reply with ONLY minified JSON, no markdown fence, in this exact shape: " +
  '{"clarity":0-100,"readability":0-100,"originality":0-100,' +
  '"enhancements":[{"area":"short area name","note":"one-sentence suggestion","rewrite":"optional improved text"}]}. ' +
  "Originality is how distinctive the take is for its category. 2-4 enhancements, concrete and specific.";

export const runDraftAnalysis = async (ctx) => {
  const res = await runAiRequest({
    system: ANALYZE_SYSTEM,
    action: "analyze",
    messages: [
      {
        role: "user",
        content: `Title: ${ctx.title || "(untitled)"}\nCategory: ${
          ctx.category || "—"
        }\nTags: ${ctx.tags || "—"}\n\nDraft:\n${ctx.articleText || "(empty draft)"}`,
      },
    ],
  });
  if (!res.ok) return res;

  // Models love wrapping JSON in prose or fences — find the object regardless.
  let parsed = null;
  try {
    const start = res.text.indexOf("{");
    const end = res.text.lastIndexOf("}");
    if (start !== -1 && end > start) parsed = JSON.parse(res.text.slice(start, end + 1));
  } catch {
    parsed = null;
  }
  if (!parsed || typeof parsed.clarity !== "number") {
    return { ok: false, reason: "bad-response" };
  }
  const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
  return {
    ok: true,
    insights: {
      clarity: clamp(parsed.clarity),
      readability: clamp(parsed.readability),
      originality: clamp(parsed.originality),
    },
    enhancements: (Array.isArray(parsed.enhancements) ? parsed.enhancements : [])
      .filter((e) => e && (e.note || e.rewrite))
      .slice(0, 4)
      .map((e) => ({
        area: String(e.area || "Draft"),
        note: String(e.note || ""),
        rewrite: typeof e.rewrite === "string" ? e.rewrite : "",
      })),
  };
};

/* ─── Research Sources — real web search via the server ────────────────
   Never invents a source: with no search provider the server answers 503
   and this returns { ok:false, reason:"unconfigured" } so the UI can say
   so. Every URL is re-checked here as http(s) before it reaches the DOM. */
export const runResearch = async ({ query, context = "" }) => {
  if (!query || !query.trim()) return { ok: false, reason: "bad-request" };
  try {
    const { data } = await axios.post(
      RESEARCH_URL,
      { query: query.trim().slice(0, 500), context: context.slice(0, 8000), count: 5 },
      { timeout: 30000 }
    );
    if (!data?.success || !Array.isArray(data.sources)) return { ok: false, reason: "bad-response" };
    const sources = data.sources
      .filter((s) => s && typeof s.url === "string" && /^https?:\/\//i.test(s.url))
      .map((s) => ({
        title: String(s.title || s.url),
        publisher: String(s.publisher || ""),
        url: s.url,
        snippet: String(s.snippet || ""),
        explanation: String(s.explanation || s.snippet || ""),
        publishedDate: String(s.publishedDate || ""),
      }));
    if (!sources.length) return { ok: false, reason: "bad-response" };
    return { ok: true, sources };
  } catch (err) {
    return mapAxiosError(err);
  }
};

/* The chat thread uses the same provider; the transcript gives it memory.
   The latest question is the last entry of `transcript` and must survive the
   slicing — history is everything BEFORE it. */
export const runChatTurn = async (ctx, transcript) => {
  const history = transcript
    .slice(0, -1)
    .map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text }));
  const question = transcript[transcript.length - 1]?.text || "";
  const contextNote =
    `(Current draft — Title: ${ctx.title || "(untitled)"}; ${ctx.wordCount || 0} words. ` +
    "Use it as context when relevant, never claim edits you have not produced.)\n\n";
  return runAiRequest({
    system:
      "You are InkWell AI, a writing copilot inside a blog editor. Help the writer brainstorm, draft, edit and structure. Be concise and practical. When the writer asks you to rewrite something, return the rewritten text.",
    action: "chat",
    messages: [...history, { role: "user", content: contextNote + question }],
  });
};
