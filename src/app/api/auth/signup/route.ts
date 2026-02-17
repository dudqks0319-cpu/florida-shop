import { NextRequest, NextResponse } from "next/server";
import { checkLoginLock, clearLoginFailures, getClientIp, registerLoginFailure } from "@/lib/rate-limit";
import {
  assertProfileComplete,
  hashPassword,
  isAdultFromBirthDate,
  normalizeEmail,
  sanitizeText,
} from "@/lib/auth-helpers";
import { makeId, makeSessionToken, pruneExpiredSessions, readDB, type AuthProvider, type UserRole, writeDB } from "@/lib/store";

const SESSION_DAYS = 7;

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const lock = checkLoginLock(ip);
    if (lock.locked) {
      return NextResponse.json({ error: `요청이 많습니다. ${lock.retryAfterSec}초 후 다시 시도해주세요.` }, { status: 429 });
    }

    const body = await req.json();
    const name = sanitizeText(body?.name);
    const email = normalizeEmail(sanitizeText(body?.email));
    const password = String(body?.password || "");
    const birthDate = sanitizeText(body?.birthDate);
    const address = sanitizeText(body?.address);
    const apartment = sanitizeText(body?.apartment);
    const dong = sanitizeText(body?.dong);
    const role = (sanitizeText(body?.role) || "requester") as UserRole;
    const provider = (sanitizeText(body?.provider) || "email") as AuthProvider;

    if (!name || !email || !birthDate || !address || !apartment || !dong) {
      registerLoginFailure(ip);
      return NextResponse.json({ error: "이름/이메일/생년월일/주소/아파트/동 정보를 입력해주세요." }, { status: 400 });
    }
    if (!( ["requester", "helper", "admin"] as const).includes(role)) {
      registerLoginFailure(ip);
      return NextResponse.json({ error: "유효하지 않은 역할입니다." }, { status: 400 });
    }
    if (!( ["email", "kakao", "google", "naver"] as const).includes(provider)) {
      registerLoginFailure(ip);
      return NextResponse.json({ error: "유효하지 않은 가입 방식입니다." }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      registerLoginFailure(ip);
      return NextResponse.json({ error: "유효한 이메일 형식이 아닙니다." }, { status: 400 });
    }
    if (!isAdultFromBirthDate(birthDate)) {
      registerLoginFailure(ip);
      return NextResponse.json({ error: "미성년자는 가입할 수 없습니다. (만 19세 이상)" }, { status: 403 });
    }

    if (provider === "email") {
      if (password.length < 8) {
        registerLoginFailure(ip);
        return NextResponse.json({ error: "비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
      }
    }

    const db = await readDB();
    pruneExpiredSessions(db);

    const emailExists = db.users.find((u) => (u.email || "").toLowerCase() === email);
    if (emailExists) {
      registerLoginFailure(ip);
      return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });
    }

    const user = {
      id: makeId(),
      name,
      role,
      email,
      provider,
      passwordHash: provider === "email" ? hashPassword(password) : undefined,
      birthDate,
      address,
      apartment,
      dong,
      createdAt: new Date().toISOString(),
    };

    if (!assertProfileComplete(user)) {
      registerLoginFailure(ip);
      return NextResponse.json({ error: "가입 프로필이 완전하지 않습니다." }, { status: 400 });
    }

    db.users.unshift(user);

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
    return NextResponse.json({ error: error instanceof Error ? error.message : "회원가입 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
