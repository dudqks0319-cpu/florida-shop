import { NextRequest, NextResponse } from "next/server";
import { checkLoginLock, clearLoginFailures, getClientIp, registerLoginFailure } from "@/lib/rate-limit";
import { hashPassword, normalizeEmail } from "@/lib/auth-helpers";
import { makeId, makeSessionToken, pruneExpiredSessions, readDB, writeDB, type UserRole } from "@/lib/store";

const SESSION_DAYS = 7;

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const lock = checkLoginLock(ip);
    if (lock.locked) {
      return NextResponse.json(
        { error: `로그인 시도 횟수를 초과했습니다. ${lock.retryAfterSec}초 후 다시 시도해주세요.` },
        { status: 429 },
      );
    }

    const body = await req.json();
    const mode = String(body?.mode || "legacy").trim();

    const db = await readDB();
    pruneExpiredSessions(db);

    let user: (typeof db.users)[number] | undefined;

    if (mode === "email") {
      const email = normalizeEmail(String(body?.email || ""));
      const password = String(body?.password || "");

      if (!email || !password) {
        registerLoginFailure(ip);
        return NextResponse.json({ error: "이메일과 비밀번호를 입력해주세요." }, { status: 400 });
      }

      user = db.users.find((u) => (u.email || "").toLowerCase() === email && u.provider === "email");
      if (!user || !user.passwordHash || user.passwordHash !== hashPassword(password)) {
        registerLoginFailure(ip);
        return NextResponse.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
      }
    } else {
      const name = String(body?.name || "").trim();
      const role = String(body?.role || "").trim() as UserRole;

      if (!name || !role) {
        registerLoginFailure(ip);
        return NextResponse.json({ error: "이름과 역할이 필요합니다." }, { status: 400 });
      }
      if (!( ["requester", "helper", "admin"] as const).includes(role)) {
        registerLoginFailure(ip);
        return NextResponse.json({ error: "유효하지 않은 역할입니다." }, { status: 400 });
      }

      user = db.users.find((u) => u.name === name && u.role === role);
      if (!user) {
        user = {
          id: makeId(),
          name,
          role,
          createdAt: new Date().toISOString(),
        };
        db.users.unshift(user);
      }
    }

    if (!user) {
      registerLoginFailure(ip);
      return NextResponse.json({ error: "로그인 정보를 확인해주세요." }, { status: 400 });
    }

    const token = makeSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    db.sessions.unshift({ token, userId: user.id, createdAt: new Date().toISOString(), expiresAt });

    await writeDB(db);
    clearLoginFailures(ip);

    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, role: user.role, email: user.email, provider: user.provider },
    });
    res.cookies.set("de_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_DAYS * 24 * 60 * 60,
    });

    return res;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "로그인 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
