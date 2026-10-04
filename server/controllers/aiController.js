// InkWell AI endpoints. Controllers follow the house style: named exports,
// an explicit try/catch per handler (no asyncHandler), and a
// `{ success, ... }` JSON body. The provider itself never throws, so the
// only 500 paths here are genuine programming errors.
const { complete, isProviderConfigured, providerStatus, resolveProvider } = require("../services/aiProvider");
const { search, isResearchConfigured, researchStatus } = require("../services/webSearch");

/* Public, cheap, and secret-free: the client probes this to decide whether
   to render its honest offline state. Booleans only — no keys, no models. */
exports.getAiStatus = (req, res) =>
  res.status(200).json({
    success: true,
    configured: isProviderConfigured(),
    provider: resolveProvider(),
    providers: providerStatus().providers,
    research: researchStatus(),
  });

exports.complete = async (req, res) => {
  try {
    if (!isProviderConfigured()) {
      return res.status(503).json({
        success: false,
        reason: "unconfigured",
        message: "InkWell AI is not configured on the server.",
      });
    }

    const { system = "", prompt, history = [], maxTokens, temperature } = req.body;
    const result = await complete({ system, prompt, history, maxTokens, temperature });

    if (!result.ok) {
      if (result.reason === "timeout") {
        return res.status(504).json({
          success: false,
          reason: "timeout",
          message: "The AI provider took too long to respond.",
        });
      }
      if (result.reason === "bad-response") {
        return res.status(502).json({
          success: false,
          reason: "bad-response",
          message: "The AI provider returned an unusable response.",
        });
      }
      return res.status(502).json({
        success: false,
        reason: "upstream",
        message: "The AI provider could not complete that request.",
      });
    }

    return res.status(200).json({ success: true, output: result.text, provider: result.provider });
  } catch (error) {
    console.error("aiController.complete error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "InkWell AI couldn't complete that request." });
  }
};

/* One grounding call for the whole result set: each explanation may only
   restate what that source's own snippet says. If the model is unavailable
   or misbehaves, the caller keeps the raw snippet — the explanation never
   becomes a second, unverified source of facts. */
const explainSources = async (query, sources) => {
  const lines = sources
    .map((s, i) => `[${i + 1}] ${s.title}\nURL: ${s.url}\nSnippet: ${s.snippet || "(no snippet provided)"}`)
    .join("\n\n");

  const result = await complete({
    system:
      "You are InkWell's research assistant. Using ONLY the snippets provided, write one short sentence " +
      "per source explaining what it is and what it could support in an article. Never add facts, " +
      "statistics, dates, or claims that are not present in that source's snippet; if a snippet is " +
      'uninformative, say so plainly. Reply with ONLY minified JSON: [{"i":<source number>,"explanation":"..."}].',
    prompt: `Research query: ${query}\n\nSources:\n${lines}`,
    maxTokens: 700,
  });
  if (!result.ok) return { ok: false };

  // Models like to wrap JSON in prose; find the array regardless.
  let parsed = null;
  try {
    const start = result.text.indexOf("[");
    const end = result.text.lastIndexOf("]");
    if (start !== -1 && end > start) parsed = JSON.parse(result.text.slice(start, end + 1));
  } catch {
    parsed = null;
  }
  if (!Array.isArray(parsed)) return { ok: false };

  const byIndex = new Map();
  parsed.forEach((row) => {
    const i = Number(row?.i);
    const explanation = typeof row?.explanation === "string" ? row.explanation.trim() : "";
    if (Number.isInteger(i) && explanation) byIndex.set(i, explanation);
  });
  if (!byIndex.size) return { ok: false };

  return {
    ok: true,
    sources: sources.map((s, i) => ({
      ...s,
      explanation: byIndex.get(i + 1) || s.snippet || "",
    })),
  };
};

exports.research = async (req, res) => {
  try {
    if (!isResearchConfigured()) {
      return res.status(503).json({
        success: false,
        reason: "unconfigured",
        message: "Research is unavailable — no search provider is configured.",
      });
    }

    const { query } = req.body;
    const found = await search({ query, count: req.body.count });

    if (!found.ok) {
      if (found.reason === "timeout") {
        return res.status(504).json({
          success: false,
          reason: "timeout",
          message: "The search provider took too long to respond.",
        });
      }
      return res.status(502).json({
        success: false,
        reason: found.reason === "bad-response" ? "bad-response" : "upstream",
        message: "The search provider could not complete that request.",
      });
    }

    // Grounded explanations only when an AI provider exists; otherwise the
    // snippet is the explanation. Either way it comes from the source.
    let sources = found.sources.map((s) => ({ ...s, explanation: s.snippet || "" }));
    if (isProviderConfigured()) {
      const grounded = await explainSources(query, found.sources);
      if (grounded.ok) sources = grounded.sources;
    }

    return res.status(200).json({ success: true, query, sources });
  } catch (error) {
    console.error("aiController.research error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "InkWell AI couldn't complete that request." });
  }
};
