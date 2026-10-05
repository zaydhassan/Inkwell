import React from "react";
import UserAvatar from "../UserAvatar";
import { meta, describe, related, destination, relativeTime } from "./format";

/* ─────────────────────────────────────────────────────────────────────
   One activity row.

   Rendered as a <button> rather than a <Link> on purpose: clicking has to
   (a) mark the notification read on the server and (b) then move on. A real
   link would navigate before the PATCH could land, leaving the item unread
   on the next load. The button keeps the two steps ordered and is natively
   keyboard-operable; its aria-label spells out message *and* action so the
   destination is announced, not just inferred from an arrow.

   Visual weight is driven by the type's priority (see format.TYPES):
   milestones get a larger chip, an orange-tinted surface and a glow;
   reactions stay compact and quiet.
   ───────────────────────────────────────────────────────────────────── */

const ActivityItem = ({ n, onOpen, index = 0 }) => {
  const { Icon, label, kind } = meta(n.type);
  const dest = destination(n);
  const title = related(n);
  const stamp = relativeTime(n.created_at);
  const message = describe(n);

  const open = () => onOpen(n, dest);

  return (
    <li className="ink-nt-item">
      <span className="ink-nt-spine" aria-hidden="true">
        <span className={`ink-nt-node${n.read ? "" : " is-unread"}`} />
      </span>

      <button
        type="button"
        className={`ink-nt-row ink-nt-row--${kind}${n.read ? "" : " is-unread"}${
          dest ? "" : " is-inert"
        }`}
        style={{ "--nt-i": String(index) }}
        onClick={open}
        aria-label={
          `${message}${title ? `. ${title}` : ""}. ${stamp}.` +
          (n.read ? "" : " Unread.") +
          (dest ? " Opens the related page." : "")
        }
      >
        <span className={`ink-nt-icon ink-nt-icon--${kind}`} aria-hidden="true">
          <Icon />
        </span>

        {n.actor && (
          <UserAvatar
            src={n.actor.profile_image}
            name={n.actor.username}
            className="ink-nt-avatar"
            sx={{ width: 26, height: 26 }}
          />
        )}

        <span className="ink-nt-body">
          <span className="ink-nt-msg">
            <span className="ink-nt-type">{label}</span>
            {message}
          </span>
          {title && <span className="ink-nt-related">{title}</span>}
          <span className="ink-nt-time" aria-hidden="true">
            {stamp}
          </span>
        </span>

        {!n.read && <span className="ink-nt-unread" aria-hidden="true" />}
        {dest && (
          <span className="ink-nt-go" aria-hidden="true">
            →
          </span>
        )}
      </button>
    </li>
  );
};

export default ActivityItem;
