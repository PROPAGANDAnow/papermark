import assert from "node:assert/strict";
import test from "node:test";

import {
  mergeBrandLogoFields,
  resolveBrandLogo,
} from "../ee/features/branding/lib/brand-logo";
import { classifyDataroomBanner } from "../ee/features/branding/lib/dataroom-banner";
import {
  DataroomCardLayoutSchema,
  DataroomViewerHeaderStyleSchema,
  DataroomViewerLayoutPresetSchema,
  asDataroomCardLayout,
  asDataroomViewerHeaderStyle,
  inferDataroomViewerLayoutPreset,
} from "../ee/features/branding/lib/dataroom-viewer-layout";
import { parseBrandingPreviewParams } from "../ee/features/branding/lib/use-branding-preview-params";
import { getLogoToneFromPixels } from "../ee/features/branding/lib/use-logo-tone";

test("resolves hidden branding before custom or Papermark logo fallbacks", () => {
  assert.deepEqual(
    resolveBrandLogo({
      logo: "https://assets.example.com/logo.png",
      hideLogo: true,
    }),
    { kind: "none" },
  );
  assert.deepEqual(resolveBrandLogo({ logo: null, hideLogo: false }), {
    kind: "papermark",
  });
  assert.deepEqual(
    resolveBrandLogo({ logo: "https://assets.example.com/logo.png" }),
    { kind: "custom", src: "https://assets.example.com/logo.png" },
  );
});

test("never turns untrusted logo values into public image sources", () => {
  for (const logo of [
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "//attacker.example/logo.svg",
    "http://assets.example.com/logo.png",
    " https://assets.example.com/logo.png ",
  ]) {
    assert.deepEqual(resolveBrandLogo({ logo }), { kind: "papermark" });
  }

  assert.deepEqual(resolveBrandLogo({ logo: "/_static/papermark-p.svg" }), {
    kind: "custom",
    src: "/_static/papermark-p.svg",
  });
});

test("merges dataroom logo settings while preserving nullable hide overrides", () => {
  assert.deepEqual(
    mergeBrandLogoFields({
      dataroom: { logo: null, hideLogo: null },
      team: {
        logo: "https://assets.example.com/team-logo.png",
        hideLogo: true,
      },
    }),
    { logo: "https://assets.example.com/team-logo.png", hideLogo: true },
  );
  assert.deepEqual(
    mergeBrandLogoFields({
      dataroom: {
        logo: "https://assets.example.com/room-logo.png",
        hideLogo: false,
      },
      team: {
        logo: "https://assets.example.com/team-logo.png",
        hideLogo: true,
      },
    }),
    { logo: "https://assets.example.com/room-logo.png", hideLogo: false },
  );
});

test("classifies only safe banner media and canonical YouTube embeds", () => {
  assert.deepEqual(classifyDataroomBanner("no-banner"), { kind: "none" });
  assert.deepEqual(classifyDataroomBanner("javascript:alert(1)"), {
    kind: "none",
  });
  assert.deepEqual(classifyDataroomBanner("data:text/html,unsafe"), {
    kind: "none",
  });
  assert.deepEqual(classifyDataroomBanner("//attacker.example/banner.mp4"), {
    kind: "none",
  });
  assert.deepEqual(
    classifyDataroomBanner("https://evil-youtube.com/watch?v=dQw4w9WgXcQ"),
    { kind: "image", src: "https://evil-youtube.com/watch?v=dQw4w9WgXcQ" },
  );
  assert.deepEqual(
    classifyDataroomBanner("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    {
      kind: "youtube",
      src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      youtubeId: "dQw4w9WgXcQ",
    },
  );
  assert.deepEqual(
    classifyDataroomBanner("https://cdn.example.com/banner.MP4?version=1"),
    { kind: "video", src: "https://cdn.example.com/banner.MP4?version=1" },
  );
});

test("accepts only supported persisted dataroom layout values and falls back safely", () => {
  assert.equal(DataroomCardLayoutSchema.parse("LIST"), "LIST");
  assert.equal(DataroomCardLayoutSchema.parse("GRID"), "GRID");
  assert.equal(DataroomCardLayoutSchema.parse("COMPACT"), "COMPACT");
  assert.equal(DataroomViewerHeaderStyleSchema.parse("DEFAULT"), "DEFAULT");
  assert.equal(DataroomViewerHeaderStyleSchema.parse("SPLIT"), "SPLIT");
  assert.equal(DataroomViewerHeaderStyleSchema.parse("NOTION"), "NOTION");
  assert.equal(DataroomViewerLayoutPresetSchema.parse("CUSTOM"), "CUSTOM");

  for (const invalidValue of [undefined, null, "grid", "SCRIPT", 1]) {
    assert.equal(asDataroomCardLayout(invalidValue), "LIST");
    assert.equal(asDataroomViewerHeaderStyle(invalidValue), "DEFAULT");
  }
  assert.equal(DataroomCardLayoutSchema.safeParse("SCRIPT").success, false);
  assert.equal(
    DataroomViewerHeaderStyleSchema.safeParse("SCRIPT").success,
    false,
  );
});

test("infers named layout presets only for their exact supported combinations", () => {
  assert.equal(
    inferDataroomViewerLayoutPreset({
      cardLayout: "LIST",
      showFolderTree: true,
      hideFolderIconsInMain: false,
      viewerHeaderStyle: "DEFAULT",
    }),
    "STANDARD",
  );
  assert.equal(
    inferDataroomViewerLayoutPreset({
      cardLayout: "COMPACT",
      showFolderTree: false,
      hideFolderIconsInMain: true,
      viewerHeaderStyle: "SPLIT",
    }),
    "MODERN",
  );
  assert.equal(
    inferDataroomViewerLayoutPreset({
      cardLayout: "GRID",
      showFolderTree: false,
      hideFolderIconsInMain: false,
      viewerHeaderStyle: "NOTION",
    }),
    "NOTION",
  );
  assert.equal(
    inferDataroomViewerLayoutPreset({
      cardLayout: "GRID",
      showFolderTree: true,
      hideFolderIconsInMain: false,
      viewerHeaderStyle: "NOTION",
    }),
    "CUSTOM",
  );
});

test("classifies logo tone from visible pixels while ignoring transparent canvas pixels", () => {
  assert.equal(getLogoToneFromPixels([255, 255, 255, 255]), "light");
  assert.equal(getLogoToneFromPixels([0, 0, 0, 255]), "dark");
  assert.equal(
    getLogoToneFromPixels([
      255,
      255,
      255,
      0, // transparent canvas padding
      0,
      0,
      0,
      255, // visible black logo
    ]),
    "dark",
  );
  assert.equal(getLogoToneFromPixels([]), "dark");
});

test("parses only safe, supported branding preview query values", () => {
  assert.deepEqual(
    parseBrandingPreviewParams({
      brandColor: "#123456",
      accentColor: "#abc",
      accentButtonColor: "#abcdef",
      brandLogo: "https://assets.example.com/logo.png",
      hideLogo: "1",
      ctaLabel: "Learn more",
      ctaUrl: "https://example.com/learn-more",
      welcomeMessage: "Welcome to the data room",
    }),
    {
      brandColor: "#123456",
      accentColor: "#abc",
      accentButtonColor: "#abcdef",
      brandLogo: "https://assets.example.com/logo.png",
      hideLogo: "1",
      ctaLabel: "Learn more",
      ctaUrl: "https://example.com/learn-more",
      welcomeMessage: "Welcome to the data room",
    },
  );
});

test("drops malformed, executable, and oversized branding preview query values", () => {
  assert.deepEqual(
    parseBrandingPreviewParams({
      brandColor: "red; background: url(https://attacker.example)",
      accentColor: "url(javascript:alert(1))",
      accentButtonColor: ["#123456", "#abcdef"],
      brandLogo: "data:text/html,<script>alert(1)</script>",
      hideLogo: "true",
      ctaLabel: "<img src=x onerror=alert(1)>",
      ctaUrl: "javascript:alert(1)",
      welcomeMessage: "x".repeat(501),
    }),
    {},
  );
});
