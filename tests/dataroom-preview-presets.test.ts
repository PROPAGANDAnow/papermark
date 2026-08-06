import assert from "node:assert/strict";
import test from "node:test";

import { getDataroomPreviewDataset } from "../ee/features/branding/lib/dataroom-preview-presets";

test("returns a fresh, curated preview dataset without external media or HTML", () => {
  const preview = getDataroomPreviewDataset();

  assert.deepEqual(
    preview.folders.map(({ id, name, path, parentId }) => ({
      id,
      name,
      path,
      parentId,
    })),
    [
      {
        id: "preview-company",
        name: "Company Overview",
        path: "/company-overview",
        parentId: null,
      },
      {
        id: "preview-financials",
        name: "Financials",
        path: "/financials",
        parentId: null,
      },
    ],
  );
  assert.deepEqual(
    preview.documents.map(({ id, name, folderName, versions }) => ({
      id,
      name,
      folderName,
      type: versions[0]?.type,
    })),
    [
      {
        id: "preview-executive-summary",
        name: "Executive Summary.pdf",
        folderName: "Company Overview",
        type: "pdf",
      },
      {
        id: "preview-financial-statements",
        name: "Financial Statements.xlsx",
        folderName: "Financials",
        type: "xlsx",
      },
    ],
  );
  assert.equal(JSON.stringify(preview).includes("http"), false);
  assert.equal(JSON.stringify(preview).includes("<"), false);

  preview.folders[0].name = "Changed by caller";
  preview.documents[0].versions[0].type = "html";

  const nextPreview = getDataroomPreviewDataset();
  assert.equal(nextPreview.folders[0].name, "Company Overview");
  assert.equal(nextPreview.documents[0].versions[0].type, "pdf");
});
