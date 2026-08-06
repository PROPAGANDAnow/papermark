import type { NextApiRequest, NextApiResponse } from "next";

import { get } from "@vercel/blob";
import { Readable } from "node:stream";

import { verifyPrivateBlobAccessToken } from "@/lib/files/private-blob-access";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  const token =
    typeof req.query.token === "string" ? req.query.token : undefined;
  if (!token) {
    return res
      .status(401)
      .json({ message: "Missing private Blob access token" });
  }

  try {
    const { blobUrl, download } = verifyPrivateBlobAccessToken(token);
    const result = await get(blobUrl, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return res.status(404).json({ message: "Blob not found" });
    }

    const contentType = result.headers.get("content-type");
    const contentDisposition = result.headers.get("content-disposition");
    const contentLength = result.headers.get("content-length");
    const cacheControl = result.headers.get("cache-control");
    if (contentType) res.setHeader("Content-Type", contentType);
    if (contentDisposition) {
      res.setHeader("Content-Disposition", contentDisposition);
    } else if (download) {
      res.setHeader("Content-Disposition", "attachment");
    }
    if (contentLength) res.setHeader("Content-Length", contentLength);
    if (cacheControl) res.setHeader("Cache-Control", cacheControl);

    return Readable.fromWeb(
      result.stream as unknown as import("node:stream/web").ReadableStream,
    ).pipe(res);
  } catch {
    return res
      .status(401)
      .json({ message: "Invalid or expired private Blob access token" });
  }
}
