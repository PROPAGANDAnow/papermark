import type { NextApiRequest, NextApiResponse } from "next";

import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { getServerSession } from "next-auth/next";

import { canAccessAdminRoute } from "@/lib/auth/admin-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { SUPPORTED_DOCUMENT_MIME_TYPES } from "@/lib/constants";

const MAX_DOCUMENT_SIZE = 2 * 1024 * 1024 * 1024;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    const response = await handleUpload({
      body: req.body as HandleUploadBody,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const session = await getServerSession(req, res, authOptions);
        if (!canAccessAdminRoute(session?.user?.email ?? undefined)) {
          throw new Error("Unauthorized");
        }

        let payload: { teamId?: string; docId?: string };
        try {
          payload = JSON.parse(clientPayload ?? "{}") as {
            teamId?: string;
            docId?: string;
          };
        } catch {
          throw new Error("Invalid upload payload");
        }

        const expectedPrefix = `documents/${payload.teamId}/${payload.docId}/`;
        if (
          !payload.teamId ||
          !payload.docId ||
          !pathname.startsWith(expectedPrefix) ||
          pathname.slice(expectedPrefix.length).includes("/")
        ) {
          throw new Error("Invalid document upload path");
        }

        return {
          addRandomSuffix: true,
          allowedContentTypes: SUPPORTED_DOCUMENT_MIME_TYPES,
          maximumSizeInBytes: MAX_DOCUMENT_SIZE,
          tokenPayload: JSON.stringify(payload),
        };
      },
    });

    return res.status(200).json(response);
  } catch (error) {
    return res
      .status(400)
      .json({ error: "Unable to authorize document upload" });
  }
}
