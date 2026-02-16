import { afterEach, describe, expect, it } from "vitest";
import { paymentReady } from "./payment";

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
    delete process.env.KAKAOPAY_ADMIN_KEY;
    delete process.env.NAVERPAY_CLIENT_ID;
    delete process.env.NAVERPAY_CLIENT_SECRET;
  });

  it("defaults to mock mode", () => {
    const result = paymentReady(BASE_INPUT);
    expect(result.provider).toBe("mock");
    expect(result.checkoutUrl).toContain("/mock-checkout/kakaopay/order-123");
  });

  it("throws when live kakao key is missing", () => {
    process.env.PAYMENT_MODE = "live";
    expect(() => paymentReady(BASE_INPUT)).toThrowError("KAKAOPAY_ADMIN_KEY 환경변수가 필요합니다.");
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
