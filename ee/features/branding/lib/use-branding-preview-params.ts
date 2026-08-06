import { useRouter } from "next/router";

import { isSafeBrandAssetUrl } from "./brand-logo";

const HEX_COLOR = /^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/;
const MAX_CTA_LABEL_LENGTH = 120;
const MAX_WELCOME_MESSAGE_LENGTH = 500;

type BrandingPreviewParams = {
  brandColor?: string;
  accentColor?: string;
  accentButtonColor?: string;
  brandLogo?: string;
  hideLogo?: "1";
  ctaLabel?: string;
  ctaUrl?: string;
  welcomeMessage?: string;
  brandBanner?: string;
  applyAccentColorToDataroomView?: "0" | "1";
  cardLayout?: "LIST" | "GRID" | "COMPACT";
  showFolderTree?: "0" | "1";
  viewerHeaderStyle?: "DEFAULT" | "SPLIT" | "NOTION";
  hideFolderIconsInMain?: "0" | "1";
};

function asSingleString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asHexColor(value: unknown): string | undefined {
  const color = asSingleString(value);
  return color && HEX_COLOR.test(color) ? color : undefined;
}

function asAllowedValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | undefined {
  const stringValue = asSingleString(value);
  return stringValue && allowed.includes(stringValue as T)
    ? (stringValue as T)
    : undefined;
}

function asSafeText(value: unknown, maxLength: number): string | undefined {
  const text = asSingleString(value)?.trim();
  if (!text || text.length > maxLength || /[<>]/.test(text)) return undefined;
  return text;
}

function asSafeHttpUrl(value: unknown): string | undefined {
  const rawUrl = asSingleString(value);
  if (!rawUrl || rawUrl.length > 2_048 || rawUrl !== rawUrl.trim()) {
    return undefined;
  }

  try {
    const url = new URL(rawUrl);
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.username ||
      url.password
    ) {
      return undefined;
    }
    return url.toString();
  } catch {
    return undefined;
  }
}

/**
 * Restrict preview-route query data to the values rendered by the preview
 * pages. Query strings are user-controlled, so arrays, CSS fragments,
 * executable URL schemes, and markup are deliberately discarded.
 */
export function parseBrandingPreviewParams(
  query: Record<string, unknown>,
): BrandingPreviewParams {
  const brandColor = asHexColor(query.brandColor);
  const accentColor = asHexColor(query.accentColor);
  const accentButtonColor = asHexColor(query.accentButtonColor);
  const brandLogo = asSingleString(query.brandLogo);
  const ctaLabel = asSafeText(query.ctaLabel, MAX_CTA_LABEL_LENGTH);
  const ctaUrl = asSafeHttpUrl(query.ctaUrl);
  const welcomeMessage = asSafeText(
    query.welcomeMessage,
    MAX_WELCOME_MESSAGE_LENGTH,
  );
  const brandBanner = asSingleString(query.brandBanner);
  const applyAccentColorToDataroomView = asAllowedValue(
    query.applyAccentColorToDataroomView,
    ["0", "1"] as const,
  );
  const cardLayout = asAllowedValue(query.cardLayout, [
    "LIST",
    "GRID",
    "COMPACT",
  ] as const);
  const showFolderTree = asAllowedValue(query.showFolderTree, [
    "0",
    "1",
  ] as const);
  const viewerHeaderStyle = asAllowedValue(query.viewerHeaderStyle, [
    "DEFAULT",
    "SPLIT",
    "NOTION",
  ] as const);
  const hideFolderIconsInMain = asAllowedValue(query.hideFolderIconsInMain, [
    "0",
    "1",
  ] as const);

  return {
    ...(brandColor ? { brandColor } : {}),
    ...(accentColor ? { accentColor } : {}),
    ...(accentButtonColor ? { accentButtonColor } : {}),
    ...(brandLogo && isSafeBrandAssetUrl(brandLogo) ? { brandLogo } : {}),
    ...(query.hideLogo === "1" ? { hideLogo: "1" as const } : {}),
    ...(ctaLabel ? { ctaLabel } : {}),
    ...(ctaUrl ? { ctaUrl } : {}),
    ...(welcomeMessage ? { welcomeMessage } : {}),
    ...(brandBanner === "no-banner"
      ? { brandBanner }
      : brandBanner && isSafeBrandAssetUrl(brandBanner)
        ? { brandBanner }
        : {}),
    ...(applyAccentColorToDataroomView
      ? { applyAccentColorToDataroomView }
      : {}),
    ...(cardLayout ? { cardLayout } : {}),
    ...(showFolderTree ? { showFolderTree } : {}),
    ...(viewerHeaderStyle ? { viewerHeaderStyle } : {}),
    ...(hideFolderIconsInMain ? { hideFolderIconsInMain } : {}),
  };
}

/** Read and sanitize the only query parameters supported by branding previews. */
export function useBrandingPreviewParams(): BrandingPreviewParams {
  const { query } = useRouter();
  return parseBrandingPreviewParams(query);
}
