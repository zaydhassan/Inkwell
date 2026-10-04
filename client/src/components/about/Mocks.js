import React from "react";
import { Box } from "@mui/material";
import { CheckOutlined } from "@mui/icons-material";

/* ─────────────────────────────────────────────────────────────────────
   The mock surfaces.

   Every visual on the About page that depicts the product uses these: bars
   standing in for text, chips standing in for tags, discs standing in for
   people. They are deliberately abstract, and deliberately empty of figures —
   no counts, no percentages, no dates. A mock that contains a number invites
   the reader to believe the number, and none of these numbers would be real.
   ───────────────────────────────────────────────────────────────────── */

export const Bar = ({ w, tone = "line", strike = false }) => (
  <Box
    component="span"
    className="ink-ab-mock-bar"
    data-tone={tone}
    data-strike={strike || undefined}
    sx={{ width: w }}
  />
);

const rows = [0, 1, 2];

export const Mock = ({ kind }) => {
  if (kind === "challenge") {
    return (
      <Box className="ink-ab-mock">
        <Box className="ink-ab-mock-block">
          <Bar w="82%" tone="strong" />
          <Bar w="64%" />
          <Bar w="71%" />
        </Box>
        <Box className="ink-ab-mock-reply">
          <Box component="span" className="ink-ab-mock-q" aria-hidden="true">
            ?
          </Box>
          <Bar w="70%" tone="warm" />
        </Box>
      </Box>
    );
  }

  if (kind === "sources") {
    return (
      <Box className="ink-ab-mock">
        {rows.map((i) => (
          <Box key={i} className="ink-ab-mock-src">
            <Box component="span" className="ink-ab-mock-src-dot" aria-hidden="true" />
            <Bar w={i === 1 ? "58%" : "44%"} />
            <Box component="span" className="ink-ab-mock-tag">
              source
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  if (kind === "lines" || kind === "refine") {
    const widths = ["92%", "78%", "86%", "61%"];
    return (
      <Box className="ink-ab-mock">
        <Box className="ink-ab-mock-block">
          {widths.map((w, i) => (
            <Bar
              key={w}
              w={w}
              tone={kind === "refine" && i === 1 ? "muted" : "line"}
              strike={kind === "refine" && i === 1}
            />
          ))}
        </Box>
      </Box>
    );
  }

  if (kind === "checks") {
    return (
      <Box className="ink-ab-mock">
        {rows.map((i) => (
          <Box key={i} className="ink-ab-mock-check">
            <Box component="span" className="ink-ab-mock-tick" aria-hidden="true">
              <CheckOutlined />
            </Box>
            <Bar w={i === 2 ? "52%" : "68%"} />
          </Box>
        ))}
      </Box>
    );
  }

  if (kind === "annotate") {
    return (
      <Box className="ink-ab-mock">
        <Box className="ink-ab-mock-block">
          <Bar w="88%" />
          <Bar w="72%" tone="warm" />
          <Bar w="80%" />
        </Box>
        <Box className="ink-ab-mock-reply">
          <Box component="span" className="ink-ab-mock-tag" data-tone="warm">
            reads slow here
          </Box>
        </Box>
      </Box>
    );
  }

  if (kind === "fan") {
    return (
      <Box className="ink-ab-mock">
        <Box className="ink-ab-mock-block">
          <Bar w="76%" tone="strong" />
          <Bar w="58%" />
        </Box>
        <Box className="ink-ab-mock-fan" aria-hidden="true">
          <Box component="span" className="ink-ab-mock-fork" />
        </Box>
        <Box className="ink-ab-mock-fan">
          {rows.map((i) => (
            <Box key={i} className="ink-ab-mock-mini">
              <Bar w="80%" />
              <Bar w="54%" />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  if (kind === "card") {
    return (
      <Box className="ink-ab-mock">
        <Box className="ink-ab-mock-story">
          <Bar w="74%" tone="strong" />
          <Bar w="94%" />
          <Bar w="66%" />
          <Box className="ink-ab-mock-foot">
            <Box component="span" className="ink-ab-mock-avatar" aria-hidden="true" />
            <Box component="span" className="ink-ab-mock-tag" data-tone="warm">
              published
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="ink-ab-mock">
      <Box className="ink-ab-mock-reply">
        <Box component="span" className="ink-ab-mock-avatar" aria-hidden="true" />
        <Bar w="62%" />
      </Box>
      <Box className="ink-ab-mock-reply" data-indent="true">
        <Box component="span" className="ink-ab-mock-avatar" data-alt="true" aria-hidden="true" />
        <Bar w="48%" />
      </Box>
      <Box className="ink-ab-mock-reply">
        <Box component="span" className="ink-ab-mock-avatar" aria-hidden="true" />
        <Bar w="55%" />
      </Box>
    </Box>
  );
};

export default Mock;
