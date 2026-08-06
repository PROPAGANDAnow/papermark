import { isSafeBrandAssetUrl } from "./brand-logo";

export const AUTO_FILL_NOT_FOUND_MESSAGE =
  "We couldn't find usable brand assets for that website.";

type AutoFillBrandResult = {
  name?: string;
  domain?: string;
  logo?: string;
  banner?: string;
  brandColor?: string;
  accentColor?: string;
  accentButtonColor?: string;
};

type AutoFillAssetOptions = {
  allowBanner: boolean;
};

const HEX_COLOR = /^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/;

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asSafeColor(value: unknown): string | undefined {
  return typeof value === "string" && HEX_COLOR.test(value) ? value : undefined;
}

/**
 * Narrow an untrusted auto-fill API response to values that branding previews
 * can safely consume. In particular, media stays restricted to the same HTTPS
 * or first-party static sources allowed by public dataroom pages.
 */
export function sanitizeAutoFillResult(value: unknown): AutoFillBrandResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const result = value as Record<string, unknown>;
  const name = asNonEmptyString(result.name);
  const domain = asNonEmptyString(result.domain);
  const logo = isSafeBrandAssetUrl(result.logo) ? result.logo : undefined;
  const banner = isSafeBrandAssetUrl(result.banner) ? result.banner : undefined;
  const brandColor = asSafeColor(result.brandColor);
  const accentColor = asSafeColor(result.accentColor);
  const accentButtonColor = asSafeColor(result.accentButtonColor);

  return {
    ...(name ? { name } : {}),
    ...(domain ? { domain } : {}),
    ...(logo ? { logo } : {}),
    ...(banner ? { banner } : {}),
    ...(brandColor ? { brandColor } : {}),
    ...(accentColor ? { accentColor } : {}),
    ...(accentButtonColor ? { accentButtonColor } : {}),
  };
}

/** Return whether a sanitized response has an asset usable on this page. */
export function autoFillHasBrandAssets(
  result: AutoFillBrandResult,
  { allowBanner }: AutoFillAssetOptions,
): boolean {
  return Boolean(result.logo || (allowBanner && result.banner));
}
