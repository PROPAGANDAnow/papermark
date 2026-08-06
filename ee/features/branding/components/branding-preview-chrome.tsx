import { useMemo } from "react";

type BrandingPreviewChromeProps = {
  name: string;
  basePath: string;
  urlLabel: string;
  params: Record<string, string>;
};

function previewSrc(basePath: string, params: Record<string, string>): string {
  // Preview routes are application-owned. Refuse an external or malformed route
  // rather than handing untrusted input to an iframe src attribute.
  if (!basePath.startsWith("/") || basePath.startsWith("//"))
    return "about:blank";
  const query = new URLSearchParams(params).toString();
  return query ? `${basePath}?${query}` : basePath;
}

/** A contained, non-interactive browser-frame preview for branding changes. */
export function BrandingPreviewChrome({
  name,
  basePath,
  urlLabel,
  params,
}: BrandingPreviewChromeProps) {
  const src = useMemo(() => previewSrc(basePath, params), [basePath, params]);

  return (
    <div className="flex h-full flex-col">
      <p className="mb-3 text-sm font-medium text-foreground">Preview</p>
      <div className="flex min-h-0 flex-1 justify-center">
        <div className="relative flex h-[450px] w-full max-w-[698px] flex-col overflow-hidden rounded-lg bg-gray-200 p-1 shadow-lg lg:h-full">
          <div className="flex h-7 shrink-0 items-center justify-center rounded-t-md bg-gray-100">
            <div className="absolute left-4 flex gap-1" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-gray-300" />
              <span className="h-2 w-2 rounded-full bg-gray-300" />
              <span className="h-2 w-2 rounded-full bg-gray-300" />
            </div>
            <div className="max-w-[70%] truncate rounded-xl bg-white px-2 py-1 text-xs text-muted-foreground">
              {urlLabel}
            </div>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-b-md bg-white">
            <iframe
              key={src}
              name={`${name}-preview`}
              title={`${name} preview`}
              src={src}
              sandbox="allow-scripts allow-same-origin"
              referrerPolicy="no-referrer"
              className="absolute left-0 top-0 h-full w-full border-0 bg-white"
              style={{ pointerEvents: "none" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
