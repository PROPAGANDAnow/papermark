import { isSafeBrandAssetUrl } from "@/ee/features/branding/lib/brand-logo";
import { ImageIcon, LinkIcon } from "lucide-react";

const MAX_INLINE_IMAGE_LENGTH = 7 * 1024 * 1024;
const MAX_TEXT_LENGTH = 2_048;

function isSafeInlineRasterImage(value: string): boolean {
  return (
    value.length <= MAX_INLINE_IMAGE_LENGTH &&
    /^data:image\/(?:png|jpeg);base64,[a-z0-9+/]+={0,2}$/i.test(value)
  );
}

export function getSafeSocialPreviewAsset(value: string | null): string | null {
  if (!value || value !== value.trim()) return null;

  return isSafeInlineRasterImage(value) || isSafeBrandAssetUrl(value)
    ? value
    : null;
}

function safePreviewText(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (
    !trimmed ||
    trimmed.length > MAX_TEXT_LENGTH ||
    /[\u0000-\u001F\u007F]/.test(trimmed)
  ) {
    return fallback;
  }

  return trimmed;
}

type BrandingSocialPreviewReadonlyProps = {
  title: string;
  description: string;
  image: string | null;
  favicon: string | null;
};

/**
 * A visual-only approximation of a shared-link card. Text is rendered as text
 * (never HTML), and images are limited to first-party/HTTPS brand assets or
 * raster data URLs produced by the local upload form.
 */
export function BrandingSocialPreviewReadonly({
  title,
  description,
  image,
  favicon,
}: BrandingSocialPreviewReadonlyProps) {
  const safeImage = getSafeSocialPreviewAsset(image);
  const safeFavicon = getSafeSocialPreviewAsset(favicon);
  const previewTitle = safePreviewText(title, "Your shared link title");
  const previewDescription = safePreviewText(
    description,
    "A short description of the content visitors can access.",
  );

  return (
    <article
      aria-label="Shared link preview"
      className="w-full max-w-lg overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm"
    >
      <div className="flex aspect-[1.91/1] items-center justify-center overflow-hidden bg-muted">
        {safeImage ? (
          <img
            src={safeImage}
            alt="Social preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon
            aria-hidden="true"
            className="h-10 w-10 text-muted-foreground/60"
          />
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {safeFavicon ? (
            <img
              src={safeFavicon}
              alt=""
              className="h-4 w-4 rounded-sm object-cover"
            />
          ) : (
            <LinkIcon aria-hidden="true" className="h-4 w-4" />
          )}
          <span>PAPERMARK.COM</span>
        </div>
        <h3 className="line-clamp-2 text-base font-semibold">{previewTitle}</h3>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {previewDescription}
        </p>
      </div>
    </article>
  );
}
