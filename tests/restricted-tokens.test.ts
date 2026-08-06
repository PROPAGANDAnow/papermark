import assert from "node:assert/strict";
import test from "node:test";

import {
  hasRestrictedTokenScope,
  parseRestrictedTokenScopes,
  parseRestrictedTokenSubjectType,
} from "../lib/api/auth/restricted-tokens";

test("restricted tokens deny access when scopes are absent, malformed, or unknown", () => {
  assert.equal(hasRestrictedTokenScope(null, "documents.read"), false);
  assert.equal(hasRestrictedTokenScope("", "documents.read"), false);
  assert.equal(
    hasRestrictedTokenScope(
      "documents.read unrecognized.scope",
      "documents.read",
    ),
    false,
  );
  assert.equal(hasRestrictedTokenScope("apis.all", "not-a-real-scope"), false);
  assert.equal(parseRestrictedTokenScopes("documents.read nope.scope"), null);
});

test("restricted token presets grant only their explicit permission boundaries", () => {
  assert.equal(hasRestrictedTokenScope("apis.all", "documents.write"), true);
  assert.equal(hasRestrictedTokenScope("apis.read", "documents.read"), true);
  assert.equal(hasRestrictedTokenScope("apis.read", "analytics.read"), true);
  assert.equal(hasRestrictedTokenScope("apis.read", "documents.write"), false);
  assert.equal(hasRestrictedTokenScope("apis.read", "links.write"), false);
});

test("restricted token granular scopes never imply broader or sibling access", () => {
  assert.equal(
    hasRestrictedTokenScope("documents.read", "documents.read"),
    true,
  );
  assert.equal(
    hasRestrictedTokenScope("documents.read", "documents.write"),
    false,
  );
  assert.equal(
    hasRestrictedTokenScope("documents.write", "documents.read"),
    false,
  );
  assert.equal(hasRestrictedTokenScope("documents.read", "links.read"), false);
  assert.equal(
    hasRestrictedTokenScope("apis.read documents.write", "documents.write"),
    false,
  );
});

test("unknown restricted-token subject types fall back to revocable user tokens", () => {
  assert.equal(parseRestrictedTokenSubjectType("machine"), "machine");
  assert.equal(parseRestrictedTokenSubjectType("user"), "user");
  assert.equal(parseRestrictedTokenSubjectType("MACHINE"), "user");
  assert.equal(parseRestrictedTokenSubjectType("service"), "user");
});
