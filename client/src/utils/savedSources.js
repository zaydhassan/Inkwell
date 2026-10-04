// ─────────────────────────────────────────────────────────────────────
//  Saved sources — the local half of the Source Locker.
//
//  Storage is per user, in localStorage, and entirely optional: a private
//  window or blocked storage just means nothing is remembered, never an
//  error the caller has to handle. The server-side Source Locker workspace
//  is a later phase; this keeps the writer's collected sources across
//  sessions in the meantime.
//
//  A saved entry is a plain snapshot of what the search provider returned —
//  no field is ever invented here, and the list is capped so a long
//  research session can't grow storage without bound.
// ─────────────────────────────────────────────────────────────────────

const PREFIX = "inkwell.sources.";
const LIMIT = 100;

const keyFor = (userId) => `${PREFIX}${userId || "anon"}`;

// Every read and write is guarded: storage can throw (private mode, quota,
// blocked cookies), and a research feature must not take the editor down.
const read = (userId) => {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((s) => s && typeof s.url === "string") : [];
  } catch {
    return [];
  }
};

const write = (userId, list) => {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(list.slice(0, LIMIT)));
  } catch {
    // Storage unavailable — the caller keeps the in-memory list regardless.
  }
};

export const getSavedSources = (userId) => read(userId);

export const isSourceSaved = (userId, url) => read(userId).some((s) => s.url === url);

/* Toggle and return the new list, so the caller can hold it in state
   without a second read. */
export const toggleSavedSource = (userId, source) => {
  if (!source || typeof source.url !== "string") return read(userId);
  const list = read(userId);
  const existing = list.findIndex((s) => s.url === source.url);
  const next =
    existing === -1
      ? [{ ...source, savedAt: Date.now() }, ...list]
      : list.filter((_, i) => i !== existing);
  write(userId, next);
  return next;
};
