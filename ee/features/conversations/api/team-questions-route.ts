import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { validateContent } from "@/lib/utils/sanitize-html";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

const paramsSchema = z.object({
  teamId: z.string().min(1),
  id: z.string().min(1),
});

const createQuestionSchema = z.object({
  content: z.string().trim().min(1).max(20_000),
  category: z.string().trim().min(1).max(100).optional(),
  priority: z.enum(["high", "medium", "low", "none"]).optional(),
  dataroomDocumentId: z.string().min(1).optional(),
  documentPageNumber: z.number().int().positive().optional(),
});

async function getAuthorizedDataroom(
  teamId: string,
  dataroomId: string,
  userId: string,
) {
  return prisma.dataroom.findFirst({
    where: {
      id: dataroomId,
      teamId,
      team: { users: { some: { userId, blockedAt: null } } },
    },
    select: { id: true, teamId: true },
  });
}

export async function handleRoute(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  const userId = (session?.user as CustomUser | undefined)?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const params = paramsSchema.safeParse({
    teamId: req.query.teamId,
    id: req.query.id,
  });
  if (!params.success) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const { teamId, id: dataroomId } = params.data;

  try {
    const dataroom = await getAuthorizedDataroom(teamId, dataroomId, userId);
    if (!dataroom) {
      return res.status(404).json({ error: "Dataroom not found" });
    }

    if (req.method === "GET") {
      const questions = await prisma.dataroomQuestion.findMany({
        where: { dataroomId, teamId },
        select: {
          id: true,
          content: true,
          category: true,
          priority: true,
          status: true,
          orderIndex: true,
          dataroomDocumentId: true,
          documentPageNumber: true,
          createdAt: true,
          updatedAt: true,
          assignments: {
            select: { id: true, linkId: true, groupId: true, viewerId: true, email: true },
          },
        },
        orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
      });

      return res.status(200).json(questions);
    }

    const body = createQuestionSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: "Invalid request data" });
    }

    if (body.data.dataroomDocumentId) {
      const document = await prisma.dataroomDocument.findFirst({
        where: { id: body.data.dataroomDocumentId, dataroomId },
        select: { id: true },
      });
      if (!document) {
        return res.status(400).json({ error: "Invalid document for this dataroom" });
      }
    }

    const question = await prisma.dataroomQuestion.create({
      data: {
        content: validateContent(body.data.content),
        category: body.data.category,
        priority: body.data.priority,
        dataroomDocumentId: body.data.dataroomDocumentId,
        documentPageNumber: body.data.documentPageNumber,
        dataroomId,
        teamId,
        createdByUserId: userId,
      },
    });

    return res.status(201).json(question);
  } catch (error) {
    console.error("Error handling dataroom questions:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
