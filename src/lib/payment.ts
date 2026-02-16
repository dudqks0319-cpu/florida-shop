export type PaymentMethod = "kakaopay" | "naverpay" | "tosspay" | "card";

type ReadyInput = {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  orderName: string;
};

export type ReadyResult = {
  checkoutUrl: string;
  provider: "mock" | "live";
  message: string;
};

function assertEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} 환경변수가 필요합니다.`);
  }
  return value;
}

function mockReady(input: ReadyInput): ReadyResult {
  return {
    provider: "mock",
    checkoutUrl: `/mock-checkout/${input.method}/${input.orderId}`,
    message: "데모 결제 준비 완료",
  };
}

function tossReady(input: ReadyInput): ReadyResult {
  const clientKey = assertEnv("TOSS_CLIENT_KEY");
  const successUrl = process.env.TOSS_SUCCESS_URL || "http://localhost:3000/payment/success";
  const failUrl = process.env.TOSS_FAIL_URL || "http://localhost:3000/payment/fail";

  const url =
    `https://js.tosspayments.com/v1/payment-widget?clientKey=${encodeURIComponent(clientKey)}` +
    `&orderId=${encodeURIComponent(input.orderId)}` +
    `&orderName=${encodeURIComponent(input.orderName)}` +
    `&amount=${encodeURIComponent(String(input.amount))}` +
    `&successUrl=${encodeURIComponent(successUrl)}` +
    `&failUrl=${encodeURIComponent(failUrl)}`;

  return {
    provider: "live",
    checkoutUrl: url,
    message: "토스페이 결제창 준비 완료",
  };
}

function kakaoReady(input: ReadyInput): ReadyResult {
  assertEnv("KAKAOPAY_ADMIN_KEY");
  const partnerOrderId = input.orderId;
  // 실제 카카오페이 ready API는 서버에서 호출 후 redirect URL을 받아야 함.
  // 현재는 키 존재 검증 + 안내 URL 반환으로 구조만 연결.
  const url = `https://developers.kakaopay.com/docs/payment/online/single-payment#ready`;
  return {
    provider: "live",
    checkoutUrl: url,
    message: `카카오페이 연동 준비 완료 (partner_order_id=${partnerOrderId})`,
  };
}

function naverReady(input: ReadyInput): ReadyResult {
  assertEnv("NAVERPAY_CLIENT_ID");
  assertEnv("NAVERPAY_CLIENT_SECRET");
  const url = `https://developers.pay.naver.com/docs/v2/api`;
  return {
    provider: "live",
    checkoutUrl: url,
    message: `네이버페이 연동 준비 완료 (merchantPayKey=${input.orderId})`,
  };
}

export function paymentReady(input: ReadyInput): ReadyResult {
  const mode = process.env.PAYMENT_MODE === "live" ? "live" : "mock";
  if (mode === "mock") return mockReady(input);

  if (input.method === "tosspay" || input.method === "card") return tossReady(input);
  if (input.method === "kakaopay") return kakaoReady(input);
  return naverReady(input);
}
