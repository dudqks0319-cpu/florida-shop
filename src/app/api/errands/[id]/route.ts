import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { readDB, writeDB, type ErrandStatus } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

const allowedTransition: Record<ErrandStatus, ErrandStatus[]> = {
  open: ["matched", "cancelled"],
  matched: ["in_progress", "cancelled"],
  in_progress: ["done", "cancelled"],
  done: [],
  cancelled: [],
};

function mediumPenalty(statusBefore: ErrandStatus, rewardKrw: number, hasHelper: boolean) {
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

export async function PATCH(req: NextRequest, { params }: Params) {
  const currentUser = await getCurrentUser(req);
  if (!currentUser) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const db = await readDB();
  const idx = db.errands.findIndex((e) => e.id === id);
  if (idx < 0) return NextResponse.json({ error: "not found" }, { status: 404 });

  const current = db.errands[idx];
  const nextStatus = (body?.status || current.status) as ErrandStatus;

  if (nextStatus !== current.status && !allowedTransition[current.status].includes(nextStatus)) {
    return NextResponse.json({ error: `잘못된 상태 변경입니다. (${current.status} -> ${nextStatus})` }, { status: 400 });
  }

  const isAdmin = currentUser.role === "admin";
  const isRequester = currentUser.name === current.requester;
  const isAssignedHelper = !!current.helper && currentUser.name === current.helper;

  if (nextStatus === "matched" && !(isAdmin || currentUser.role === "helper")) {
    return NextResponse.json({ error: "수행자 또는 관리자만 매칭할 수 있습니다." }, { status: 403 });
  }
  if (nextStatus === "in_progress" && !(isAdmin || isAssignedHelper)) {
    return NextResponse.json({ error: "담당 수행자 또는 관리자만 진행 시작할 수 있습니다." }, { status: 403 });
  }
  if (nextStatus === "done" && !(isAdmin || isAssignedHelper)) {
    return NextResponse.json({ error: "담당 수행자 또는 관리자만 완료 처리할 수 있습니다." }, { status: 403 });
  }
  if (nextStatus === "cancelled" && !(isAdmin || isRequester || isAssignedHelper)) {
    return NextResponse.json({ error: "의뢰자/담당 수행자/관리자만 취소할 수 있습니다." }, { status: 403 });
  }

  const requestedHelper = typeof body?.helper === "string" ? body.helper.trim() : undefined;

  const updated = {
    ...current,
    helper: current.helper,
    status: nextStatus,
  };

  if (current.status === "open" && nextStatus === "matched") {
    if (current.payment?.status !== "paid") {
      return NextResponse.json({ error: "결제 완료 후에만 매칭할 수 있습니다." }, { status: 400 });
    }

    const helperName = currentUser.role === "admin" ? requestedHelper : currentUser.name;

    if (!helperName) {
      return NextResponse.json({ error: "매칭 시 수행자 이름이 필요합니다." }, { status: 400 });
    }
    if (helperName === current.requester) {
      return NextResponse.json({ error: "의뢰자 본인은 수행자로 매칭할 수 없습니다." }, { status: 400 });
    }
    updated.helper = helperName;
  }

  if ((nextStatus === "in_progress" || nextStatus === "done") && !updated.helper) {
    return NextResponse.json({ error: "수행자 없이 진행/완료 처리할 수 없습니다." }, { status: 400 });
  }

  if (nextStatus === "done") {
    if (!body?.settlement) {
      return NextResponse.json({ error: "완료 시 정산 정보가 필요합니다." }, { status: 400 });
    }

    const platformFeeKrw = Number(body?.settlement?.platformFeeKrw);
    const helperPayoutKrw = Number(body?.settlement?.helperPayoutKrw);

    if (!Number.isInteger(platformFeeKrw) || !Number.isInteger(helperPayoutKrw) || platformFeeKrw < 0 || helperPayoutKrw < 0) {
      return NextResponse.json({ error: "정산 금액이 올바르지 않습니다." }, { status: 400 });
    }
    if (platformFeeKrw + helperPayoutKrw !== current.rewardKrw) {
      return NextResponse.json({ error: "정산 합계가 의뢰 금액과 일치하지 않습니다." }, { status: 400 });
    }

    updated.settlement = body.settlement;
  }

  if (nextStatus === "cancelled" && current.status !== "cancelled") {
    const p = mediumPenalty(current.status, current.rewardKrw, !!current.helper);
    updated.cancellation = {
      penaltyLevel: p.requesterPenaltyKrw > 0 ? "medium" : "none",
      requesterPenaltyKrw: p.requesterPenaltyKrw,
      helperCompensationKrw: p.helperCompensationKrw,
      reason: p.reason,
      decidedAt: new Date().toISOString(),
    };
  }

  db.errands[idx] = updated;
  await writeDB(db);
  return NextResponse.json(db.errands[idx]);
}
