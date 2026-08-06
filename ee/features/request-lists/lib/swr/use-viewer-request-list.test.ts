import assert from "node:assert/strict";
import test from "node:test";

import { viewerRequestListEnabled } from "./use-viewer-request-list";

test("enables a viewer request list only for an explicit enabled response", () => {
  assert.equal(viewerRequestListEnabled({ enabled: true }), true);
  assert.equal(viewerRequestListEnabled({ enabled: false }), false);
});

test("fails closed for unavailable or malformed viewer request-list data", () => {
  assert.equal(viewerRequestListEnabled(undefined), false);
  assert.equal(viewerRequestListEnabled(null), false);
  assert.equal(viewerRequestListEnabled({}), false);
  assert.equal(viewerRequestListEnabled({ enabled: "true" }), false);
});
