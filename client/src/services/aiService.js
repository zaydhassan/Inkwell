// ─────────────────────────────────────────────────────────────────────
//  InkWell AI — the writing copilot's service layer.
//
//  A single, provider-agnostic entry point (runAiRequest) that every AI
//  surface on the Write page goes through, plus AI_ACTIONS — the extensible
//  registry of quick actions and how each one turns the writer's current
//  context into a system/user prompt pair.
//
//  Provider selection is env-driven, never hardcoded:
//    VITE_AI_PROVIDER  "openai" | "gemini" | "anthropic" | "proxy"
//    VITE_AI_API_KEY   the provider key — read at build time, not committed
//                      here; the abstraction only ever reads import.meta.env
//    VITE_AI_MODEL     e.g. "gpt-4o-mini", "gemini-2.0-flash", "claude-3-5-haiku"
//    VITE_AI_BASE_URL  your own backend proxy (preferred for production: keys
//                      stay server-side). Receives POST { action, system,
//                      prompt } and answers { output }.
//
//  Honesty rules this module enforces for its callers:
//    - isAiConfigured() tells the UI whether anything is set up at all.
//    - Requests NEVER resolve with fake text. An unconfigured service, a
//      failing key, a timeout — every failure returns { ok: false, reason }
//      so the UI can say "AI is currently unavailable" truthfully.
// ─────────────────────────────────────────────────────────────────────

const CONFIG = {
  provider: (import.meta.env.VITE_AI_PROVIDER || "").trim().toLowerCase(),
  apiKey: (import.meta.env.VITE_AI_API_KEY || "").trim(),
  model: (import.meta.env.VITE_AI_MODEL || "").trim(),
  proxyUrl: (import.meta.env.VITE_AI_BASE_URL || "").trim(),
  timeoutMs: 45000,
};

// True only when the deploy has actually pointed the service at something.
// The UI gates every AI affordance's honest copy off this, so a bare install
// renders "not connected" instead of a chat that pretends.
export const isAiConfigured = () =>
  Boolean(CONFIG.proxyUrl) || Boolean(CONFIG.provider && CONFIG.apiKey);

const REQUEST_TIMEOUT_MS = 45000;

/* Normalised fetch with a timeout — every provider path shares this. */
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
      try {
        const errBody = await res.json();
        detail = errBody?.error?.message || errBody?.error || errBody?.message || "";
      } catch {
        // Non-JSON error body — the status code is message enough.
      }
      return { ok: false, reason: "http", detail: `${res.status}${detail ? ` — ${detail}` : ""}` };
    }
    return { ok: true, data: await res.json() };
  } catch (err) {
    if (err?.name === "AbortError") return { ok: false, reason: "timeout" };
    return { ok: false, reason: "network" };
  }
};

/* Pull the plain completion text out of whichever provider shape answered. */
const extractText = (data) => {
  if (typeof data?.output === "string") return data.output; // proxy contract
  if (typeof data?.text === "string") return data.text;
  if (typeof data?.output_text === "string") return data.output_text; // OpenAI Responses
  const choice = data?.choices?.[0]?.message?.content; // OpenAI chat
  if (typeof choice === "string") return choice;
  const gemini = data?.candidates?.[0]?.content?.parts
    ?.map((p) => p?.text || "")
    .join(""); // Gemini generateContent
  if (gemini) return gemini;
  const anthropic = data?.content?.map((b) => b?.text || "").join(""); // Anthropic messages
  if (anthropic) return anthropic;
  return "";
};

/* The one call everything funnels through. */
export const runAiRequest = async ({ system, messages }) => {
  if (!isAiConfigured()) {
    return { ok: false, reason: "unconfigured" };
  }
  const last = messages[messages.length - 1]?.content || "";
  const history = messages.length > 1 ? messages.slice(0, -1) : [];

  let result;
  if (CONFIG.proxyUrl) {
    result = await postJson(
      CONFIG.proxyUrl,
      { ...(CONFIG.apiKey ? { Authorization: `Bearer ${CONFIG.apiKey}` } : {}) },
      { system, prompt: last, history }
    );
  } else if (CONFIG.provider === "openai") {
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
  } else if (CONFIG.provider === "anthropic") {
    result = await postJson(
      "https://api.anthropic.com/v1/messages",
      {
        "x-api-key": CONFIG.apiKey,
        "anthropic-version": "2023-06-01",
        // Anthropic requires an explicit opt-in for direct browser calls; our
        // client-side provider path sets it so the key in VITE_AI_API_KEY can
        // be used. A VITE_AI_BASE_URL proxy is the safer production route.
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
  } else {
    return { ok: false, reason: "unconfigured" };
  }

  if (!result.ok) return result;

  const text = extractText(result.data).trim();
  if (!text) return { ok: false, reason: "bad-response" };
  return { ok: true, text };
};

/* ─── Quick actions ────────────────────────────────────────────────────
   `target` is the context slice the action needs (routed by the UI):
     selection  — highlighted text if any, else the current paragraph
     paragraph  — the paragraph the caret sits in
     article    — the whole draft
   `mode` is how a result is meant to be applied:
     replace    — Original vs Suggested; Replace swaps the source text
     insert     — Insert at the caret (new content)
     note       — commentary for the writer (Copy only)
   ───────────────────────────────────────────────────────────────────── */

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
    buildPrompt: (c) =>
      `Title: ${c.title || "(untitled)"}\n\nDraft so far:\n${c.articleText}`,
  },
  {
    id: "tone",
    title: "Change Tone",
    desc: "Tone & style",
    target: "selection",
    mode: "replace",
    system:
      "You are InkWell's writing copilot. Recast the passage below in a warmer, more conversational tone while keeping every fact it states. Return ONLY the recast passage.",
    buildPrompt: (c) => `Passage to recast:\n${c.slice}`,
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
    buildPrompt: (c) =>
      `Title: ${c.title || "(untitled)"}\n\nDraft:\n${c.articleText}`,
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
    desc: "Credible references",
    target: "article",
    mode: "note",
    system:
      "You are InkWell's research assistant. Suggest the 4-6 kinds of credible sources and datasets one should consult to ground this draft, one bullet each. You do not have web access: describe the source type and what it would verify, and never invent citations.",
    buildPrompt: (c) => `Topic: ${c.title || c.topic}\n\nDraft:\n${c.articleText}`,
  },
];

export const findAiAction = (id) => AI_ACTIONS.find((a) => a.id === id);

/* Route an action id to its provider call with the right context slice. */
export const runAiAction = async (actionId, ctx) => {
  const action = findAiAction(actionId);
  if (!action) return { ok: false, reason: "bad-action" };
  return runAiRequest({ system: action.system, messages: [{ role: "user", content: action.buildPrompt(ctx) }] });
};

/* ─── Draft analysis (AI Insights + suggested enhancements) ──────────── */

const ANALYZE_SYSTEM =
  "You are InkWell's writing analyst. Analyse the draft and reply with ONLY minified JSON, no markdown fence, in this exact shape: " +
  '{"clarity":0-100,"readability":0-100,"originality":0-100,' +
  '"enhancements":[{"area":"short area name","note":"one-sentence suggestion","rewrite":"optional improved text"}]}. ' +
  'Originality is how distinctive the take is for its category. 2-4 enhancements, concrete and specific.';

export const runDraftAnalysis = async (ctx) => {
  const res = await runAiRequest({
    system: ANALYZE_SYSTEM,
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
    messages: [...history, { role: "user", content: contextNote + question }],
  });
};