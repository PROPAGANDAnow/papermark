import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { getSafeSocialPreviewAsset } from "../ee/features/branding/components/branding-social-preview-readonly";

const componentsDirectory = path.join(
  process.cwd(),
  "ee/features/branding/components",
);

const componentFiles = [
  "banner-editor.tsx",
  "branding-link-preview-form.tsx",
  "branding-preview-chrome.tsx",
  "branding-social-preview-readonly.tsx",
  "collapsible-branding-section.tsx",
] as const;

test("branding settings page dependencies exist and keep untrusted preview content contained", () => {
  for (const filename of componentFiles) {
    assert.equal(
      existsSync(path.join(componentsDirectory, filename)),
      true,
      `${filename} must exist for pages/branding.tsx`,
    );
  }

  const bannerEditor = readFileSync(
    path.join(componentsDirectory, "banner-editor.tsx"),
    "utf8",
  );
  const previewChrome = readFileSync(
    path.join(componentsDirectory, "branding-preview-chrome.tsx"),
    "utf8",
  );

  const socialPreview = readFileSync(
    path.join(componentsDirectory, "branding-social-preview-readonly.tsx"),
    "utf8",
  );

  assert.match(bannerEditor, /isSafeBrandAssetUrl/);
  assert.match(previewChrome, /sandbox="allow-scripts allow-same-origin"/);
  assert.match(previewChrome, /basePath\.startsWith\("\/"\)/);
  assert.match(previewChrome, /new URLSearchParams/);
  assert.match(socialPreview, /isSafeBrandAssetUrl/);
  assert.match(socialPreview, /isSafeInlineRasterImage/);
  assert.match(socialPreview, /png\|jpeg/);
  assert.doesNotMatch(socialPreview, /dangerouslySetInnerHTML/);
});

test("social preview accepts only safe raster and brand asset sources", () => {
  assert.equal(
    getSafeSocialPreviewAsset("data:image/png;base64,aGVsbG8="),
    "data:image/png;base64,aGVsbG8=",
  );
  assert.equal(
    getSafeSocialPreviewAsset("/_static/preview.png"),
    "/_static/preview.png",
  );

  for (const value of [
    "javascript:alert(1)",
    "data:image/svg+xml,<svg onload=alert(1) />",
    "http://assets.example.com/preview.png",
    "//attacker.example/preview.png",
    " https://assets.example.com/preview.png ",
  ]) {
    assert.equal(getSafeSocialPreviewAsset(value), null);
  }
});
