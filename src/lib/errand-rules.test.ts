import { describe, expect, it } from "vitest";
import {
  calculateSettlement,
  canRolePerformAction,
  canTransition,
  isVerificationCodeValid,
  mediumPenalty,
} from "./errand-rules";

describe("errand-rules", () => {
  it("validates status transitions", () => {
    expect(canTransition("open", "matched")).toBe(true);
    expect(canTransition("matched", "in_progress")).toBe(true);
    expect(canTransition("in_progress", "done")).toBe(true);

    expect(canTransition("done", "open")).toBe(false);
    expect(canTransition("open", "done")).toBe(false);
  });

  it("calculates settlement for 10,000 KRW", () => {
    const settlement = calculateSettlement(10000);
    expect(settlement.platformFeeKrw).toBe(1000);
    expect(settlement.helperPayoutKrw).toBe(9000);
  });

  it("calculates cancellation penalty by status", () => {
    const matched = mediumPenalty("matched", 10000, true);
    expect(matched.requesterPenaltyKrw).toBe(2000);
    expect(matched.helperCompensationKrw).toBe(2000);

    const inProgress = mediumPenalty("in_progress", 10000, true);
    expect(inProgress.requesterPenaltyKrw).toBe(3000);
    expect(inProgress.helperCompensationKrw).toBe(3000);
  });

  it("checks role permissions", () => {
    expect(canRolePerformAction("helper", "createErrand")).toBe(false);
    expect(canRolePerformAction("requester", "acceptMatch")).toBe(false);
    expect(canRolePerformAction("admin", "adminOnly")).toBe(true);
  });

  it("validates verification code expiry within 3 minutes", () => {
    const created = 1_000_000;
    expect(isVerificationCodeValid(created, created + 2 * 60 * 1000)).toBe(true);
    expect(isVerificationCodeValid(created, created + 3 * 60 * 1000 + 1)).toBe(false);
  });
});
