import { useState } from "react";

import { isSafeBrandAssetUrl } from "@/ee/features/branding/lib/brand-logo";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BannerEditorProps = {
  banner: string | null;
  setBanner: (banner: string | null) => void;
  setBannerBlobUrl: (url: string | null) => void;
  sizeHint?: string;
  defaultBannerImage?: string;
  onUrlApplied?: () => void;
  dropZone: React.ReactNode;
};

/**
 * Adds the shared, safe URL controls around a caller-owned upload drop zone.
 * The upload implementation remains with each page because plan-specific size
 * limits and previews differ. This component never fetches arbitrary URLs.
 */
export function BannerEditor({
  banner,
  setBanner,
  setBannerBlobUrl,
  sizeHint,
  defaultBannerImage,
  onUrlApplied,
  dropZone,
}: BannerEditorProps) {
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  const applyUrl = () => {
    const candidate = url.trim();
    if (!isSafeBrandAssetUrl(candidate)) {
      setUrlError("Enter an HTTPS image, video, or YouTube URL.");
      return;
    }

    setBanner(candidate);
    setBannerBlobUrl(null);
    setUrl("");
    setUrlError(null);
    onUrlApplied?.();
  };

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="banner">Banner {sizeHint}</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Upload a PNG or JPEG using the area below, or use a secure HTTPS URL.
        </p>
      </div>
      {dropZone}
      <div className="space-y-2 border-t pt-3">
        <Label htmlFor="banner-url" className="text-xs">
          Banner URL
        </Label>
        <div className="flex gap-2">
          <Input
            id="banner-url"
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://example.com/banner.jpg"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setUrlError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyUrl();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={applyUrl}>
            Apply
          </Button>
        </div>
        {urlError ? <p className="text-xs text-red-500">{urlError}</p> : null}
      </div>
      {defaultBannerImage && banner !== defaultBannerImage ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-xs"
          onClick={() => {
            setBanner(defaultBannerImage);
            setBannerBlobUrl(null);
          }}
        >
          Use default banner
        </Button>
      ) : null}
    </div>
  );
}
