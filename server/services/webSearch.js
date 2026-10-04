// ─────────────────────────────────────────────────────────────────────
//  InkWell AI — real web search for the Research Sources action.
//
//  The product rule is absolute: research must NEVER invent a source. So
//  this module only ever returns what a search provider actually returned,
//  and when no provider is configured it returns { ok:false, reason:"" }
//  so the UI can show its honest unavailable state instead of fake
//  citations.
//
//  Provider selection is env-driven:
//    SEARCH_PROVIDER   "tavily" (default) | "brave"
//    TAVILY_API_KEY    (or a generic SEARCH_API_KEY)
//    BRAVE_API_KEY
//    SEARCH_TIMEOUT_MS default 12000
//
//  Every result is normalised to { title, url, publisher, snippet,
//  publishedDate }. A URL that doesn't parse as http(s) is dropped — a
//  search result must never become a `javascript:`/`data:` link in the
//  article. `publishedDate` is passed through only when the provider gave
//  one; it is never guessed.
// ─────────────────────────────────────────────────────────────────────

const PROVIDERS = {
  tavily: { keyEnv: "TAVILY_API_KEY" },
  brave: { keyEnv: "BRAVE_API_KEY" },
};

const PROVIDER_NAMES = Object.keys(PROVIDERS);

const searchKey = (name) =>
  (process.env[PROVIDERS[name].keyEnv] || process.env.SEARCH_API_KEY || "").trim();

const resolveSearchProvider = () => {
  const named = (process.env.SEARCH_PROVIDER || "tavily").trim().toLowerCase();
  if (PROVIDER_NAMES.includes(named) && searchKey(named)) return named;
  return PROVIDER_NAMES.find((name) => searchKey(name)) || null;
};

const isResearchConfigured = () => Boolean(resolveSearchProvider());

const researchStatus = () => {
  const provider = resolveSearchProvider();
  return { configured: Boolean(provider), provider };
};

const timeoutMs = () => Number(process.env.SEARCH_TIMEOUT_MS) || 12000;

const fetchWithTimeout = async (url, options) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());
  if (typeof timer.unref === "function") timer.unref();
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

/* Derive a human publisher label from the host — "www." off, which is
   always available and never invented. */
const publisherFromUrl = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
};

/* Drop anything that isn't a real http(s) link, and keep only the fields
   the sources card renders. */
const normalizeSources = (rows) =>
  rows
    .map((row) => {
      const url = typeof row?.url === "string" ? row.url.trim() : "";
      if (!/^https?:\/\//i.test(url)) return null;
      const title = String(row?.title || "").trim() || url;
      const snippet = String(row?.snippet || "").trim();
      const publishedDate = String(row?.publishedDate || "").trim();
      return {
        title: title.slice(0, 300),
        url,
        publisher: String(row?.publisher || publisherFromUrl(url)).slice(0, 120),
        snippet: snippet.slice(0, 1200),
        publishedDate: publishedDate.slice(0, 60),
      };
    })
    .filter(Boolean);

const searchTavily = async (key, query, count) => {
  const res = await fetchWithTimeout("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: key,
      query,
      max_results: count,
      search_depth: "basic",
      include_answer: false,
    }),
  });
  if (!res.ok) return { ok: false, reason: "upstream" };
  const data = await res.json().catch(() => null);
  const rows = (data?.results || []).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.content,
    publishedDate: r.published_date,
  }));
  return { ok: true, rows };
};

const searchBrave = async (key, query, count) => {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(
    query
  )}&count=${encodeURIComponent(count)}`;
  const res = await fetchWithTimeout(url, {
    method: "GET",
    headers: { Accept: "application/json", "X-Subscription-Token": key },
  });
  if (!res.ok) return { ok: false, reason: "upstream" };
  const data = await res.json().catch(() => null);
  const rows = (data?.web?.results || []).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.description,
    publishedDate: r.age,
    publisher: r.profile?.name || r.meta_url?.hostname,
  }));
  return { ok: true, rows };
};

/**
 * Search the web for sources. Always resolves.
 * @returns {{ok:true, sources:Array} | {ok:false, reason:string}}
 */
const search = async ({ query, count = 5 } = {}) => {
  const provider = resolveSearchProvider();
  if (!provider) return { ok: false, reason: "unconfigured" };

  const key = searchKey(provider);
  const max = Math.max(1, Math.min(8, Number(count) || 5));

  let result;
  try {
    result = provider === "brave" ? await searchBrave(key, query, max) : await searchTavily(key, query, max);
  } catch (err) {
    if (err?.name === "AbortError") return { ok: false, reason: "timeout" };
    return { ok: false, reason: "upstream" };
  }

  if (!result.ok) return result;

  const sources = normalizeSources(result.rows).slice(0, max);
  if (!sources.length) return { ok: false, reason: "bad-response" };
  return { ok: true, sources };
};

module.exports = {
  search,
  isResearchConfigured,
  researchStatus,
  resolveSearchProvider,
};
