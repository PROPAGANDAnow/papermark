import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMissingDefaultPermissionRows,
  normalizeDefaultPermissionFlags,
} from "../lib/dataroom/default-permission-rows";

test("normalizes defaults so download can never be granted without view", () => {
  assert.deepEqual(
    normalizeDefaultPermissionFlags({ canView: false, canDownload: true }),
    { canView: true, canDownload: true },
  );
  assert.deepEqual(
    normalizeDefaultPermissionFlags({ canView: false, canDownload: false }),
    { canView: false, canDownload: false },
  );
});

test("creates only missing rows for groups in the target dataroom and team", () => {
  const rows = buildMissingDefaultPermissionRows({
    targetDataroomId: "room-a",
    targetTeamId: "team-a",
    documentIds: ["document-a"],
    groups: [
      { id: "allowed", dataroomId: "room-a", teamId: "team-a" },
      { id: "other-room", dataroomId: "room-b", teamId: "team-a" },
      { id: "other-team", dataroomId: "room-a", teamId: "team-b" },
    ],
    existingRows: [{ groupId: "allowed", itemId: "document-a" }],
    flags: { canView: true, canDownload: true },
  });

  assert.deepEqual(rows, []);
});

test("does not widen inherited permissions and retains explicit denies", () => {
  const rows = buildMissingDefaultPermissionRows({
    targetDataroomId: "room-a",
    targetTeamId: "team-a",
    documentIds: ["document-a"],
    groups: [{ id: "allowed", dataroomId: "room-a", teamId: "team-a" }],
    existingRows: [],
    flags: { canView: false, canDownload: true },
  });

  assert.deepEqual(rows, [
    {
      groupId: "allowed",
      itemId: "document-a",
      canView: true,
      canDownload: true,
    },
  ]);
});
