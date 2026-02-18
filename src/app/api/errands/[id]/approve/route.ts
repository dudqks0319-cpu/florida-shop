import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { calculateSettlement } from "@/lib/errand-rules";
import { readDB, writeDB } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const db = await readDB();
  const idx = db.errands.findIndex((e) => e.id === id);
  if (idx < 0) return NextResponse.json({ error: "의뢰를 찾을 수 없습니다." }, { status: 404 });

  const errand = db.errands[idx];
  const isRequesterOwner = errand.requesterId ? errand.requesterId === user.id : errand.requester === user.name;

  if (!isRequesterOwner && user.role !== "admin") {
    return NextResponse.json({ error: "의뢰자 또는 관리자만 완료 승인할 수 있습니다." }, { status: 403 });
  }

  if (errand.status !== "in_progress") {
    return NextResponse.json({ error: "진행중 상태에서만 완료 승인이 가능합니다." }, { status: 400 });
  }

  if (!errand.proof) {
    return NextResponse.json({ error: "수행자의 완료 증빙 업로드 후 승인할 수 있습니다." }, { status: 400 });
  }

  const settlement = calculateSettlement(errand.rewardKrw);

  db.errands[idx] = {
    ...errand,
    status: "done",
    settlement: {
      ...settlement,
      status: "paid",
      settledAt: new Date().toISOString(),
    },
    approvedAt: new Date().toISOString(),
    approvedById: user.id,
    approvedByName: user.name,
    dispute:
      errand.dispute?.status === "open"
        ? {
            ...errand.dispute,
            status: "resolved",
            resolvedAt: new Date().toISOString(),
            resolverId: user.id,
            resolverName: user.name,
            resolutionStatus: "done",
            resolutionNote: "의뢰자 완료 승인",
          }
        : errand.dispute,
  };

  await writeDB(db);

  return NextResponse.json({ ok: true, errand: db.errands[idx] });
}
