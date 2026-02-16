import { describe, expect, it } from "vitest";
import {
  __resetRateLimitForTests,
  checkLoginLock,
  clearLoginFailures,
  limitErrandCreatePerHour,
  limitSmsPerMinute,
  registerLoginFailure,
} from "./rate-limit";

describe("rate-limit", () => {
  it("limits sms to 1 per minute", () => {
    __resetRateLimitForTests();

    const first = limitSmsPerMinute("ip-1");
    const second = limitSmsPerMinute("ip-1");

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
  });

  it("limits errand create to 10 per hour", () => {
    __resetRateLimitForTests();

    for (let i = 0; i < 10; i++) {
      expect(limitErrandCreatePerHour("user-1").ok).toBe(true);
    }
    expect(limitErrandCreatePerHour("user-1").ok).toBe(false);
  });

  it("locks login after 5 failures", () => {
    __resetRateLimitForTests();

    for (let i = 0; i < 5; i++) registerLoginFailure("ip-lock");

    const lock = checkLoginLock("ip-lock");
    expect(lock.locked).toBe(true);

    clearLoginFailures("ip-lock");
    expect(checkLoginLock("ip-lock").locked).toBe(false);
  });
});
