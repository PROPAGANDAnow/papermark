import assert from "node:assert/strict";
import test from "node:test";

import {
  assertDocumentUploadTransport,
  isVercelBlobTransport,
} from "../lib/files/transport";

test("uses Vercel Blob as the default document upload transport without S3 configuration", () => {
  const previous = process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT;
  delete process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT;

  try {
    assert.equal(isVercelBlobTransport(), true);
    assert.doesNotThrow(() => assertDocumentUploadTransport());
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT;
    else process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT = previous;
  }
});
