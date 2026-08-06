import assert from "node:assert/strict";
import test from "node:test";

import { VIEWER_TOGGLE_REQUEST_LIST_EVENT } from "./events";

test("uses a namespaced request-list event that cannot navigate or grant access", () => {
  assert.equal(VIEWER_TOGGLE_REQUEST_LIST_EVENT, "viewer-request-list-toggle");
  assert.match(VIEWER_TOGGLE_REQUEST_LIST_EVENT, /^viewer-/);
  assert.doesNotMatch(VIEWER_TOGGLE_REQUEST_LIST_EVENT, /^(?:https?:|\/)/);
});
