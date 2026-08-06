import prisma from "@/lib/prisma";

import { getTeamCreationEligibility } from "./team-creation-eligibility";

export async function canCreateUnlimitedTeam(userId: string): Promise<boolean> {
  try {
    const memberships = await prisma.userTeam.findMany({
      where: {
        userId,
        role: "ADMIN",
        status: "ACTIVE",
        blockedAt: null,
      },
      select: {
        role: true,
        status: true,
        blockedAt: true,
        team: {
          select: {
            plan: true,
          },
        },
      },
    });

    return getTeamCreationEligibility(memberships).canCreateUnlimited;
  } catch {
    return false;
  }
}
