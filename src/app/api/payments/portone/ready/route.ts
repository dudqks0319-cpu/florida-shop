import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const amount = Number(body?.amount || 0);
  const orderName = String(body?.orderName || "FLORIDA 주문");

  if (!Number.isInteger(amount) || amount < 1000) {
    return NextResponse.json({ error: "결제 금액은 1,000원 이상 정수여야 합니다." }, { status: 400 });
  }

  const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
  const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;

  if (!storeId || !channelKey) {
    return NextResponse.json(
      { ok: true, mode: "mock", message: "포트원 키 미설정: MOCK 결제 준비", checkoutUrl: `/mock-checkout/portone/${Date.now()}`, orderName },
      { status: 200 },
    );
  }

  return NextResponse.json({
    ok: true,
    mode: "portone-test",
    message: "포트원 테스트 결제 준비 완료",
    orderName,
    storeId,
    channelKey,
  });
}
