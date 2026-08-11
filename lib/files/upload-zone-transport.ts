export type UploadZoneStrategy =
  | "vercel-blob"
  | "s3-tus"
  | "s3-multipart";

export function chooseUploadZoneStrategy({
  isS3,
  fileSize,
  multipartThreshold,
}: {
  isS3: boolean;
  fileSize: number;
  multipartThreshold: number;
}): UploadZoneStrategy {
  if (!isS3) return "vercel-blob";
  return fileSize > multipartThreshold ? "s3-multipart" : "s3-tus";
}

export function resolveUploadZoneStorageType<T extends string>(
  strategy: UploadZoneStrategy,
  blobStorageType?: T | null,
): T | "S3_PATH" {
  if (strategy !== "vercel-blob") return "S3_PATH";
  if (!blobStorageType) {
    throw new Error("Blob upload did not return a storage type");
  }
  return blobStorageType;
}
