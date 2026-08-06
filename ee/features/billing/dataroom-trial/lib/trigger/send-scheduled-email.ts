import { logger, task } from "@trigger.dev/sdk";

import { sendDataroomInfoEmail } from "@/lib/emails/send-dataroom-info";
import { sendDataroomTrial24hReminderEmail } from "@/lib/emails/send-dataroom-trial-24h";
import { sendDataroomTrialEndEmail } from "@/lib/emails/send-dataroom-trial-end";
import prisma from "@/lib/prisma";

type TrialEmailKind = "info" | "reminder" | "expired";

type ScheduledTrialEmailPayload = {
  teamId: string;
  userId: string;
  scheduledTrialEndsAt: string;
  name: string;
};

type TrialEmailSchedule = {
  kind: TrialEmailKind;
  now: Date;
  plan: string;
  trialEndsAt: Date | null;
  scheduledTrialEndsAt: string;
  recipient: {
    email: string | null;
    blockedAt: Date | null;
  } | null;
};

const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Delayed Trigger.dev jobs carry untrusted, stale payloads. This guard ensures
 * delivery is based on the current team, active member, and current trial
 * schedule rather than values supplied when the job was enqueued.
 */
export const isDataroomTrialEmailScheduleValid = ({
  kind,
  now,
  plan,
  trialEndsAt,
  scheduledTrialEndsAt,
  recipient,
}: TrialEmailSchedule): boolean => {
  if (
    !plan.includes("drtrial") ||
    !trialEndsAt ||
    !recipient?.email ||
    recipient.blockedAt ||
    trialEndsAt.toISOString() !== scheduledTrialEndsAt
  ) {
    return false;
  }

  const nowMs = now.getTime();
  const trialEndsAtMs = trialEndsAt.getTime();

  switch (kind) {
    case "info":
      return nowMs < trialEndsAtMs;
    case "reminder":
      return (
        nowMs >= trialEndsAtMs - REMINDER_WINDOW_MS && nowMs < trialEndsAtMs
      );
    case "expired":
      return nowMs >= trialEndsAtMs;
  }
};

const getAuthorizedTrialRecipient = async (
  payload: ScheduledTrialEmailPayload,
  kind: TrialEmailKind,
) => {
  if (!process.env.RESEND_API_KEY) {
    logger.warn(
      "Skipping trial email because email delivery is not configured",
      {
        kind,
        teamId: payload.teamId,
      },
    );
    return null;
  }

  const team = await prisma.team.findFirst({
    where: {
      id: payload.teamId,
      users: {
        some: {
          userId: payload.userId,
          blockedAt: null,
        },
      },
    },
    select: {
      plan: true,
      trialEndsAt: true,
      users: {
        where: {
          userId: payload.userId,
          blockedAt: null,
        },
        select: {
          blockedAt: true,
          user: {
            select: {
              email: true,
            },
          },
        },
        take: 1,
      },
    },
  });

  const membership = team?.users[0];
  const recipient = membership
    ? { email: membership.user.email, blockedAt: membership.blockedAt }
    : null;

  const recipientEmail = recipient?.email;
  if (
    !team ||
    !recipientEmail ||
    !isDataroomTrialEmailScheduleValid({
      kind,
      now: new Date(),
      plan: team.plan,
      trialEndsAt: team.trialEndsAt,
      scheduledTrialEndsAt: payload.scheduledTrialEndsAt,
      recipient,
    })
  ) {
    logger.info("Skipping invalid or unauthorized trial email schedule", {
      kind,
      teamId: payload.teamId,
    });
    return null;
  }

  return recipientEmail;
};

export const sendDataroomTrialInfoEmailTask = task({
  id: "send-dataroom-trial-info-email",
  retry: { maxAttempts: 1 },
  run: async (
    payload: ScheduledTrialEmailPayload & { useCase: string },
  ): Promise<void> => {
    const to = await getAuthorizedTrialRecipient(payload, "info");
    if (!to) return;

    await sendDataroomInfoEmail(
      { user: { email: to, name: payload.name } },
      payload.useCase,
    );
    logger.info("Sent trial information email", { teamId: payload.teamId });
  },
});

export const sendDataroomTrial24hReminderEmailTask = task({
  id: "send-dataroom-trial-24h-reminder-email",
  retry: { maxAttempts: 1 },
  run: async (payload: ScheduledTrialEmailPayload): Promise<void> => {
    const to = await getAuthorizedTrialRecipient(payload, "reminder");
    if (!to) return;

    await sendDataroomTrial24hReminderEmail({ email: to, name: payload.name });
    logger.info("Sent trial expiry reminder", { teamId: payload.teamId });
  },
});

export const sendDataroomTrialExpiredEmailTask = task({
  id: "send-dataroom-trial-expired-email",
  retry: { maxAttempts: 1 },
  run: async (payload: ScheduledTrialEmailPayload): Promise<void> => {
    const to = await getAuthorizedTrialRecipient(payload, "expired");
    if (!to) return;

    await sendDataroomTrialEndEmail({ email: to, name: payload.name });

    // Re-check the same schedule before changing billing-related state. A
    // manual extension or upgrade invalidates this delayed job.
    const team = await prisma.team.findFirst({
      where: {
        id: payload.teamId,
        plan: { contains: "drtrial" },
        trialEndsAt: new Date(payload.scheduledTrialEndsAt),
      },
      select: { plan: true },
    });

    if (!team) {
      logger.info("Trial changed before expiry cleanup", {
        teamId: payload.teamId,
      });
      return;
    }

    const updatedTeam = await prisma.team.update({
      where: { id: payload.teamId },
      data: { plan: team.plan.replace("+drtrial", "") },
      select: { plan: true },
    });

    const paidPlans = [
      "pro",
      "business",
      "datarooms",
      "datarooms-plus",
      "datarooms-premium",
      "datarooms-unlimited",
    ];
    if (!paidPlans.includes(updatedTeam.plan)) {
      await prisma.$transaction([
        prisma.brand.deleteMany({ where: { teamId: payload.teamId } }),
        prisma.userTeam.updateMany({
          where: { teamId: payload.teamId, role: { not: "ADMIN" } },
          data: { status: "BLOCKED_TRIAL_EXPIRED", blockedAt: new Date() },
        }),
      ]);
    }

    logger.info("Expired trial cleaned up", { teamId: payload.teamId });
  },
});
