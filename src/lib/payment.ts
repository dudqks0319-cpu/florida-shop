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

export type ConfirmInput = {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  paymentKey?: string;
};

export type ConfirmResult = {
  provider: "mock" | "live";
  message: string;
  approvedAt: string;
  raw?: unknown;
};

function getEnvOne(names: string[]) {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }

  throw new Error(`${names.join(" 또는 ")} 환경변수가 필요합니다.`);
}

function getPaymentMode() {
  return process.env.PAYMENT_MODE === "live" ? "live" : "mock";
}

function mockReady(input: ReadyInput): ReadyResult {
  return {
    provider: "mock",
    checkoutUrl: `/mock-checkout/${input.method}/${input.orderId}`,
    message: "데모 결제 준비 완료",
  };
}

function tossReady(input: ReadyInput): ReadyResult {
  const clientKey = getEnvOne(["TOSS_CLIENT_KEY", "TOSS_PAYMENTS_CLIENT_KEY", "NEXT_PUBLIC_TOSS_CLIENT_KEY"]);
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
    message: "토스 결제창 준비 완료",
  };
}

async function tossConfirm(input: ConfirmInput): Promise<ConfirmResult> {
  const secretKey = getEnvOne(["TOSS_SECRET_KEY", "TOSS_PAYMENTS_SECRET_KEY"]);

  if (!input.paymentKey) {
    throw new Error("live 결제 확정에는 paymentKey가 필요합니다.");
  }

  const basicAuth = Buffer.from(`${secretKey}:`).toString("base64");

  const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentKey: input.paymentKey,
      orderId: input.orderId,
      amount: input.amount,
    }),
  });

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const message = String(json?.message || json?.code || "토스 결제 확정 실패");
    throw new Error(message);
  }

  const approvedAt = String(json?.approvedAt || new Date().toISOString());

  return {
    provider: "live",
    message: "토스 결제가 정상 승인되었습니다.",
    approvedAt,
    raw: json,
  };
}

export function paymentReady(input: ReadyInput): ReadyResult {
  const mode = getPaymentMode();
  if (mode === "mock") return mockReady(input);

  if (input.method === "tosspay" || input.method === "card") return tossReady(input);

  throw new Error("현재 live 결제는 토스/카드만 지원합니다. (카카오/네이버는 순차 연동 예정)");
}

export async function paymentConfirm(input: ConfirmInput): Promise<ConfirmResult> {
  const mode = getPaymentMode();
  if (mode === "mock") {
    return {
      provider: "mock",
      message: "데모 결제 확정 완료",
      approvedAt: new Date().toISOString(),
    };
  }

  if (input.method === "tosspay" || input.method === "card") {
    return tossConfirm(input);
  }

  throw new Error("현재 live 결제 확정은 토스/카드만 지원합니다.");
}
