import assert from "node:assert/strict";
import test from "node:test";

import {
  mergeBrandLogoFields,
  resolveBrandLogo,
} from "../ee/features/branding/lib/brand-logo";
import { classifyDataroomBanner } from "../ee/features/branding/lib/dataroom-banner";

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
