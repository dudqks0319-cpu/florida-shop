import { NextRequest, NextResponse } from "next/server";
import { paymentReady, type PaymentMethod } from "@/lib/payment";

const VALID_METHODS: PaymentMethod[] = ["kakaopay", "naverpay", "tosspay", "card"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const method = String(body?.method || "card") as PaymentMethod;
    const amount = Number(body?.amount || 0);
    const orderName = String(body?.orderName || "플로리다 옷가게 주문").trim();

    if (!VALID_METHODS.includes(method)) {
      return NextResponse.json({ error: "지원하지 않는 결제수단입니다." }, { status: 400 });
    }
    if (!Number.isInteger(amount) || amount < 1000) {
      return NextResponse.json({ error: "결제 금액은 1,000원 이상 정수여야 합니다." }, { status: 400 });
    }

    const orderId = `fl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const ready = paymentReady({ orderId, amount, method, orderName });

    return NextResponse.json({
      ok: true,
      orderId,
      paymentMode: ready.provider,
      checkoutUrl: ready.checkoutUrl,
      message: ready.message,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "결제 준비 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
