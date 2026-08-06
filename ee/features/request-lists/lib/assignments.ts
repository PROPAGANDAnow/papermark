/**
 * The fields selected from `TaskAssignment` when authorizing a viewer. A valid
 * assignment targets exactly one identity; malformed rows are deliberately
 * ignored so they can never broaden access.
 */
export type ViewerTaskAssignment = Readonly<{
  viewerId?: string | null;
  email?: string | null;
  groupId?: string | null;
  linkId?: string | null;
}>;

export type ViewerAssignmentIdentity = Readonly<{
  viewerId?: string | null;
  email?: string | null;
  linkId?: string | null;
  groupIds?: ReadonlySet<string> | null;
}>;

const nonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

const normalizedEmail = (value: unknown): string | null => {
  if (!nonEmptyString(value)) {
    return null;
  }

  const email = value.trim().toLowerCase();
  return email.length > 0 ? email : null;
};

/**
 * Returns true only when a valid, single-target task assignment matches the
 * authenticated viewer. This is intentionally fail-closed: unavailable input,
 * malformed assignments, and incomplete viewer identity never grant access.
 */
export function isViewerAssigned(
  assignments: readonly ViewerTaskAssignment[] | null | undefined,
  viewer: ViewerAssignmentIdentity | null | undefined,
): boolean {
  if (!Array.isArray(assignments) || !viewer) {
    return false;
  }

  const viewerEmail = normalizedEmail(viewer.email);

  return assignments.some((assignment) => {
    if (!assignment || typeof assignment !== "object") {
      return false;
    }

    const targets = [
      nonEmptyString(assignment.viewerId) ? "viewer" : null,
      normalizedEmail(assignment.email) ? "email" : null,
      nonEmptyString(assignment.groupId) ? "group" : null,
      nonEmptyString(assignment.linkId) ? "link" : null,
    ].filter((target): target is string => target !== null);

    if (targets.length !== 1) {
      return false;
    }

    switch (targets[0]) {
      case "viewer":
        return (
          nonEmptyString(viewer.viewerId) &&
          assignment.viewerId === viewer.viewerId
        );
      case "email":
        return (
          viewerEmail !== null && normalizedEmail(assignment.email) === viewerEmail
        );
      case "group":
        return (
          nonEmptyString(assignment.groupId) &&
          viewer.groupIds?.has(assignment.groupId) === true
        );
      case "link":
        return (
          nonEmptyString(viewer.linkId) && assignment.linkId === viewer.linkId
        );
      default:
        return false;
    }
  });
}
