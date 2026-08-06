import assert from "node:assert/strict";
import test from "node:test";

import { shouldRenderConfidentialViewControl } from "./confidential-view-section";

test("does not render an unenforced confidential-view control", () => {
  assert.equal(shouldRenderConfidentialViewControl(), false);
});
