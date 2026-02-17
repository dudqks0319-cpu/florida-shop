import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getClientIp, limitSmsPerHour, limitSmsPerMinute } from "@/lib/rate-limit";
import { makeId, readDB, writeDB } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }
    if (currentUser.role !== "requester" && currentUser.role !== "admin") {
      return NextResponse.json({ error: "의뢰자 권한으로만 인증코드 발급이 가능합니다." }, { status: 403 });
    }
    if (!currentUser.apartment || !currentUser.dong || !currentUser.address) {
      return NextResponse.json({ error: "회원가입 시 입력한 주소(아파트/동) 정보가 필요합니다." }, { status: 400 });
    }

    const ip = getClientIp(req);
    const byMinute = limitSmsPerMinute(ip);
    if (!byMinute.ok) {
      return NextResponse.json(
        { error: `인증코드 발급이 너무 빠릅니다. ${byMinute.retryAfterSec}초 후 다시 시도해주세요.` },
        { status: 429 },
      );
    }

    const byHour = limitSmsPerHour(ip);
    if (!byHour.ok) {
      return NextResponse.json(
        { error: `인증코드 발급 횟수를 초과했습니다. ${byHour.retryAfterSec}초 후 다시 시도해주세요.` },
        { status: 429 },
      );
    }

    const db = await readDB();
    const requestId = makeId();
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    db.verifications.unshift({
      id: requestId,
      requester: currentUser.name,
      apartment: currentUser.apartment,
      dong: currentUser.dong,
      code,
      expiresAt,
      verified: false,
      attempts: 0,
      createdAt: new Date().toISOString(),
    });

    await writeDB(db);

    const allowDemoCode = process.env.ALLOW_DEMO_CODE === "true";

    return NextResponse.json({
      requestId,
      apartment: currentUser.apartment,
      dong: currentUser.dong,
      message: allowDemoCode
        ? "인증코드가 발급되었습니다. (데모 모드: 코드가 응답에 포함됩니다)"
        : "인증코드가 발급되었습니다. 운영 모드에서는 코드가 응답에 노출되지 않습니다.",
      ...(allowDemoCode ? { demoCode: code } : {}),
      expiresAt,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "인증코드 발급 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
