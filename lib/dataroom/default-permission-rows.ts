export type ScopedPermissionGroup = {
  id: string;
  dataroomId: string;
  teamId: string;
};

export type ExistingPermissionRow = {
  groupId: string;
  itemId: string;
};

export type DefaultPermissionFlags = {
  canView: boolean;
  canDownload: boolean;
};

/** Download access always requires view access. */
export function normalizeDefaultPermissionFlags(
  flags: DefaultPermissionFlags,
): DefaultPermissionFlags {
  return {
    canView: flags.canView || flags.canDownload,
    canDownload: flags.canDownload,
  };
}

/**
 * Build only missing rows for groups owned by the target dataroom/team. An
 * existing ACL row is an explicit decision and is never replaced by a default.
 */
export function buildMissingDefaultPermissionRows({
  targetDataroomId,
  targetTeamId,
  documentIds,
  groups,
  existingRows,
  flags,
}: {
  targetDataroomId: string;
  targetTeamId: string;
  documentIds: string[];
  groups: ScopedPermissionGroup[];
  existingRows: ExistingPermissionRow[];
  flags: DefaultPermissionFlags;
}): Array<{
  groupId: string;
  itemId: string;
  canView: boolean;
  canDownload: boolean;
}> {
  const existing = new Set(
    existingRows.map((row) => `${row.groupId}:${row.itemId}`),
  );
  const normalized = normalizeDefaultPermissionFlags(flags);
  const scopedGroups = groups.filter(
    (group) =>
      group.dataroomId === targetDataroomId && group.teamId === targetTeamId,
  );

  return scopedGroups.flatMap((group) =>
    documentIds.flatMap((itemId) =>
      existing.has(`${group.id}:${itemId}`)
        ? []
        : [{ groupId: group.id, itemId, ...normalized }],
    ),
  );
}
