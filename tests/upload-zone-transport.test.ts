import assert from "node:assert/strict";
import test from "node:test";

import {
  chooseUploadZoneStrategy,
  resolveUploadZoneStorageType,
} from "../lib/files/upload-zone-transport";

test("routes non-S3 UploadZone files through Vercel Blob", () => {
  assert.equal(
    chooseUploadZoneStrategy({
      isS3: false,
      fileSize: 1024,
      multipartThreshold: 10 * 1024 * 1024,
    }),
    "vercel-blob",
  );
});

test("keeps TUS and multipart strategies for S3 uploads", () => {
  const multipartThreshold = 10 * 1024 * 1024;

  assert.equal(
    chooseUploadZoneStrategy({
      isS3: true,
      fileSize: multipartThreshold,
      multipartThreshold,
    }),
    "s3-tus",
  );
  assert.equal(
    chooseUploadZoneStrategy({
      isS3: true,
      fileSize: multipartThreshold + 1,
      multipartThreshold,
    }),
    "s3-multipart",
  );
});

test("preserves Blob storage type instead of hardcoding S3_PATH", () => {
  assert.equal(
    resolveUploadZoneStorageType("vercel-blob", "VERCEL_BLOB"),
    "VERCEL_BLOB",
  );
  assert.equal(resolveUploadZoneStorageType("s3-tus"), "S3_PATH");
  assert.equal(resolveUploadZoneStorageType("s3-multipart"), "S3_PATH");
  assert.throws(
    () => resolveUploadZoneStorageType("vercel-blob"),
    /Blob upload did not return a storage type/,
  );
});
