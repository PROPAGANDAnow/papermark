import type { Task } from "@trigger.dev/sdk";

/**
 * Payload accepted by the externally deployed document-to-PDF conversion task.
 *
 * This is intentionally type-only: API routes dispatch the task by its stable
 * Trigger.dev identifier and must not import a conversion worker at runtime.
 */
export type ConvertFilesToPdfPayload = {
  documentId: string;
  documentVersionId: string;
  teamId: string;
};

export type convertFilesToPdfTask = Task<
  "convert-files-to-pdf",
  ConvertFilesToPdfPayload,
  void
>;
