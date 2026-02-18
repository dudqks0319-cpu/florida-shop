import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { paymentConfirm } from "@/lib/payment";
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
  const isRequesterOwner = errand.requesterId ? errand.requesterId === user.id : errand.requester === user.name;
  if (!isRequesterOwner && user.role !== "admin") {
    return NextResponse.json({ error: "의뢰자 또는 관리자만 결제를 확정할 수 있습니다." }, { status: 403 });
  }

  if (errand.payment.status === "paid") {
    return NextResponse.json({ ok: true, message: "이미 결제가 완료되어 있습니다." });
  }

  if (errand.payment.status !== "ready" && process.env.PAYMENT_MODE === "live") {
    return NextResponse.json({ error: "live 결제는 결제 준비(ready) 이후에만 확정할 수 있습니다." }, { status: 400 });
  }

  const paymentKey = typeof body?.paymentKey === "string" ? body.paymentKey : undefined;

  try {
    const confirmed = await paymentConfirm({
      orderId: errand.payment.orderId,
      amount: errand.rewardKrw,
      method: errand.payment.method,
      paymentKey,
    });

    db.errands[idx] = {
      ...errand,
      payment: {
        ...errand.payment,
        status: "paid",
        provider: confirmed.provider,
        paidAt: confirmed.approvedAt,
        paymentKey: paymentKey || `mock-pay-${Date.now()}`,
        failedReason: undefined,
      },
    };

    await writeDB(db);

    return NextResponse.json({ ok: true, message: confirmed.message, payment: db.errands[idx].payment, raw: confirmed.raw });
  } catch (error) {
    const message = error instanceof Error ? error.message : "결제 확정 중 오류가 발생했습니다.";

    db.errands[idx] = {
      ...errand,
      payment: {
        ...errand.payment,
        status: "failed",
        failedReason: message,
      },
    };

    await writeDB(db);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
