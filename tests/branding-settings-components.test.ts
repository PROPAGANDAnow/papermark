import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const componentsDirectory = path.join(
  process.cwd(),
  "ee/features/branding/components",
);

const componentFiles = [
  "banner-editor.tsx",
  "branding-link-preview-form.tsx",
  "branding-preview-chrome.tsx",
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

  assert.match(bannerEditor, /isSafeBrandAssetUrl/);
  assert.match(previewChrome, /sandbox="allow-scripts allow-same-origin"/);
  assert.match(previewChrome, /basePath\.startsWith\("\/"\)/);
  assert.match(previewChrome, /new URLSearchParams/);
});
