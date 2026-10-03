import React, { useState } from "react";
import axios from "axios";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import { InkButton } from "../ink";
import { validateEmail } from "../../utils/validate";

/* ─────────────────────────────────────────────────────────────────────
   InkWell Explore — "Stay in the loop".

   The rail's one warm surface: a quiet orange wash into the canvas colour
   behind this card (see .ink-side-card--glow), so it reads as part of the
   same navigation column — a slightly lifted ending, not a separate widget.

   Wired to the real newsletter endpoint (POST /api/v1/newsletter/subscribe,
   the same one the Home page uses), so the success line only ever appears
   after the server has actually accepted the address — nothing here implies a
   subscription that did not happen. A failure says so and leaves the typed
   address in place so it can be retried; the raw backend message is never
   shown, only the page's own copy.
   ───────────────────────────────────────────────────────────────────── */

const NewsletterCard = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState(null); // { ok: boolean, message: string }
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const invalid = validateEmail(email);
    setError(invalid);
    if (invalid) {
      setStatus(null);
      return;
    }
    setBusy(true);
    try {
      const { data } = await axios.post("/api/v1/newsletter/subscribe", { email });
      if (!data?.success) throw new Error("rejected");
      setStatus({ ok: true, message: "You're subscribed. Look out for the next issue." });
      setEmail("");
    } catch {
      setStatus({
        ok: false,
        message: "That didn't go through. Please try again in a moment.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="ink-side-card ink-side-card--glow ink-surface" aria-labelledby="ink-news-head">
      <span className="ink-side-eyebrow" id="ink-news-head">
        Stay in the loop
      </span>
      <h2 className="ink-side-title">New stories, weekly</h2>
      <p className="ink-side-copy">
        One email a week with the pieces worth reading.
      </p>

      <div className="ink-side-form">
        <input
          className="ink-input"
          type="email"
          placeholder="you@example.com"
          aria-label="Email address"
          aria-invalid={Boolean(error)}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
            setStatus(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        <InkButton
          onClick={submit}
          disabled={busy}
          endIcon={<ArrowForwardRounded />}
          sx={{ width: "100%", minHeight: 44, fontSize: "0.625rem", letterSpacing: "1px" }}
        >
          {busy ? "Subscribing…" : "Subscribe"}
        </InkButton>
      </div>

      {error && (
        <p className="ink-side-msg ink-side-msg--err" role="alert">
          {error}
        </p>
      )}
      {status && (
        <p
          className={`ink-side-msg ${status.ok ? "ink-side-msg--ok" : "ink-side-msg--err"}`}
          role={status.ok ? "status" : "alert"}
        >
          {status.message}
        </p>
      )}
    </section>
  );
};

export default NewsletterCard;
