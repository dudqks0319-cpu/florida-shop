import { NextRequest, NextResponse } from "next/server";
import { paymentReady, type PaymentMethod } from "@/lib/payment";

const VALID_METHODS: PaymentMethod[] = ["kakaopay", "naverpay", "tosspay", "card"];
const TERMS_VERSION = process.env.FLORIDA_TERMS_VERSION || "terms-v1";
const PRIVACY_VERSION = process.env.FLORIDA_PRIVACY_VERSION || "privacy-v1";

type AgreementsInput = {
  terms?: boolean;
  privacy?: boolean;
  age14?: boolean;
};

function normalizeAgreements(value: unknown): AgreementsInput | null {
  if (!value || typeof value !== "object") return null;

  const input = value as AgreementsInput;
  return {
    terms: Boolean(input.terms),
    privacy: Boolean(input.privacy),
    age14: Boolean(input.age14),
  };
}

function hasRequiredAgreements(agreements: AgreementsInput | null) {
  return Boolean(agreements?.terms && agreements?.privacy && agreements?.age14);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const method = String(body?.method || "card") as PaymentMethod;
    const amount = Number(body?.amount || 0);
    const orderName = String(body?.orderName || "플로리다 옷가게 주문").trim();
    const agreements = normalizeAgreements(body?.agreements);

    if (!VALID_METHODS.includes(method)) {
      return NextResponse.json({ error: "지원하지 않는 결제수단입니다." }, { status: 400 });
    }
    if (!Number.isInteger(amount) || amount < 1000) {
      return NextResponse.json({ error: "결제 금액은 1,000원 이상 정수여야 합니다." }, { status: 400 });
    }
    if (!hasRequiredAgreements(agreements)) {
      return NextResponse.json({ error: "필수 약관(이용약관/개인정보/연령확인) 동의가 필요합니다." }, { status: 400 });
    }

    const orderId = `fl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const ready = paymentReady({ orderId, amount, method, orderName });

    const agreementReceipt = {
      agreedAt: new Date().toISOString(),
      termsVersion: TERMS_VERSION,
      privacyVersion: PRIVACY_VERSION,
    };

    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    console.info("[florida-payment-ready] agreement accepted", {
      orderId,
      ipAddress,
      ...agreementReceipt,
    });

    return NextResponse.json({
      ok: true,
      orderId,
      paymentMode: ready.provider,
      checkoutUrl: ready.checkoutUrl,
      message: ready.message,
      agreementReceipt,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "결제 준비 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
