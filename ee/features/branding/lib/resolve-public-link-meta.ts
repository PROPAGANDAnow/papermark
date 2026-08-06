import { isSafeBrandAssetUrl } from "./brand-logo";

type LinkPreviewFields = {
  metaTitle?: unknown;
  metaDescription?: unknown;
  metaImage?: unknown;
  metaFavicon?: unknown;
};

type BrandLinkPreviewFields = {
  customLinkPreviewEnabled?: unknown;
  linkPreviewTitle?: unknown;
  linkPreviewDescription?: unknown;
  linkPreviewImage?: unknown;
  linkPreviewFavicon?: unknown;
};

export type ResolvedPublicLinkMeta = {
  enableCustomMetatag: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  metaImage: string | null;
  metaFavicon: string;
};

const DEFAULT_FAVICON = "/favicon.ico";
const FALLBACK_TITLE = "Shared link | Powered by Papermark";
const MAX_TITLE_LENGTH = 512;
const MAX_DESCRIPTION_LENGTH = 2_048;
const MAX_INLINE_ASSET_LENGTH = 7 * 1024 * 1024;

/**
 * Metadata is rendered in unauthenticated pages. Keep control characters and
 * unexpectedly large values out of the serialized page props, even though the
 * React renderer escapes attribute values.
 */
function asSafeText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (
    !trimmed ||
    trimmed.length > maxLength ||
    /[\u0000-\u001F\u007F]/.test(trimmed)
  ) {
    return null;
  }

  return trimmed;
}

/**
 * Link previews historically support base64 raster assets produced by the
 * uploader. Do not allow SVG/data HTML: those formats can carry executable
 * content when consumed as a public favicon or image source.
 */
function isSafeInlineRasterAsset(value: string): boolean {
  return (
    value.length <= MAX_INLINE_ASSET_LENGTH &&
    /^data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/]+={0,2}$/i.test(value)
  );
}

function asSafePublicAsset(value: unknown): string | null {
  if (typeof value !== "string" || !value || value !== value.trim()) {
    return null;
  }

  if (isSafeInlineRasterAsset(value) || isSafeBrandAssetUrl(value)) {
    return value;
  }

  return null;
}

function isEnabled(value: unknown): boolean {
  return value === true;
}

function resolveFields(
  primary: LinkPreviewFields,
  fallback?: LinkPreviewFields | null,
): Omit<ResolvedPublicLinkMeta, "enableCustomMetatag"> {
  return {
    metaTitle:
      asSafeText(primary.metaTitle, MAX_TITLE_LENGTH) ??
      (fallback ? asSafeText(fallback.metaTitle, MAX_TITLE_LENGTH) : null),
    metaDescription:
      asSafeText(primary.metaDescription, MAX_DESCRIPTION_LENGTH) ??
      (fallback
        ? asSafeText(fallback.metaDescription, MAX_DESCRIPTION_LENGTH)
        : null),
    metaImage:
      asSafePublicAsset(primary.metaImage) ??
      (fallback ? asSafePublicAsset(fallback.metaImage) : null),
    metaFavicon:
      asSafePublicAsset(primary.metaFavicon) ??
      (fallback ? asSafePublicAsset(fallback.metaFavicon) : null) ??
      DEFAULT_FAVICON,
  };
}

/**
 * Resolve only the branding values explicitly enabled for a public link.
 * Precedence is per-link, then an enabled dataroom preview (with enabled team
 * values as field-level fallbacks), then an enabled team preview. Disabled
 * records are deliberately ignored so stored administrative metadata cannot
 * leak into static public page props.
 */
export function resolvePublicLinkMeta({
  link,
  teamBrand,
  dataroomBrand,
  defaultTitle,
}: {
  link: { enableCustomMetatag?: unknown } & LinkPreviewFields;
  teamBrand?: BrandLinkPreviewFields | null;
  dataroomBrand?: BrandLinkPreviewFields | null;
  defaultTitle: string;
}): ResolvedPublicLinkMeta {
  const safeDefaultTitle =
    asSafeText(defaultTitle, MAX_TITLE_LENGTH) ?? FALLBACK_TITLE;

  if (isEnabled(link.enableCustomMetatag)) {
    const fields = resolveFields(link);
    return {
      enableCustomMetatag: true,
      ...fields,
      metaTitle: fields.metaTitle ?? safeDefaultTitle,
    };
  }

  const enabledTeamBrand = isEnabled(teamBrand?.customLinkPreviewEnabled)
    ? {
        metaTitle: teamBrand?.linkPreviewTitle,
        metaDescription: teamBrand?.linkPreviewDescription,
        metaImage: teamBrand?.linkPreviewImage,
        metaFavicon: teamBrand?.linkPreviewFavicon,
      }
    : null;

  if (isEnabled(dataroomBrand?.customLinkPreviewEnabled)) {
    const fields = resolveFields(
      {
        metaTitle: dataroomBrand?.linkPreviewTitle,
        metaDescription: dataroomBrand?.linkPreviewDescription,
        metaImage: dataroomBrand?.linkPreviewImage,
        metaFavicon: dataroomBrand?.linkPreviewFavicon,
      },
      enabledTeamBrand,
    );
    return {
      enableCustomMetatag: true,
      ...fields,
      metaTitle: fields.metaTitle ?? safeDefaultTitle,
    };
  }

  if (enabledTeamBrand) {
    const fields = resolveFields(enabledTeamBrand);
    return {
      enableCustomMetatag: true,
      ...fields,
      metaTitle: fields.metaTitle ?? safeDefaultTitle,
    };
  }

  return {
    enableCustomMetatag: false,
    metaTitle: null,
    metaDescription: null,
    metaImage: null,
    metaFavicon: DEFAULT_FAVICON,
  };
}
