import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { readDB, writeDB } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const db = await readDB();
  const idx = db.errands.findIndex((e) => e.id === id);
  if (idx < 0) return NextResponse.json({ error: "의뢰를 찾을 수 없습니다." }, { status: 404 });

  const errand = db.errands[idx];
  if (errand.requester !== user.name && user.role !== "admin") {
    return NextResponse.json({ error: "의뢰자 또는 관리자만 결제를 확정할 수 있습니다." }, { status: 403 });
  }

  if (errand.payment.status === "paid") {
    return NextResponse.json({ ok: true, message: "이미 결제가 완료되어 있습니다." });
  }

  const paymentKey = String(body?.paymentKey || `mock-pay-${Date.now()}`);

  db.errands[idx] = {
    ...errand,
    payment: {
      ...errand.payment,
      status: "paid",
      paidAt: new Date().toISOString(),
      paymentKey,
      failedReason: undefined,
    },
  };

  await writeDB(db);

  return NextResponse.json({ ok: true, message: "결제가 완료되었습니다.", payment: db.errands[idx].payment });
}
