import { sign, verify } from "jsonwebtoken";

const PRIVATE_BLOB_TOKEN_TTL_SECONDS = 5 * 60;
const PRIVATE_BLOB_TOKEN_PURPOSE = "private-blob-proxy";

type PrivateBlobTokenPayload = {
  blobUrl: string;
  download: boolean;
  purpose: typeof PRIVATE_BLOB_TOKEN_PURPOSE;
};

const getSecret = (secret?: string) => {
  if (!secret) {
    throw new Error(
      "NEXTAUTH_SECRET is required to proxy private Vercel Blob files.",
    );
  }
  return secret;
};

export const createPrivateBlobProxyUrl = (
  blobUrl: string,
  secret = process.env.NEXTAUTH_SECRET,
  download = false,
) => {
  const token = sign(
    {
      blobUrl,
      download,
      purpose: PRIVATE_BLOB_TOKEN_PURPOSE,
    } satisfies PrivateBlobTokenPayload,
    getSecret(secret),
    { algorithm: "HS256", expiresIn: PRIVATE_BLOB_TOKEN_TTL_SECONDS },
  );

  return `/api/file/vercel-blob?token=${encodeURIComponent(token)}`;
};

export const verifyPrivateBlobAccessToken = (
  token: string,
  secret = process.env.NEXTAUTH_SECRET,
): Pick<PrivateBlobTokenPayload, "blobUrl" | "download"> => {
  const payload = verify(token, getSecret(secret), {
    algorithms: ["HS256"],
  }) as PrivateBlobTokenPayload;

  if (
    payload.purpose !== PRIVATE_BLOB_TOKEN_PURPOSE ||
    !payload.blobUrl ||
    typeof payload.download !== "boolean"
  ) {
    throw new Error("Invalid private Blob access token.");
  }

  return { blobUrl: payload.blobUrl, download: payload.download };
};
