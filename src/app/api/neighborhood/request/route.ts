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

    const allowDemoCode = process.env.ALLOW_DEMO_CODE === "true";
    const smsConfigured = Boolean(process.env.SMS_API_KEY && process.env.SMS_API_SECRET && process.env.SMS_FROM_NUMBER);
    const localDevFallback = process.env.NODE_ENV !== "production" && !smsConfigured;

    if (!allowDemoCode && !smsConfigured && !localDevFallback) {
      return NextResponse.json(
        {
          error: "현재 SMS 인증 발송 설정이 준비되지 않았습니다. 잠시 후 다시 시도하거나 운영자에게 문의해주세요.",
          guide:
            "운영 환경에서는 SMS 연동이 필요합니다. 테스트 환경이라면 ALLOW_DEMO_CODE=true로 임시 데모 코드를 사용할 수 있습니다.",
        },
        { status: 503 },
      );
    }

    const db = await readDB();
    const requestId = makeId();
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    db.verifications.unshift({
      id: requestId,
      requester: currentUser.name,
      requesterId: currentUser.id,
      apartment: currentUser.apartment,
      dong: currentUser.dong,
      code,
      expiresAt,
      verified: false,
      attempts: 0,
      createdAt: new Date().toISOString(),
    });

    await writeDB(db);

    const useVisibleCode = allowDemoCode || localDevFallback;
    const deliveryMethod = useVisibleCode ? "demo" : "sms";

    return NextResponse.json({
      requestId,
      apartment: currentUser.apartment,
      dong: currentUser.dong,
      deliveryMethod,
      message: useVisibleCode
        ? localDevFallback
          ? "SMS 설정이 없어 로컬 개발용 데모코드를 표시합니다. 운영 배포 전에는 반드시 SMS 연동이 필요합니다."
          : "인증코드가 발급되었습니다. (데모 모드: 코드가 응답에 포함됩니다)"
        : "인증코드가 발급되었습니다. 등록된 휴대폰 문자 메시지를 확인해주세요.",
      guide:
        "문자가 오지 않으면 1) 스팸함 확인 2) 60초 후 재발급 3) 계속 실패 시 고객센터 문의하기",
      ...(useVisibleCode ? { demoCode: code } : {}),
      expiresAt,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "인증코드 발급 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
