import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { readDB } from "@/lib/store";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const db = await readDB();
  const errands = [...db.errands].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const total = errands.length;
  const open = errands.filter((e) => e.status === "open").length;
  const inProgress = errands.filter((e) => e.status === "in_progress").length;
  const done = errands.filter((e) => e.status === "done").length;
  const cancelled = errands.filter((e) => e.status === "cancelled").length;

  const totalReward = errands.reduce((sum, e) => sum + e.rewardKrw, 0);
  const totalFee = errands.reduce((sum, e) => sum + (e.settlement?.platformFeeKrw || 0), 0);
  const totalPayout = errands.reduce((sum, e) => sum + (e.settlement?.helperPayoutKrw || 0), 0);
  const penaltyTotal = errands.reduce((sum, e) => sum + (e.cancellation?.requesterPenaltyKrw || 0), 0);
  const openDisputes = errands.filter((e) => e.dispute?.status === "open").length;
  const reviewCount = errands.reduce((sum, e) => sum + (e.reviews?.length || 0), 0);

  const recent = errands.slice(0, 12);

  return NextResponse.json({
    summary: {
      total,
      open,
      inProgress,
      done,
      cancelled,
      completionRate: total ? Math.round((done / total) * 100) : 0,
      cancelRate: total ? Math.round((cancelled / total) * 100) : 0,
      totalReward,
      totalFee,
      totalPayout,
      penaltyTotal,
      openDisputes,
      reviewCount,
      uniqueRequesters: new Set(errands.map((e) => e.requester)).size,
      uniqueHelpers: new Set(errands.map((e) => e.helper).filter(Boolean)).size,
    },
    recent,
  });
}
