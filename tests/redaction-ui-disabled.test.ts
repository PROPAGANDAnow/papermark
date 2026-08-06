import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const repositoryRoot = process.cwd();

const unavailableRedactionModules = [
  "@/ee/features/redaction/components/redaction-jobs-dialog",
  "@/ee/features/redaction/components/redaction-config-dialog",
  "@/ee/features/redaction/components/redaction-workspace",
  "@/ee/features/redaction/components/redaction-launcher",
];

test("does not expose UI for the incomplete redaction feature", () => {
  const documentHeader = readFileSync(
    join(repositoryRoot, "components/documents/document-header.tsx"),
    "utf8",
  );

  for (const modulePath of unavailableRedactionModules) {
    assert.doesNotMatch(documentHeader, new RegExp(modulePath));
  }

  const documentPage = readFileSync(
    join(repositoryRoot, "pages/documents/[id]/index.tsx"),
    "utf8",
  );

  for (const modulePath of unavailableRedactionModules) {
    assert.doesNotMatch(documentPage, new RegExp(modulePath));
  }

  assert.doesNotMatch(documentHeader, /Redaction jobs/);
  assert.equal(
    existsSync(
      join(repositoryRoot, "pages/documents/[id]/redactions/[jobId].tsx"),
    ),
    false,
  );
});
