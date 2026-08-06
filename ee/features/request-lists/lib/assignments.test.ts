import assert from "node:assert/strict";
import test from "node:test";

import { isViewerAssigned } from "./assignments";

const viewer = {
  viewerId: "viewer_1",
  email: "viewer@example.com",
  linkId: "link_1",
  groupIds: new Set(["group_1"]),
};

test("authorizes a viewer assigned directly, by email, link, or group", () => {
  assert.equal(isViewerAssigned([{ viewerId: "viewer_1" }], viewer), true);
  assert.equal(
    isViewerAssigned([{ email: "VIEWER@EXAMPLE.COM" }], viewer),
    true,
  );
  assert.equal(isViewerAssigned([{ linkId: "link_1" }], viewer), true);
  assert.equal(isViewerAssigned([{ groupId: "group_1" }], viewer), true);
});

test("fails closed for unavailable, incomplete, and non-matching assignments", () => {
  assert.equal(isViewerAssigned(undefined, viewer), false);
  assert.equal(isViewerAssigned(null, viewer), false);
  assert.equal(isViewerAssigned([], viewer), false);
  assert.equal(isViewerAssigned([{ viewerId: "viewer_2" }], viewer), false);
  assert.equal(isViewerAssigned([{ email: "other@example.com" }], viewer), false);
  assert.equal(isViewerAssigned([{ groupId: "group_2" }], viewer), false);
  assert.equal(
    isViewerAssigned([{ viewerId: "viewer_1", linkId: "link_1" }], viewer),
    false,
  );
});

test("does not treat absent viewer identity values as assignments", () => {
  assert.equal(
    isViewerAssigned([{ email: "viewer@example.com" }], {
      viewerId: "viewer_1",
      email: null,
      linkId: "link_1",
      groupIds: new Set(),
    }),
    false,
  );
  assert.equal(
    isViewerAssigned([{ linkId: "link_1" }], {
      viewerId: "viewer_1",
      email: "viewer@example.com",
      linkId: "",
      groupIds: new Set(),
    }),
    false,
  );
});
