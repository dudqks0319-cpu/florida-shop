import type { ErrandStatus, UserRole } from "./store";

export const allowedTransition: Record<ErrandStatus, ErrandStatus[]> = {
  open: ["matched", "cancelled"],
  matched: ["in_progress", "cancelled"],
  in_progress: ["done", "cancelled"],
  done: [],
  cancelled: [],
};

export function canTransition(from: ErrandStatus, to: ErrandStatus) {
  if (from === to) return true;
  return allowedTransition[from].includes(to);
}

export function mediumPenalty(statusBefore: ErrandStatus, rewardKrw: number, hasHelper: boolean) {
  if (statusBefore === "open") {
    return { requesterPenaltyKrw: 0, helperCompensationKrw: 0, reason: "매칭 전 취소" };
  }
  if (statusBefore === "matched") {
    const penalty = Math.min(Math.round(rewardKrw * 0.2), 2000);
    return {
      requesterPenaltyKrw: penalty,
      helperCompensationKrw: hasHelper ? penalty : 0,
      reason: "매칭 후 취소(중강도 패널티)",
    };
  }

  const penalty = Math.min(Math.round(rewardKrw * 0.3), 3000);
  return {
    requesterPenaltyKrw: penalty,
    helperCompensationKrw: hasHelper ? penalty : 0,
    reason: "진행 중 취소/노쇼(중강도 패널티)",
  };
}

export function calculateSettlement(rewardKrw: number) {
  const platformFeeKrw = Math.floor(rewardKrw * 0.1);
  const helperPayoutKrw = rewardKrw - platformFeeKrw;
  return { platformFeeKrw, helperPayoutKrw };
}

export function canRolePerformAction(role: UserRole, action: "createErrand" | "acceptMatch" | "adminOnly") {
  if (action === "adminOnly") return role === "admin";
  if (action === "createErrand") return role === "requester" || role === "admin";
  return role === "helper" || role === "admin";
}

export function isVerificationCodeValid(createdAtMs: number, nowMs: number, ttlMs = 3 * 60 * 1000) {
  return nowMs - createdAtMs <= ttlMs;
}
