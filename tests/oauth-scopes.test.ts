import assert from "node:assert/strict";
import test from "node:test";

import { GRANULAR_SCOPES, PRESET_SCOPES } from "../lib/oauth/scopes";

test("exposes only the token settings presets and resource permissions", () => {
  assert.deepEqual(PRESET_SCOPES, ["apis.all", "apis.read"]);
  assert.deepEqual(GRANULAR_SCOPES, [
    "documents.read",
    "documents.write",
    "links.read",
    "links.write",
    "datarooms.read",
    "datarooms.write",
    "analytics.read",
    "visitors.read",
  ]);
});

test("does not grant write permissions for read-only token resources", () => {
  const scopes = GRANULAR_SCOPES as readonly string[];
  assert.equal(scopes.includes("analytics.write"), false);
  assert.equal(scopes.includes("visitors.write"), false);
});
