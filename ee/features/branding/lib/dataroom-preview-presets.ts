import type { DataroomFolder } from "@prisma/client";

import type { DocumentVersion } from "@/components/view/viewer/dataroom-viewer";

type DataroomPreviewDocument = {
  dataroomDocumentId: string;
  id: string;
  name: string;
  folderName: string | null;
  downloadOnly: boolean;
  canDownload: boolean;
  hierarchicalIndex: string | null;
  versions: DocumentVersion[];
};

export type DataroomPreviewDataset = {
  folders: DataroomFolder[];
  documents: DataroomPreviewDocument[];
};

const PREVIEW_DATE = "2024-01-01T00:00:00.000Z";

// This is intentionally a fixed, source-controlled allowlist. The branding
// preview is public and must never turn saved input into media URLs or markup.
const PRESET_FOLDERS = [
  {
    id: "preview-company",
    name: "Company Overview",
    path: "/company-overview",
    parentId: null,
    icon: "folder",
    color: "blue",
    dataroomId: "preview-dataroom",
    orderIndex: 0,
    hierarchicalIndex: "1",
  },
  {
    id: "preview-financials",
    name: "Financials",
    path: "/financials",
    parentId: null,
    icon: "folder",
    color: "green",
    dataroomId: "preview-dataroom",
    orderIndex: 1,
    hierarchicalIndex: "2",
  },
] as const;

const PRESET_DOCUMENTS = [
  {
    id: "preview-executive-summary",
    dataroomDocumentId: "preview-executive-summary",
    name: "Executive Summary.pdf",
    folderName: "Company Overview",
    downloadOnly: false,
    canDownload: false,
    hierarchicalIndex: "1.1",
    version: {
      id: "preview-executive-summary-version",
      type: "pdf",
      versionNumber: 1,
      hasPages: true,
      isVertical: true,
    },
  },
  {
    id: "preview-financial-statements",
    dataroomDocumentId: "preview-financial-statements",
    name: "Financial Statements.xlsx",
    folderName: "Financials",
    downloadOnly: false,
    canDownload: false,
    hierarchicalIndex: "2.1",
    version: {
      id: "preview-financial-statements-version",
      type: "xlsx",
      versionNumber: 1,
      hasPages: false,
      isVertical: false,
    },
  },
] as const;

/**
 * Return a new copy of the fixed branding-preview content.
 *
 * There are no arguments by design: the preview can only render these curated
 * strings and document types, rather than caller-provided URLs or HTML.
 */
export function getDataroomPreviewDataset(): DataroomPreviewDataset {
  return {
    folders: PRESET_FOLDERS.map((folder) => ({
      ...folder,
      createdAt: new Date(PREVIEW_DATE),
      updatedAt: new Date(PREVIEW_DATE),
    })),
    documents: PRESET_DOCUMENTS.map((document) => ({
      id: document.id,
      dataroomDocumentId: document.dataroomDocumentId,
      name: document.name,
      folderName: document.folderName,
      downloadOnly: document.downloadOnly,
      canDownload: document.canDownload,
      hierarchicalIndex: document.hierarchicalIndex,
      versions: [
        {
          ...document.version,
          updatedAt: new Date(PREVIEW_DATE),
        },
      ],
    })),
  };
}
