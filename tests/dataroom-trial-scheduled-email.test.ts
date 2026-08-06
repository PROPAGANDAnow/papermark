import assert from "node:assert/strict";
import test from "node:test";

import { isDataroomTrialEmailScheduleValid } from "../ee/features/billing/dataroom-trial/lib/trigger/send-scheduled-email";

const trialEndsAt = new Date("2026-08-13T12:00:00.000Z");

const eligibleTrial = {
  plan: "free+drtrial",
  trialEndsAt,
  scheduledTrialEndsAt: trialEndsAt.toISOString(),
  recipient: {
    email: "owner@example.com",
    blockedAt: null,
  },
};

test("accepts an active trial schedule for its authorized recipient", () => {
  assert.equal(
    isDataroomTrialEmailScheduleValid({
      ...eligibleTrial,
      kind: "info",
      now: new Date("2026-08-07T12:00:00.000Z"),
    }),
    true,
  );
});

test("rejects stale, expired, or unauthorized trial email schedules", () => {
  const now = new Date("2026-08-12T12:00:00.000Z");

  assert.equal(
    isDataroomTrialEmailScheduleValid({
      ...eligibleTrial,
      kind: "info",
      now,
      scheduledTrialEndsAt: "2026-08-14T12:00:00.000Z",
    }),
    false,
  );
  assert.equal(
    isDataroomTrialEmailScheduleValid({
      ...eligibleTrial,
      kind: "reminder",
      now,
      recipient: { email: "owner@example.com", blockedAt: new Date() },
    }),
    false,
  );
  assert.equal(
    isDataroomTrialEmailScheduleValid({
      ...eligibleTrial,
      kind: "expired",
      now,
      plan: "free",
    }),
    false,
  );
});

test("only permits reminder and expiry emails in their valid delivery windows", () => {
  assert.equal(
    isDataroomTrialEmailScheduleValid({
      ...eligibleTrial,
      kind: "reminder",
      now: new Date("2026-08-12T11:00:00.000Z"),
    }),
    false,
  );
  assert.equal(
    isDataroomTrialEmailScheduleValid({
      ...eligibleTrial,
      kind: "reminder",
      now: new Date("2026-08-12T12:00:00.000Z"),
    }),
    true,
  );
  assert.equal(
    isDataroomTrialEmailScheduleValid({
      ...eligibleTrial,
      kind: "expired",
      now: new Date("2026-08-13T11:59:59.000Z"),
    }),
    false,
  );
  assert.equal(
    isDataroomTrialEmailScheduleValid({
      ...eligibleTrial,
      kind: "expired",
      now: new Date("2026-08-13T12:00:00.000Z"),
    }),
    true,
  );
});
