import { useRef, useState } from "react";

import { ImageIcon, UploadIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type BrandingLinkPreviewFormProps = {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  title: string;
  onTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  imageUrl: string | null;
  onImageChange: (value: string | null) => void;
  faviconUrl: string | null;
  onFaviconChange: (value: string | null) => void;
  inheritanceHint?: string;
};

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);

function ImageUpload({
  id,
  label,
  value,
  onChange,
  compact = false,
}: {
  id: string;
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const selectFile = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setError("Use a PNG or JPEG image.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Image must be 2 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (
        typeof reader.result === "string" &&
        reader.result.startsWith("data:image/")
      ) {
        onChange(reader.result);
      } else {
        setError("Could not read that image safely.");
      }
    };
    reader.onerror = () => setError("Could not read that image.");
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={cn(
            "flex items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-muted/30 text-muted-foreground",
            compact ? "h-10 w-10" : "h-20 w-32",
          )}
          onClick={() => inputRef.current?.click()}
          aria-label={`Upload ${label.toLowerCase()}`}
        >
          {value ? (
            <img
              src={value}
              alt={`${label} preview`}
              className="h-full w-full object-cover"
            />
          ) : compact ? (
            <ImageIcon className="h-4 w-4" aria-hidden="true" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-xs">
              <UploadIcon className="h-5 w-5" aria-hidden="true" />
              Upload image
            </div>
          )}
        </button>
        <div className="space-y-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
          >
            Choose image
          </Button>
          {value ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange(null)}
            >
              Remove
            </Button>
          ) : null}
          <p className="text-xs text-muted-foreground">
            PNG or JPEG, up to 2 MB.
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/png,image/jpeg"
        className="sr-only"
        onChange={(event) => selectFile(event.target.files?.[0])}
      />
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

/** Global Open Graph defaults. Assets are local, type/size-checked uploads; no remote URL input is exposed. */
export function BrandingLinkPreviewForm({
  enabled,
  onEnabledChange,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  imageUrl,
  onImageChange,
  faviconUrl,
  onFaviconChange,
  inheritanceHint,
}: BrandingLinkPreviewFormProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Label htmlFor="link-preview-enabled">Custom Link Preview</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Set the title, description, and locally uploaded images shown when
            links are shared.
          </p>
        </div>
        <Switch
          id="link-preview-enabled"
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
      </div>
      {enabled ? (
        <div className="space-y-4 border-t pt-4">
          {inheritanceHint ? (
            <p className="text-xs text-muted-foreground">{inheritanceHint}</p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="link-preview-title">Title</Label>
            <Input
              id="link-preview-title"
              maxLength={120}
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-preview-description">Description</Label>
            <Textarea
              id="link-preview-description"
              maxLength={300}
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              className="resize-none"
            />
          </div>
          <ImageUpload
            id="link-preview-image"
            label="Social image"
            value={imageUrl}
            onChange={onImageChange}
          />
          <ImageUpload
            id="link-preview-favicon"
            label="Favicon"
            value={faviconUrl}
            onChange={onFaviconChange}
            compact
          />
        </div>
      ) : null}
    </div>
  );
}
