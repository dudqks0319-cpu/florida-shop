import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { paymentReady } from "@/lib/payment";
import { readDB, writeDB } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

const METHOD_LABEL: Record<string, string> = {
  kakaopay: "카카오페이",
  naverpay: "네이버페이",
  tosspay: "토스페이",
  card: "신용/체크카드",
};

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
    return NextResponse.json({ error: "의뢰자 또는 관리자만 결제를 요청할 수 있습니다." }, { status: 403 });
  }
  if (errand.payment.status === "paid") {
    return NextResponse.json({ error: "이미 결제가 완료된 의뢰입니다." }, { status: 400 });
  }

  const method = errand.payment.method;

  try {
    const ready = paymentReady({
      orderId: errand.payment.orderId,
      amount: errand.rewardKrw,
      method,
      orderName: errand.title,
    });

    db.errands[idx] = {
      ...errand,
      payment: {
        ...errand.payment,
        provider: ready.provider,
        status: "ready",
        checkoutUrl: ready.checkoutUrl,
        failedReason: undefined,
      },
    };

    await writeDB(db);

    return NextResponse.json({
      ok: true,
      paymentMode: ready.provider,
      method,
      methodLabel: METHOD_LABEL[method] || method,
      checkoutUrl: ready.checkoutUrl,
      message: ready.message,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "결제 준비 중 오류가 발생했습니다.";
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
