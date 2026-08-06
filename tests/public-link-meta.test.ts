import assert from "node:assert/strict";
import test from "node:test";

import { resolvePublicLinkMeta } from "../ee/features/branding/lib/resolve-public-link-meta";

const defaultTitle = "Investor materials | Powered by Papermark";

function resolve(
  overrides: Partial<Parameters<typeof resolvePublicLinkMeta>[0]> = {},
) {
  return resolvePublicLinkMeta({
    link: {
      enableCustomMetatag: false,
      metaTitle: null,
      metaDescription: null,
      metaImage: null,
      metaFavicon: null,
    },
    teamBrand: null,
    dataroomBrand: null,
    defaultTitle,
    ...overrides,
  });
}

test("uses a per-link preview without exposing inherited branding fields", () => {
  assert.deepEqual(
    resolve({
      link: {
        enableCustomMetatag: true,
        metaTitle: "Private link title",
        metaDescription: null,
        metaImage: "https://cdn.example.com/link.png",
        metaFavicon: null,
      },
      teamBrand: {
        customLinkPreviewEnabled: true,
        linkPreviewTitle: "Team title",
        linkPreviewDescription: "Team description",
        linkPreviewImage: "https://cdn.example.com/team.png",
        linkPreviewFavicon: "https://cdn.example.com/team.ico",
      },
    }),
    {
      enableCustomMetatag: true,
      metaTitle: "Private link title",
      metaDescription: null,
      metaImage: "https://cdn.example.com/link.png",
      metaFavicon: "/favicon.ico",
    },
  );
});

test("cascades enabled dataroom previews through enabled team defaults", () => {
  assert.deepEqual(
    resolve({
      teamBrand: {
        customLinkPreviewEnabled: true,
        linkPreviewTitle: "Team title",
        linkPreviewDescription: "Team description",
        linkPreviewImage: "https://cdn.example.com/team.png",
        linkPreviewFavicon: "https://cdn.example.com/team.ico",
      },
      dataroomBrand: {
        customLinkPreviewEnabled: true,
        linkPreviewTitle: "Dataroom title",
        linkPreviewDescription: null,
        linkPreviewImage: null,
        linkPreviewFavicon: "https://cdn.example.com/room.ico",
      },
    }),
    {
      enableCustomMetatag: true,
      metaTitle: "Dataroom title",
      metaDescription: "Team description",
      metaImage: "https://cdn.example.com/team.png",
      metaFavicon: "https://cdn.example.com/room.ico",
    },
  );
});

test("fails closed for disabled previews and unsafe public metadata", () => {
  assert.deepEqual(
    resolve({
      link: {
        enableCustomMetatag: false,
        metaTitle: "Stored but disabled",
        metaDescription: "Stored but disabled",
        metaImage: "javascript:alert(1)",
        metaFavicon: "data:image/svg+xml,<svg onload=alert(1) />",
      },
      teamBrand: {
        customLinkPreviewEnabled: false,
        linkPreviewTitle: "Disabled team title",
        linkPreviewDescription: "Disabled team description",
        linkPreviewImage: "https://cdn.example.com/team.png",
        linkPreviewFavicon: "https://cdn.example.com/team.ico",
      },
      dataroomBrand: {
        customLinkPreviewEnabled: true,
        linkPreviewTitle: "\u0000unsafe title",
        linkPreviewDescription: "\u0000unsafe description",
        linkPreviewImage: "//attacker.example/image.png",
        linkPreviewFavicon: "http://attacker.example/favicon.ico",
      },
    }),
    {
      enableCustomMetatag: true,
      metaTitle: defaultTitle,
      metaDescription: null,
      metaImage: null,
      metaFavicon: "/favicon.ico",
    },
  );
});

test("falls back to a safe generic title when a generated default is malformed", () => {
  const result = resolvePublicLinkMeta({
    link: {
      enableCustomMetatag: true,
      metaTitle: null,
      metaDescription: null,
      metaImage: null,
      metaFavicon: null,
    },
    teamBrand: null,
    dataroomBrand: null,
    defaultTitle: "\u0000untrusted document name",
  });

  assert.equal(result.metaTitle, "Shared link | Powered by Papermark");
});

test("uses safe inline raster assets while rejecting executable or malformed URLs", () => {
  const png = "data:image/png;base64,aGVsbG8=";
  assert.deepEqual(
    resolve({
      link: {
        enableCustomMetatag: true,
        metaTitle: "  Custom title  ",
        metaDescription: "  Custom description  ",
        metaImage: png,
        metaFavicon: "/_static/custom-icon.png",
      },
    }),
    {
      enableCustomMetatag: true,
      metaTitle: "Custom title",
      metaDescription: "Custom description",
      metaImage: png,
      metaFavicon: "/_static/custom-icon.png",
    },
  );
});
