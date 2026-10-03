import React, { useState, useEffect } from "react";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";

/* ─────────────────────────────────────────────────────────────────────
   Voice dictation dock.

   A translucent, blurred card that sits under the editor — visually lifted
   off the flat canvas without floating over the text the writer is reading.

   The elapsed timer is local to this component on purpose: it is the only
   piece of dictation state the page has no use for, so keeping it here
   leaves the speech wiring in CreateBlog.js completely untouched.

   The timer is `aria-hidden`. A live region ticking once a second is
   hostile to a screen reader, and the state that actually matters —
   listening or not — is already carried by the button's `aria-pressed` and
   by the spoken label. Dictated words land in the editor, which is where
   they should be read.
   ───────────────────────────────────────────────────────────────────── */

const BAR_COUNT = 5;

const formatElapsed = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const VoiceDock = ({ listening, onToggle }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!listening) {
      setSeconds(0);
      return undefined;
    }
    const id = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(id);
  }, [listening]);

  return (
    <div className={`ink-voice${listening ? " is-live" : ""}`} role="group" aria-label="Voice dictation">
      <button
        type="button"
        className="ink-voice-btn"
        onClick={onToggle}
        aria-pressed={listening}
        aria-label={listening ? "Stop dictation" : "Start dictation"}
      >
        {listening ? <MicOffIcon /> : <MicIcon />}
      </button>

      <div className="ink-voice-text">
        <p className="ink-voice-title" aria-live="polite">
          {listening ? "Listening…" : "Voice dictation"}
        </p>
        <p className="ink-voice-hint">
          {listening
            ? "Speak — your words are added to the editor."
            : "Dictate your draft instead of typing it."}
        </p>
      </div>

      {listening ? (
        <>
          <div className="ink-voice-wave" aria-hidden="true">
            {Array.from({ length: BAR_COUNT }, (_, i) => (
              <span key={i} className="ink-voice-bar" />
            ))}
          </div>
          <span className="ink-voice-time" aria-hidden="true">
            {formatElapsed(seconds)}
          </span>
        </>
      ) : null}
    </div>
  );
};

export default VoiceDock;
