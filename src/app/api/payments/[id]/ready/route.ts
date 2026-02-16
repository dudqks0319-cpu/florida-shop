import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
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
  if (errand.requester !== user.name && user.role !== "admin") {
    return NextResponse.json({ error: "의뢰자 또는 관리자만 결제를 요청할 수 있습니다." }, { status: 403 });
  }
  if (errand.payment.status === "paid") {
    return NextResponse.json({ error: "이미 결제가 완료된 의뢰입니다." }, { status: 400 });
  }

  const paymentMode = process.env.PAYMENT_MODE === "live" ? "live" : "mock";
  const method = errand.payment.method;

  let checkoutUrl = "";
  if (paymentMode === "mock") {
    checkoutUrl = `/mock-checkout/${method}/${errand.payment.orderId}`;
  } else {
    checkoutUrl = `https://pay.example.com/checkout?orderId=${encodeURIComponent(errand.payment.orderId)}&method=${method}`;
  }

  db.errands[idx] = {
    ...errand,
    payment: {
      ...errand.payment,
      provider: paymentMode,
      status: "ready",
      checkoutUrl,
      failedReason: undefined,
    },
  };

  await writeDB(db);

  return NextResponse.json({
    ok: true,
    paymentMode,
    method,
    methodLabel: METHOD_LABEL[method] || method,
    checkoutUrl,
    message:
      paymentMode === "mock"
        ? "데모 결제 준비가 완료되었습니다. 결제 완료 버튼으로 검증할 수 있습니다."
        : "실결제 준비가 완료되었습니다. PG 결제창으로 이동하세요.",
  });
}
