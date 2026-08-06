import { isSafeBrandAssetUrl } from "./brand-logo";

export type DataroomBannerKind = "none" | "image" | "video" | "youtube";

export type ClassifiedDataroomBanner =
  | { kind: "none" }
  | { kind: "image"; src: string }
  | { kind: "video"; src: string }
  | { kind: "youtube"; src: string; youtubeId: string };

const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".ogg"]);
const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

function getYoutubeId(url: URL): string | null {
  const host = url.hostname.toLowerCase();
  let id: string | null = null;

  if (host === "youtu.be") {
    const segments = url.pathname.split("/").filter(Boolean);
    id = segments.length === 1 ? segments[0] : null;
  } else if (host === "youtube.com" || host === "www.youtube.com") {
    if (url.pathname === "/watch") {
      id = url.searchParams.get("v");
    } else {
      const match = /^\/(?:embed|shorts)\/([^/]+)$/.exec(url.pathname);
      id = match?.[1] ?? null;
    }
  }

  return id && YOUTUBE_VIDEO_ID.test(id) ? id : null;
}

/**
 * Classify a persisted banner without allowing it to choose an executable or
 * mixed-content public source. YouTube is reduced to a validated video ID
 * before it reaches the iframe embed URL.
 */
export function classifyDataroomBanner(
  value: string | null | undefined,
): ClassifiedDataroomBanner {
  if (!value || value === "no-banner" || !isSafeBrandAssetUrl(value)) {
    return { kind: "none" };
  }

  if (value.startsWith("/_static/")) {
    return { kind: "image", src: value };
  }

  const url = new URL(value);
  const youtubeId = getYoutubeId(url);
  if (youtubeId) return { kind: "youtube", src: value, youtubeId };

  const filename = url.pathname.toLowerCase();
  if ([...VIDEO_EXTENSIONS].some((extension) => filename.endsWith(extension))) {
    return { kind: "video", src: value };
  }

  return { kind: "image", src: value };
}
