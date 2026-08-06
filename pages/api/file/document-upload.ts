import type { NextApiRequest, NextApiResponse } from "next";

import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { getServerSession } from "next-auth/next";

import { PapermarkApiError, getApiErrorResponse } from "@/lib/api/errors";
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
          throw new PapermarkApiError("unauthorized", "Unauthorized");
        }

        let payload: { teamId?: string; docId?: string };
        try {
          payload = JSON.parse(clientPayload ?? "{}") as {
            teamId?: string;
            docId?: string;
          };
        } catch {
          throw new PapermarkApiError(
            "unprocessable_entity",
            "Invalid document upload request.",
          );
        }

        const expectedPrefix = `documents/${payload.teamId}/${payload.docId}/`;
        if (
          !payload.teamId ||
          !payload.docId ||
          !pathname.startsWith(expectedPrefix) ||
          pathname.slice(expectedPrefix.length).includes("/")
        ) {
          throw new PapermarkApiError(
            "unprocessable_entity",
            "Invalid document upload request.",
          );
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
    const response = getApiErrorResponse(error, {
      status: 400,
      body: {
        error: "Unable to authorize document upload",
        code: "bad_request",
      },
    });
    return res.status(response.status).json(response.body);
  }
}
