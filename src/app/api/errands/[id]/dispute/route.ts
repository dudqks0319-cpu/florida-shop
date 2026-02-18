import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { calculateSettlement, mediumPenalty } from "@/lib/errand-rules";
import { readDB, writeDB } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "open").trim();

  const db = await readDB();
  const idx = db.errands.findIndex((e) => e.id === id);
  if (idx < 0) return NextResponse.json({ error: "의뢰를 찾을 수 없습니다." }, { status: 404 });

  const errand = db.errands[idx];
  const isRequesterOwner = errand.requesterId ? errand.requesterId === user.id : errand.requester === user.name;
  const isHelper = errand.helperId ? errand.helperId === user.id : errand.helper === user.name;

  if (!isRequesterOwner && !isHelper && user.role !== "admin") {
    return NextResponse.json({ error: "의뢰자/담당 수행자/관리자만 이의제기를 처리할 수 있습니다." }, { status: 403 });
  }

  if (action === "resolve") {
    if (user.role !== "admin") {
      return NextResponse.json({ error: "분쟁 해결은 관리자만 처리할 수 있습니다." }, { status: 403 });
    }
    if (!errand.dispute || errand.dispute.status !== "open") {
      return NextResponse.json({ error: "해결할 열려있는 분쟁이 없습니다." }, { status: 400 });
    }

    const decision = String(body?.decision || "").trim() as "done" | "cancelled";
    const note = String(body?.note || "").trim();
    if (decision !== "done" && decision !== "cancelled") {
      return NextResponse.json({ error: "decision은 done 또는 cancelled 이어야 합니다." }, { status: 400 });
    }

    const next = {
      ...errand,
      dispute: {
        ...errand.dispute,
        status: "resolved" as const,
        resolvedAt: new Date().toISOString(),
        resolverId: user.id,
        resolverName: user.name,
        resolutionStatus: decision,
        resolutionNote: note || undefined,
      },
    };

    if (decision === "done") {
      const settlement = calculateSettlement(errand.rewardKrw);
      next.status = "done";
      next.settlement = {
        ...settlement,
        status: "paid" as const,
        settledAt: new Date().toISOString(),
      };
      next.approvedAt = new Date().toISOString();
      next.approvedById = user.id;
      next.approvedByName = user.name;
    } else {
      const p = mediumPenalty(errand.status, errand.rewardKrw, Boolean(errand.helper));
      next.status = "cancelled";
      next.cancellation = {
        penaltyLevel: p.requesterPenaltyKrw > 0 ? "medium" : "none",
        requesterPenaltyKrw: p.requesterPenaltyKrw,
        helperCompensationKrw: p.helperCompensationKrw,
        reason: p.reason,
        decidedAt: new Date().toISOString(),
      };
    }

    db.errands[idx] = next;
    await writeDB(db);

    return NextResponse.json({ ok: true, errand: db.errands[idx] });
  }

  const reason = String(body?.reason || "").trim();
  if (!reason || reason.length < 5) {
    return NextResponse.json({ error: "이의제기 사유를 5자 이상 입력해주세요." }, { status: 400 });
  }

  if (errand.status === "cancelled") {
    return NextResponse.json({ error: "이미 취소된 건은 새로운 이의제기를 등록할 수 없습니다." }, { status: 400 });
  }

  db.errands[idx] = {
    ...errand,
    dispute: {
      status: "open",
      reason,
      reporterId: user.id,
      reporterName: user.name,
      createdAt: new Date().toISOString(),
    },
  };

  await writeDB(db);

  return NextResponse.json({ ok: true, dispute: db.errands[idx].dispute });
}
