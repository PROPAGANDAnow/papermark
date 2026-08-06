import { type SyntheticEvent, useCallback, useEffect, useState } from "react";

export type LogoTone = "dark" | "light";

const LIGHTNESS_THRESHOLD = 0.6;
const MAX_SAMPLE_DIMENSION = 32;

/**
 * Classify a logo using only its visible pixels. Fully transparent canvas
 * pixels are ignored so transparent image padding cannot make a dark logo look
 * light. An empty or unreadable image intentionally falls back to dark, which
 * selects the conservative white logo chip used before analysis completes.
 */
export function getLogoToneFromPixels(pixels: ArrayLike<number>): LogoTone {
  let luminanceTotal = 0;
  let alphaTotal = 0;

  for (let index = 0; index + 3 < pixels.length; index += 4) {
    const alpha = pixels[index + 3] / 255;
    if (!Number.isFinite(alpha) || alpha <= 0) continue;

    const red = pixels[index] / 255;
    const green = pixels[index + 1] / 255;
    const blue = pixels[index + 2] / 255;
    const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;

    if (!Number.isFinite(luminance)) continue;
    luminanceTotal += luminance * alpha;
    alphaTotal += alpha;
  }

  return alphaTotal > 0 && luminanceTotal / alphaTotal >= LIGHTNESS_THRESHOLD
    ? "light"
    : "dark";
}

function getSampleDimensions(image: HTMLImageElement): [number, number] | null {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (!width || !height) return null;

  const scale = Math.min(1, MAX_SAMPLE_DIMENSION / Math.max(width, height));
  return [
    Math.max(1, Math.round(width * scale)),
    Math.max(1, Math.round(height * scale)),
  ];
}

/**
 * Analyze the already-rendered logo after it loads. The hook never fetches a
 * URL itself; this avoids a second external request and relies on the image
 * element's caller-controlled CORS/referrer policy. Canvas/CORS failures keep
 * the safe default tone instead of exposing an error to public viewers.
 */
export function useLogoTone(src: string): {
  tone: LogoTone;
  imgProps: { onLoad: (event: SyntheticEvent<HTMLImageElement>) => void };
} {
  const [tone, setTone] = useState<LogoTone>("dark");

  useEffect(() => {
    setTone("dark");
  }, [src]);

  const onLoad = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    const dimensions = getSampleDimensions(image);
    if (!dimensions || typeof document === "undefined") return;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = dimensions[0];
      canvas.height = dimensions[1];
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      setTone(
        getLogoToneFromPixels(
          context.getImageData(0, 0, canvas.width, canvas.height).data,
        ),
      );
    } catch {
      // Cross-origin or decoding failures leave the conservative default.
      setTone("dark");
    }
  }, []);

  return { tone, imgProps: { onLoad } };
}
