import { NextRequest, NextResponse } from "next/server";
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

  const updated = {
    ...current,
    helper: typeof body?.helper === "string" ? body.helper : current.helper,
    status: nextStatus,
  };

  if (nextStatus === "done") {
    if (!body?.settlement) {
      return NextResponse.json({ error: "완료 시 정산 정보가 필요합니다." }, { status: 400 });
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
