import { NextRequest } from "next/server";

type Rule = {
  limit: number;
  windowMs: number;
};

type LimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
};

const hitStore = new Map<string, number[]>();
const loginFailStore = new Map<string, number[]>();
const loginLockStore = new Map<string, number>();

function now() {
  return Date.now();
}

function prune(arr: number[], windowMs: number) {
  const cutoff = now() - windowMs;
  return arr.filter((ts) => ts > cutoff);
}

function computeLimit(key: string, rule: Rule): LimitResult {
  const prev = hitStore.get(key) ?? [];
  const valid = prune(prev, rule.windowMs);

  if (valid.length >= rule.limit) {
    const oldest = valid[0] ?? now();
    const retryAfterMs = Math.max(0, oldest + rule.windowMs - now());
    hitStore.set(key, valid);
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.ceil(retryAfterMs / 1000),
    };
  }

  valid.push(now());
  hitStore.set(key, valid);
  return {
    ok: true,
    remaining: Math.max(0, rule.limit - valid.length),
    retryAfterSec: 0,
  };
}

export function getClientIp(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

export function limitSmsPerMinute(ip: string) {
  return computeLimit(`sms:1m:${ip}`, { limit: 1, windowMs: 60 * 1000 });
}

export function limitSmsPerHour(ip: string) {
  return computeLimit(`sms:1h:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
}

export function limitErrandCreatePerHour(userId: string) {
  return computeLimit(`errand:create:1h:${userId}`, { limit: 10, windowMs: 60 * 60 * 1000 });
}

export function checkLoginLock(ip: string) {
  const lockUntil = loginLockStore.get(ip) ?? 0;
  if (lockUntil <= now()) {
    loginLockStore.delete(ip);
    return { locked: false, retryAfterSec: 0 };
  }

  return {
    locked: true,
    retryAfterSec: Math.ceil((lockUntil - now()) / 1000),
  };
}

export function registerLoginFailure(ip: string) {
  const prev = loginFailStore.get(ip) ?? [];
  const valid = prune(prev, 10 * 60 * 1000);
  valid.push(now());
  loginFailStore.set(ip, valid);

  if (valid.length >= 5) {
    loginLockStore.set(ip, now() + 10 * 60 * 1000);
  }
}

export function clearLoginFailures(ip: string) {
  loginFailStore.delete(ip);
  loginLockStore.delete(ip);
}

export function __resetRateLimitForTests() {
  hitStore.clear();
  loginFailStore.clear();
  loginLockStore.clear();
}
