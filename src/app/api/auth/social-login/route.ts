import { NextRequest, NextResponse } from "next/server";
import { checkLoginLock, clearLoginFailures, getClientIp, registerLoginFailure } from "@/lib/rate-limit";
import { normalizeEmail, sanitizeText } from "@/lib/auth-helpers";
import { makeSessionToken, pruneExpiredSessions, readDB, type AuthProvider, writeDB } from "@/lib/store";

const SESSION_DAYS = 7;

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const lock = checkLoginLock(ip);
    if (lock.locked) {
      return NextResponse.json({ error: `로그인 시도 횟수를 초과했습니다. ${lock.retryAfterSec}초 후 다시 시도해주세요.` }, { status: 429 });
    }

    const body = await req.json();
    const providerRaw = sanitizeText(body?.provider);
    const provider = providerRaw as AuthProvider;
    const email = normalizeEmail(sanitizeText(body?.email));

    if (providerRaw !== "kakao" && providerRaw !== "google" && providerRaw !== "naver") {
      registerLoginFailure(ip);
      return NextResponse.json({ error: "지원하지 않는 소셜 로그인입니다." }, { status: 400 });
    }
    if (!email) {
      registerLoginFailure(ip);
      return NextResponse.json({ error: "소셜 가입 시 사용한 이메일을 입력해주세요." }, { status: 400 });
    }

    const db = await readDB();
    pruneExpiredSessions(db);

    const user = db.users.find((u) => (u.email || "").toLowerCase() === email && u.provider === provider);
    if (!user) {
      registerLoginFailure(ip);
      return NextResponse.json({ error: "해당 소셜 계정을 찾지 못했습니다. 먼저 회원가입을 진행해주세요." }, { status: 404 });
    }

    const token = makeSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    db.sessions.unshift({ token, userId: user.id, createdAt: new Date().toISOString(), expiresAt });
    await writeDB(db);
    clearLoginFailures(ip);

    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role, email: user.email, provider: user.provider } });
    res.cookies.set("de_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_DAYS * 24 * 60 * 60,
    });

    return res;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "소셜 로그인 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
