import {
  DefaultPermissionStrategy,
  ItemType,
  RootItemAccess,
} from "@prisma/client";

import {
  type ScopedPermissionGroup,
  buildMissingDefaultPermissionRows,
} from "@/lib/dataroom/default-permission-rows";
import { resolveRootItemAccessFlags } from "@/lib/dataroom/root-item-access";
import prisma from "@/lib/prisma";

type DataroomDocumentInput = {
  id: string;
  folderId: string | null;
};

type ScopedGroup = ScopedPermissionGroup;

/**
 * Apply a dataroom's defaults after documents have been attached. Callers may
 * schedule the work off-request-path, but the database reads remain scoped to
 * the dataroom and its owning team so an arbitrary document/group id can never
 * cause permissions to be copied across rooms.
 */
export async function onDataroomDocumentsAttached({
  dataroomId,
  dataroomDocuments,
  schedule,
}: {
  dataroomId: string;
  dataroomDocuments: DataroomDocumentInput[];
  schedule?: (work: Promise<void>) => unknown;
}): Promise<void> {
  const work = applyStoredDataroomDocumentPermissionDefaults({
    dataroomId,
    dataroomDocuments,
  });

  if (schedule) {
    schedule(work);
    return;
  }

  await work;
}

/** Apply explicitly selected strategies to documents already in a dataroom. */
export async function applyDataroomDocumentPermissionDefaults({
  dataroomId,
  dataroomDocuments,
  groupStrategy,
  groupRootItemAccess,
  linkStrategy,
  linkRootItemAccess,
}: {
  dataroomId: string;
  dataroomDocuments: DataroomDocumentInput[];
  groupStrategy: DefaultPermissionStrategy;
  groupRootItemAccess: RootItemAccess;
  linkStrategy: DefaultPermissionStrategy;
  linkRootItemAccess: RootItemAccess;
}): Promise<void> {
  const dataroom = await prisma.dataroom.findUnique({
    where: { id: dataroomId },
    select: { id: true, teamId: true },
  });
  if (!dataroom) return;

  const documents = await findOwnedDataroomDocuments(
    dataroomId,
    dataroomDocuments,
  );
  if (documents.length === 0) return;

  await Promise.all([
    applyViewerGroupDefaults({
      dataroomId,
      teamId: dataroom.teamId,
      documents,
      strategy: groupStrategy,
      rootItemAccess: groupRootItemAccess,
    }),
    applyPermissionGroupDefaults({
      dataroomId,
      teamId: dataroom.teamId,
      documents,
      strategy: linkStrategy,
      rootItemAccess: linkRootItemAccess,
    }),
  ]);
}

async function applyStoredDataroomDocumentPermissionDefaults({
  dataroomId,
  dataroomDocuments,
}: {
  dataroomId: string;
  dataroomDocuments: DataroomDocumentInput[];
}): Promise<void> {
  const dataroom = await prisma.dataroom.findUnique({
    where: { id: dataroomId },
    select: {
      id: true,
      teamId: true,
      defaultPermissionStrategy: true,
      defaultGroupPermissionStrategy: true,
      defaultRootItemAccess: true,
      defaultGroupRootItemAccess: true,
    },
  });
  if (!dataroom) return;

  await applyDataroomDocumentPermissionDefaults({
    dataroomId,
    dataroomDocuments,
    groupStrategy: dataroom.defaultGroupPermissionStrategy,
    groupRootItemAccess: dataroom.defaultGroupRootItemAccess,
    linkStrategy: dataroom.defaultPermissionStrategy,
    linkRootItemAccess: dataroom.defaultRootItemAccess,
  });
}

async function findOwnedDataroomDocuments(
  dataroomId: string,
  documents: DataroomDocumentInput[],
): Promise<DataroomDocumentInput[]> {
  const ids = Array.from(new Set(documents.map((document) => document.id)));
  if (ids.length === 0) return [];

  // Do not trust caller-provided folder ids. Both the item and its containing
  // folder must resolve within this room before any ACL is written. The schema
  // relation alone does not prove that a non-null folder id belongs to the same
  // room, so reject malformed/cross-room associations rather than inheriting
  // from an arbitrary folder ACL.
  const ownedDocuments = await prisma.dataroomDocument.findMany({
    where: { id: { in: ids }, dataroomId },
    select: {
      id: true,
      folderId: true,
      folder: { select: { dataroomId: true } },
    },
  });

  return ownedDocuments.flatMap((document) =>
    document.folderId && document.folder?.dataroomId !== dataroomId
      ? []
      : [{ id: document.id, folderId: document.folderId }],
  );
}

async function applyViewerGroupDefaults({
  dataroomId,
  teamId,
  documents,
  strategy,
  rootItemAccess,
}: {
  dataroomId: string;
  teamId: string;
  documents: DataroomDocumentInput[];
  strategy: DefaultPermissionStrategy;
  rootItemAccess: RootItemAccess;
}): Promise<void> {
  if (strategy !== DefaultPermissionStrategy.INHERIT_FROM_PARENT) return;

  const groups = await prisma.viewerGroup.findMany({
    where: { dataroomId, teamId },
    select: { id: true, dataroomId: true, teamId: true },
  });
  if (groups.length === 0) return;

  const parentRows = await prisma.viewerGroupAccessControls.findMany({
    where: {
      itemId: { in: folderIds(documents) },
      itemType: ItemType.DATAROOM_FOLDER,
      group: { dataroomId, teamId },
    },
    select: { groupId: true, itemId: true, canView: true, canDownload: true },
  });
  const permittedGroups = new Set(groups.map((group) => group.id));
  const documentsByFolder = groupDocumentsByFolder(documents);
  const inheritedRows = parentRows.flatMap((row) =>
    !permittedGroups.has(row.groupId)
      ? []
      : (documentsByFolder.get(row.itemId) ?? []).map((document) => ({
          groupId: row.groupId,
          itemId: document.id,
          itemType: ItemType.DATAROOM_DOCUMENT,
          // Copy the existing parent decision verbatim; do not normalize or
          // broaden a pre-existing restrictive parent row.
          canView: row.canView,
          canDownload: row.canDownload,
        })),
  );
  const rootRows = buildRootRows({
    dataroomId,
    teamId,
    groups,
    documents: documents.filter((document) => !document.folderId),
    rootItemAccess,
  }).map((row) => ({ ...row, itemType: ItemType.DATAROOM_DOCUMENT }));

  if (inheritedRows.length + rootRows.length > 0) {
    await prisma.viewerGroupAccessControls.createMany({
      data: [...inheritedRows, ...rootRows],
      // Existing ACL rows are explicit decisions and must always win over a
      // newly selected/default strategy.
      skipDuplicates: true,
    });
  }
}

async function applyPermissionGroupDefaults({
  dataroomId,
  teamId,
  documents,
  strategy,
  rootItemAccess,
}: {
  dataroomId: string;
  teamId: string;
  documents: DataroomDocumentInput[];
  strategy: DefaultPermissionStrategy;
  rootItemAccess: RootItemAccess;
}): Promise<void> {
  if (strategy !== DefaultPermissionStrategy.INHERIT_FROM_PARENT) return;

  const groups = await prisma.permissionGroup.findMany({
    where: { dataroomId, teamId },
    select: { id: true, dataroomId: true, teamId: true },
  });
  if (groups.length === 0) return;

  const parentRows = await prisma.permissionGroupAccessControls.findMany({
    where: {
      itemId: { in: folderIds(documents) },
      itemType: ItemType.DATAROOM_FOLDER,
      group: { dataroomId, teamId },
    },
    select: {
      groupId: true,
      itemId: true,
      canView: true,
      canDownload: true,
      canDownloadOriginal: true,
    },
  });
  const permittedGroups = new Set(groups.map((group) => group.id));
  const documentsByFolder = groupDocumentsByFolder(documents);
  const inheritedRows = parentRows.flatMap((row) =>
    !permittedGroups.has(row.groupId)
      ? []
      : (documentsByFolder.get(row.itemId) ?? []).map((document) => ({
          groupId: row.groupId,
          itemId: document.id,
          itemType: ItemType.DATAROOM_DOCUMENT,
          canView: row.canView,
          canDownload: row.canDownload,
          canDownloadOriginal: row.canDownloadOriginal,
        })),
  );
  const rootRows = buildRootRows({
    dataroomId,
    teamId,
    groups,
    documents: documents.filter((document) => !document.folderId),
    rootItemAccess,
  }).map((row) => ({
    ...row,
    itemType: ItemType.DATAROOM_DOCUMENT,
    canDownloadOriginal: false,
  }));

  if (inheritedRows.length + rootRows.length > 0) {
    await prisma.permissionGroupAccessControls.createMany({
      data: [...inheritedRows, ...rootRows],
      skipDuplicates: true,
    });
  }
}

function buildRootRows({
  dataroomId,
  teamId,
  groups,
  documents,
  rootItemAccess,
}: {
  dataroomId: string;
  teamId: string;
  groups: ScopedGroup[];
  documents: DataroomDocumentInput[];
  rootItemAccess: RootItemAccess;
}) {
  const flags = resolveRootItemAccessFlags(rootItemAccess);
  if (!flags || documents.length === 0) return [];

  return buildMissingDefaultPermissionRows({
    targetDataroomId: dataroomId,
    targetTeamId: teamId,
    documentIds: documents.map((document) => document.id),
    groups,
    existingRows: [],
    flags,
  });
}

function folderIds(documents: DataroomDocumentInput[]): string[] {
  return Array.from(
    new Set(
      documents
        .map((document) => document.folderId)
        .filter((folderId): folderId is string => folderId !== null),
    ),
  );
}

function groupDocumentsByFolder(documents: DataroomDocumentInput[]) {
  const byFolder = new Map<string, DataroomDocumentInput[]>();
  for (const document of documents) {
    if (!document.folderId) continue;
    const inFolder = byFolder.get(document.folderId) ?? [];
    inFolder.push(document);
    byFolder.set(document.folderId, inFolder);
  }
  return byFolder;
}
