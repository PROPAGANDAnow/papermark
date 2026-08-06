/**
 * Vercel Blob is the default document transport. Documents are uploaded as
 * private Blob objects; S3 remains an explicit opt-in for deployments that need it.
 */
export const isS3Transport = () =>
  process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT?.toLowerCase() === "s3";

export const isVercelBlobTransport = () => !isS3Transport();

export const assertDocumentUploadTransport = () => {
  if (!isS3Transport() && !isVercelBlobTransport()) {
    throw new Error("Unsupported document upload transport.");
  }
};

export const assertS3Transport = () => {
  if (!isS3Transport()) {
    throw new Error(
      'This operation requires NEXT_PUBLIC_UPLOAD_TRANSPORT="s3".',
    );
  }
};
