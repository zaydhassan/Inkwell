/* ─────────────────────────────────────────────────────────────────────
   The client's mirror of the server's award table.

   `server/utils/points.js` is the source of truth — it is what actually
   credits a balance, inside the like / comment / publish / reading flows.
   This copy exists for ONE reason: the Rewards page prints the real rates
   next to each activity instead of inventing plausible ones. It awards
   nothing and must never be used to compute a balance.

   Two things this mirror deliberately does not carry:
     • `shareArticle` (15) — present in the server table but never awarded
       by any controller, so printing "Share a story +15" would describe a
       mechanic that does not fire. Left out until a share flow credits it.
     • `dailyGoal` on readers — the activity exists, but the table only
       assigns it a writer value, so it pays writers only.
   Keep this in step when the server table changes.
   ───────────────────────────────────────────────────────────────────── */

export const POINT_VALUES = {
  writer: { publishArticle: 50, receiveLike: 10, receiveComment: 5, dailyGoal: 25 },
  reader: { readArticle: 10, likeArticle: 5, commentArticle: 10 },
};

/* Normalised role key ("Writer" → "writer"). Admins earn nothing, so an
   unknown/admin role falls through to the two-role presentation. */
export const pointsRole = (role) => {
  const key = String(role || "").toLowerCase();
  return key === "writer" || key === "reader" ? key : null;
};
