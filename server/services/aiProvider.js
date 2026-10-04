// ─────────────────────────────────────────────────────────────────────
//  InkWell AI — the server-side provider abstraction.
//
//  The browser must never hold a provider key, so every model call the
//  writing studio makes is proxied through here. This module is the only
//  place that reads the real key, and it is dependency-free: Node 20's
//  global fetch + AbortController are enough, matching the project's
//  no-SDK style (the client's aiService.js does the same).
//
//  Provider selection is env-driven, never hardcoded:
//    AI_PROVIDER     "openai" | "gemini" | "anthropic"
//                    (auto-detects the first provider that has a key)
//    <P>_API_KEY     OPENAI_API_KEY | GEMINI_API_KEY | ANTHROPIC_API_KEY
//                    (falls back to a generic AI_API_KEY)
//    <P>_MODEL       OPENAI_MODEL | GEMINI_MODEL | ANTHROPIC_MODEL
//                    (falls back to AI_MODEL, then a sensible default)
//    AI_TIMEOUT_MS   upstream timeout — default 25000, deliberately BELOW
//                    the client's 45s so the server owns the failure path
//    AI_MAX_TOKENS   default max_tokens for a completion
//    AI_CACHE_TTL_MS in-process response cache TTL (default 10 min)
//
//  Honesty contract: a call NEVER resolves with fabricated text. Anything
//  that isn't a real completion — no key, timeout, upstream error, empty
//  body — returns { ok: false, reason } so the caller can say so.
// ─────────────────────────────────────────────────────────────────────

const crypto = require("crypto");

const PROVIDERS = {
  openai: {
    keyEnv: "OPENAI_API_KEY",
    modelEnv: "OPENAI_MODEL",
    defaultModel: "gpt-4o-mini",
  },
  gemini: {
    keyEnv: "GEMINI_API_KEY",
    modelEnv: "GEMINI_MODEL",
    defaultModel: "gemini-2.0-flash",
  },
  anthropic: {
    keyEnv: "ANTHROPIC_API_KEY",
    modelEnv: "ANTHROPIC_MODEL",
    defaultModel: "claude-3-5-haiku-20241022",
  },
};

const PROVIDER_NAMES = Object.keys(PROVIDERS);

const providerKey = (name) =>
  (process.env[PROVIDERS[name].keyEnv] || process.env.AI_API_KEY || "").trim();

const providerModel = (name) =>
  (process.env[PROVIDERS[name].modelEnv] || process.env.AI_MODEL || "").trim() ||
  PROVIDERS[name].defaultModel;

const timeoutMs = () => Number(process.env.AI_TIMEOUT_MS) || 25000;
const defaultMaxTokens = () => Number(process.env.AI_MAX_TOKENS) || 1600;
const cacheTtlMs = () => Number(process.env.AI_CACHE_TTL_MS) || 10 * 60 * 1000;

/* Which provider answers: the one named by AI_PROVIDER if it has a key,
   otherwise the first configured one. Returns null when nothing is set. */
const resolveProvider = () => {
  const named = (process.env.AI_PROVIDER || "").trim().toLowerCase();
  if (PROVIDER_NAMES.includes(named) && providerKey(named)) return named;
  return PROVIDER_NAMES.find((name) => providerKey(name)) || null;
};

const isProviderConfigured = () => Boolean(resolveProvider());

/* Booleans only — this is returned to the browser, so it must never leak
   key material or model ids the operator didn't already publish. */
const providerStatus = () => ({
  configured: isProviderConfigured(),
  provider: resolveProvider(),
  providers: PROVIDER_NAMES.reduce((acc, name) => {
    acc[name] = Boolean(providerKey(name));
    return acc;
  }, {}),
});

/* Pull the plain completion text out of whichever provider shape answered —
   the same acceptance list as the client's aiService.extractText, so a
   response that works against one side works against the other. */
const extractText = (data) => {
  if (typeof data?.output === "string") return data.output;
  if (typeof data?.text === "string") return data.text;
  if (typeof data?.output_text === "string") return data.output_text;
  const choice = data?.choices?.[0]?.message?.content;
  if (typeof choice === "string") return choice;
  const gemini = data?.candidates?.[0]?.content?.parts?.map((p) => p?.text || "").join("");
  if (gemini) return gemini;
  const anthropic = data?.content?.map((b) => b?.text || "").join("");
  if (anthropic) return anthropic;
  return "";
};

/* Upstream error bodies can echo the request (and, defensively, anything
   key-shaped). Keep one short, newline-free line for the client. */
const safeDetail = (body, status) => {
  const raw =
    body?.error?.message || (typeof body?.error === "string" ? body.error : "") || body?.message || "";
  const oneLine = String(raw).replace(/\s+/g, " ").trim().slice(0, 300);
  return oneLine ? `${status} — ${oneLine}` : String(status);
};

/* ── In-process response cache ────────────────────────────────────────
   Re-running the same action on unchanged text (a very common writer
   behaviour) shouldn't bill a second call. Keyed by the full request, so a
   hit can only ever return the exact text that request produced — it never
   invents anything and never touches disk. Bounded so memory can't grow. */
const cache = new Map();
const CACHE_MAX = 200;

const cacheKey = (provider, model, req) =>
  crypto
    .createHash("sha256")
    .update([provider, model, req.system || "", req.prompt, JSON.stringify(req.history || []), req.temperature ?? ""].join("\u0000"))
    .digest("hex");

const cacheGet = (key) => {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > cacheTtlMs()) {
    cache.delete(key);
    return null;
  }
  return hit.text;
};

const cacheSet = (key, text) => {
  if (cache.size >= CACHE_MAX) {
    // Drop the oldest entry (Map preserves insertion order).
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, { text, at: Date.now() });
};

/* Build the provider-specific request. Bodies mirror the client's direct
   calls, except Anthropic's browser-only danger header, which a server-side
   call must not send. */
const buildRequest = (provider, model, key, { system, prompt, history, maxTokens, temperature }) => {
  const messages = [...history, { role: "user", content: prompt }];
  if (provider === "openai") {
    return {
      url: "https://api.openai.com/v1/chat/completions",
      headers: { Authorization: `Bearer ${key}` },
      body: {
        model,
        max_tokens: maxTokens,
        ...(temperature !== undefined ? { temperature } : {}),
        messages: [...(system ? [{ role: "system", content: system }] : []), ...messages],
      },
    };
  }
  if (provider === "gemini") {
    return {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent?key=${encodeURIComponent(key)}`,
      headers: {},
      body: {
        ...(system ? { system_instruction: { parts: [{ text: system }] } } : {}),
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          maxOutputTokens: maxTokens,
          ...(temperature !== undefined ? { temperature } : {}),
        },
      },
    };
  }
  // anthropic
  return {
    url: "https://api.anthropic.com/v1/messages",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: {
      model,
      max_tokens: maxTokens,
      ...(temperature !== undefined ? { temperature } : {}),
      ...(system ? { system } : {}),
      messages,
    },
  };
};

/**
 * Run one completion. Always resolves — never throws at the caller.
 * @returns {{ok:true, text:string, provider:string} | {ok:false, reason:string, detail?:string}}
 */
const complete = async ({ system = "", prompt, history = [], maxTokens, temperature } = {}) => {
  const provider = resolveProvider();
  if (!provider) return { ok: false, reason: "unconfigured" };
  const key = providerKey(provider);
  if (!key) return { ok: false, reason: "unconfigured" };

  const model = providerModel(provider);
  const req = {
    system,
    prompt: String(prompt || ""),
    history,
    maxTokens: maxTokens || defaultMaxTokens(),
    temperature,
  };

  const keyHash = cacheKey(provider, model, req);
  const cached = cacheGet(keyHash);
  if (cached !== null) return { ok: true, text: cached, provider };

  const { url, headers, body } = buildRequest(provider, model, key, req);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());
  if (typeof timer.unref === "function") timer.unref();

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (err?.name === "AbortError") return { ok: false, reason: "timeout" };
    return { ok: false, reason: "upstream", detail: "network" };
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    // A 401/403 from upstream means a bad/expired key — still an upstream
    // failure, never reported as "configured but working".
    return { ok: false, reason: "upstream", detail: safeDetail(data, res.status) };
  }

  const text = extractText(data).trim();
  if (!text) return { ok: false, reason: "bad-response" };

  cacheSet(keyHash, text);
  return { ok: true, text, provider };
};

module.exports = {
  complete,
  resolveProvider,
  isProviderConfigured,
  providerStatus,
  extractText,
};
