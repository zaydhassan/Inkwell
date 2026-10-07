import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import PostAddRoundedIcon from "@mui/icons-material/PostAddRounded";
import ThumbUpRoundedIcon from "@mui/icons-material/ThumbUpRounded";
import TrackChangesRoundedIcon from "@mui/icons-material/TrackChangesRounded";
import { EASE, InkSectionHead } from "../ink";
import { POINT_VALUES } from "../../utils/points";

/* ─────────────────────────────────────────────────────────────────────
   "How to Earn Points".

   The rates are read out of the mirrored award table, so the page prints
   what the server actually credits. A rate that is missing from the table is
   dropped rather than rendered as a blank ("+undefined points") — if an
   activity is ever removed server-side, its row disappears here too.

   The table is role-scoped: a writer is paid for publishing and for the
   likes and comments their stories receive, a reader for reading, liking and
   commenting. So the list shown is the reader's or writer's own, and a
   visitor whose role we don't know (signed out, or an admin — who earns
   nothing) sees both sets under their own labels rather than a made-up
   average.
   ───────────────────────────────────────────────────────────────────── */

const WRITER = [
  { key: "publishArticle", label: "Publish an article", Icon: PostAddRoundedIcon },
  { key: "receiveLike", label: "Get a like on your story", Icon: FavoriteRoundedIcon },
  { key: "receiveComment", label: "Get a comment on your story", Icon: ChatBubbleRoundedIcon },
  { key: "dailyGoal", label: "Hit your daily writing goal", Icon: TrackChangesRoundedIcon },
];

const READER = [
  { key: "readArticle", label: "Read an article", Icon: MenuBookRoundedIcon },
  { key: "likeArticle", label: "Like an article", Icon: ThumbUpRoundedIcon },
  { key: "commentArticle", label: "Comment on a story", Icon: ChatBubbleRoundedIcon },
];

const EarnMethods = ({ role = null }) => {
  const reduce = useReducedMotion();

  // Only methods the table actually pays for.
  const forRole = (items, values) =>
    items.filter((m) => typeof values[m.key] === "number").map((m) => ({ ...m, points: values[m.key] }));

  const groups = role
    ? [{ key: role, label: null, items: forRole(role === "writer" ? WRITER : READER, POINT_VALUES[role]) }]
    : [
        { key: "writer", label: "Writers", items: forRole(WRITER, POINT_VALUES.writer) },
        { key: "reader", label: "Readers", items: forRole(READER, POINT_VALUES.reader) },
      ];

  return (
    <section className="ink-rw-earn" aria-labelledby="ink-rw-earn-title">
      <InkSectionHead
        eyebrow="Get involved"
        title={<span id="ink-rw-earn-title">How to Earn Points</span>}
        subtitle="Be part of the community and earn points for your contributions."
      />

      <div className="ink-rw-earn-groups">
        {groups.map((group, groupIndex) => (
          <div className="ink-rw-earn-group" key={group.key}>
            {group.label ? (
              <span className="ink-rw-earn-group-label">{group.label}</span>
            ) : null}

            <div className="ink-rw-earn-row">
              {group.items.map((method, index) => (
                <motion.div
                  className="ink-rw-earn-item"
                  key={method.key}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{
                    duration: 0.5,
                    ease: EASE,
                    delay: groupIndex * 0.06 + Math.min(index, 5) * 0.07,
                  }}
                >
                  <span className="ink-rw-earn-icon" aria-hidden="true">
                    <method.Icon />
                  </span>
                  <span className="ink-rw-earn-title">{method.label}</span>
                  <span className="ink-rw-earn-points">+{method.points} points</span>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default EarnMethods;
