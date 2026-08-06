import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  AUTO_FILL_NOT_FOUND_MESSAGE,
  autoFillHasBrandAssets,
  sanitizeAutoFillResult,
} from "../ee/features/branding/lib/auto-fill-result";

test("accepts only safe auto-fill branding assets and supported colors", () => {
  const result = sanitizeAutoFillResult({
    name: "Example",
    domain: "example.com",
    logo: "https://assets.example.com/logo.png",
    banner: "https://assets.example.com/banner.mp4",
    brandColor: "#123456",
    accentColor: "#abc",
    accentButtonColor: "#abcdef",
  });

  assert.deepEqual(result, {
    name: "Example",
    domain: "example.com",
    logo: "https://assets.example.com/logo.png",
    banner: "https://assets.example.com/banner.mp4",
    brandColor: "#123456",
    accentColor: "#abc",
    accentButtonColor: "#abcdef",
  });
  assert.equal(autoFillHasBrandAssets(result, { allowBanner: true }), true);
  assert.equal(autoFillHasBrandAssets(result, { allowBanner: false }), true);
});

test("drops unsafe auto-fill media and refuses a result with no usable assets", () => {
  const result = sanitizeAutoFillResult({
    logo: "javascript:alert(1)",
    banner: "//attacker.example/banner.png",
    brandColor: "red; background: url(https://attacker.example)",
  });

  assert.deepEqual(result, {});
  assert.equal(autoFillHasBrandAssets(result, { allowBanner: true }), false);
  assert.equal(AUTO_FILL_NOT_FOUND_MESSAGE.length > 0, true);
});

test("restores preset cards with semantic controls and only known preset IDs", () => {
  const componentPath = path.join(
    process.cwd(),
    "ee/features/branding/components/dataroom-layout-preset-cards.tsx",
  );
  assert.equal(existsSync(componentPath), true);

  const component = readFileSync(componentPath, "utf8");
  assert.match(component, /type DataroomLayoutCardId/);
  assert.match(component, /selectedPreset/);
  assert.match(component, /onSelect/);
  assert.match(component, /aria-pressed/);
  assert.match(component, /type="button"/);
});
