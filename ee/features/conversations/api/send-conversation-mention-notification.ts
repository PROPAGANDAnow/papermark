import { NextApiRequest, NextApiResponse } from "next";

import { z } from "zod";

import prisma from "@/lib/prisma";

const requestSchema = z
  .object({
    conversationId: z.string().min(1),
    dataroomId: z.string().min(1),
    teamId: z.string().min(1),
    senderUserId: z.string().min(1),
    mentionedUserId: z.string().min(1).optional(),
    recipientUserId: z.string().min(1).optional(),
  })
  .refine((data) => data.mentionedUserId || data.recipientUserId, {
    message: "A mentioned user is required",
  });

function hasInternalAuthorization(req: NextApiRequest) {
  const expectedToken = process.env.INTERNAL_API_KEY;
  const authorization = req.headers.authorization;

  if (!expectedToken || !authorization) {
    return false;
  }

  const [scheme, token] = authorization.split(" ");
  return scheme === "Bearer" && token === expectedToken;
}

/**
 * This job endpoint is retained for Trigger compatibility. Mention delivery is
 * intentionally disabled until a recipient-scoped notification implementation
 * is available. It still authenticates and verifies every referenced resource
 * so it can never become an authorization bypass when delivery is enabled.
 */
export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  if (!hasInternalAuthorization(req)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid request" });
  }

  const { conversationId, dataroomId, teamId, senderUserId } = parsed.data;
  const mentionedUserId =
    parsed.data.mentionedUserId ?? parsed.data.recipientUserId!;

  try {
    const [conversation, memberships] = await Promise.all([
      prisma.conversation.findFirst({
        where: { id: conversationId, dataroomId, teamId },
        select: { id: true },
      }),
      prisma.userTeam.findMany({
        where: {
          teamId,
          blockedAt: null,
          userId: { in: [senderUserId, mentionedUserId] },
        },
        select: { userId: true },
      }),
    ]);

    const memberIds = new Set(
      memberships.map((membership) => membership.userId),
    );
    if (
      !conversation ||
      !memberIds.has(senderUserId) ||
      !memberIds.has(mentionedUserId)
    ) {
      return res.status(404).json({ message: "Notification target not found" });
    }

    return res.status(501).json({
      message: "Conversation mention notifications are not available",
    });
  } catch (error) {
    console.error(
      "Failed to validate conversation mention notification:",
      error,
    );
    return res.status(500).json({ message: "Internal server error" });
  }
}
