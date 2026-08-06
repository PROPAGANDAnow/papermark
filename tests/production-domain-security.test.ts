import { DocumentStorageType } from "@prisma/client";
import assert from "node:assert/strict";
import test from "node:test";

import { getSessionCookieOptions } from "../lib/auth/cookie-options";
import { getFile } from "../lib/files/get-file";
import {
  createPrivateBlobProxyUrl,
  verifyPrivateBlobAccessToken,
} from "../lib/files/private-blob-access";
import { isApplicationHost } from "../lib/middleware/host-selection";

test("uses a host-only secure session cookie on custom Vercel deployments", () => {
  const options = getSessionCookieOptions({
    vercelUrl: "share.propaganda.build",
    nodeEnv: "production",
  });

  assert.equal(options.name, "__Secure-next-auth.session-token");
  assert.equal(options.options.secure, true);
  assert.equal(options.options.domain, undefined);
});

test("routes the configured application host through application middleware", () => {
  assert.equal(
    isApplicationHost("share.propaganda.build:443", "share.propaganda.build"),
    true,
  );
  assert.equal(
    isApplicationHost("customer.example.com", "share.propaganda.build"),
    false,
  );
});

test("turns a private blob URL into a short-lived protected proxy capability", () => {
  const rawBlobUrl =
    "https://store.public.blob.vercel-storage.com/documents/team/doc/file.pdf";
  const secret = "test-private-blob-secret";
  const proxyUrl = createPrivateBlobProxyUrl(rawBlobUrl, secret);

  assert.match(proxyUrl, /^\/api\/file\/vercel-blob\?token=/);
  assert.doesNotMatch(proxyUrl, /store\.public\.blob/);

  const token = new URL(`https://app.example${proxyUrl}`).searchParams.get(
    "token",
  );
  assert.ok(token);
  assert.deepEqual(verifyPrivateBlobAccessToken(token, secret), {
    blobUrl: rawBlobUrl,
    download: false,
  });
});

test("preserves download intent in a private Blob proxy capability", () => {
  const rawBlobUrl =
    "https://store.public.blob.vercel-storage.com/documents/team/doc/file.pdf";
  const secret = "test-private-blob-secret";
  const proxyUrl = createPrivateBlobProxyUrl(rawBlobUrl, secret, true);
  const token = new URL(`https://app.example${proxyUrl}`).searchParams.get(
    "token",
  );

  assert.ok(token);
  assert.deepEqual(verifyPrivateBlobAccessToken(token, secret), {
    blobUrl: rawBlobUrl,
    download: true,
  });
});

test("returns a protected proxy URL from the document retrieval flow for private Blob files", async () => {
  const previous = process.env.NEXTAUTH_SECRET;
  process.env.NEXTAUTH_SECRET = "test-private-blob-secret";

  try {
    const url = await getFile({
      type: DocumentStorageType.VERCEL_BLOB,
      data: "https://store.public.blob.vercel-storage.com/documents/team/doc/file.pdf",
    });

    assert.match(url, /^\/api\/file\/vercel-blob\?token=/);
    assert.doesNotMatch(url, /store\.public\.blob/);
  } finally {
    if (previous === undefined) delete process.env.NEXTAUTH_SECRET;
    else process.env.NEXTAUTH_SECRET = previous;
  }
});
