import assert from "node:assert/strict";
import test from "node:test";

import { requestListFeatureEnabled } from "./use-request-list-feature";

test("enables Request List only for Data Rooms Plus or an explicit team flag", () => {
  assert.equal(requestListFeatureEnabled("datarooms-plus", false), true);
  assert.equal(requestListFeatureEnabled("datarooms-premium", false), true);
  assert.equal(requestListFeatureEnabled("datarooms", false), false);
  assert.equal(requestListFeatureEnabled("free", true), true);
});

test("fails closed while plan and feature-flag data are unavailable", () => {
  assert.equal(requestListFeatureEnabled(undefined, undefined), false);
  assert.equal(requestListFeatureEnabled("free", false), false);
});
