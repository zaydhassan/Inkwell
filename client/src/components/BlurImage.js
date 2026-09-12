import React, { useState } from "react";
import { Box } from "@mui/material";

// A premium cover image: a brand gradient shows immediately (so the card is
// never empty), the photo fades + de-blurs in once loaded (blur-up), it zooms
// slightly on hover, and a failed URL degrades back to the gradient instead of
// a broken-image icon. Fills its parent — give the parent a height.
const BlurImage = ({
  src,
  alt = "",
  gradient = "linear-gradient(135deg, #F5F5F4, #E7E5E4)",
  zoomOnHover = true,
  sx,
  imgSx,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        background: gradient,
        ...sx,
      }}
    >
      {!failed && (
        <Box
          component="img"
          src={src}
          alt={alt}
          loading="lazy"
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: loaded ? 1 : 0,
            filter: loaded ? "blur(0)" : "blur(14px)",
            transition:
              "opacity .6s ease, filter .6s ease, transform .55s cubic-bezier(0.22,1,0.36,1)",
            ...(zoomOnHover ? { "&:hover": { transform: "scale(1.08)" } } : {}),
            ...imgSx,
          }}
        />
      )}
    </Box>
  );
};

export default BlurImage;