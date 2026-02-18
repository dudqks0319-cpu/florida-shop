import { afterEach, describe, expect, it } from "vitest";
import { paymentConfirm, paymentReady } from "./payment";

const BASE_INPUT = {
  orderId: "order-123",
  amount: 10000,
  orderName: "테스트 의뢰",
  method: "kakaopay" as const,
};

describe("paymentReady", () => {
  afterEach(() => {
    delete process.env.PAYMENT_MODE;
    delete process.env.TOSS_CLIENT_KEY;
    delete process.env.TOSS_PAYMENTS_CLIENT_KEY;
  });

  it("defaults to mock mode", () => {
    const result = paymentReady(BASE_INPUT);
    expect(result.provider).toBe("mock");
    expect(result.checkoutUrl).toContain("/mock-checkout/kakaopay/order-123");
  });

  it("throws when live method is not yet supported", () => {
    process.env.PAYMENT_MODE = "live";
    expect(() => paymentReady(BASE_INPUT)).toThrowError(
      "현재 live 결제는 토스/카드만 지원합니다. (카카오/네이버는 순차 연동 예정)",
    );
  });

  it("creates live toss checkout url when key exists", () => {
    process.env.PAYMENT_MODE = "live";
    process.env.TOSS_CLIENT_KEY = "test_client_key";

    const result = paymentReady({ ...BASE_INPUT, method: "tosspay" });
    expect(result.provider).toBe("live");
    expect(result.checkoutUrl).toContain("clientKey=test_client_key");
    expect(result.checkoutUrl).toContain("orderId=order-123");
  });
});

describe("paymentConfirm", () => {
  afterEach(() => {
    delete process.env.PAYMENT_MODE;
    delete process.env.TOSS_SECRET_KEY;
    delete process.env.TOSS_PAYMENTS_SECRET_KEY;
  });

  it("confirms immediately in mock mode", async () => {
    const result = await paymentConfirm({
      orderId: "order-123",
      amount: 10000,
      method: "kakaopay",
    });

    expect(result.provider).toBe("mock");
    expect(result.message).toContain("데모 결제 확정 완료");
  });

  it("requires paymentKey for live toss confirm", async () => {
    process.env.PAYMENT_MODE = "live";
    process.env.TOSS_SECRET_KEY = "test_secret";

    await expect(
      paymentConfirm({
        orderId: "order-123",
        amount: 10000,
        method: "tosspay",
      }),
    ).rejects.toThrowError("live 결제 확정에는 paymentKey가 필요합니다.");
  });
});
