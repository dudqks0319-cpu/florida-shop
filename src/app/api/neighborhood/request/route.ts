import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { makeId, readDB, writeDB } from "@/lib/store";

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser(req);
  if (!currentUser) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (currentUser.role !== "requester" && currentUser.role !== "admin") {
    return NextResponse.json({ error: "의뢰자 권한으로만 인증코드 발급이 가능합니다." }, { status: 403 });
  }

  const body = await req.json();
  const requester = String(body?.requester || "").trim();
  const apartment = String(body?.apartment || "").trim();
  const dong = String(body?.dong || "").trim();

  if (!requester || !apartment || !dong) {
    return NextResponse.json({ error: "이름, 아파트명, 동네 정보가 필요합니다." }, { status: 400 });
  }
  if (requester !== currentUser.name) {
    return NextResponse.json({ error: "로그인 계정 이름과 의뢰자 이름이 일치해야 합니다." }, { status: 403 });
  }

  const db = await readDB();
  const requestId = makeId();
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  db.verifications.unshift({
    id: requestId,
    requester,
    apartment,
    dong,
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
    message: allowDemoCode
      ? "인증코드가 발급되었습니다. (데모 모드: 코드가 응답에 포함됩니다)"
      : "인증코드가 발급되었습니다. 운영 모드에서는 코드가 응답에 노출되지 않습니다.",
    ...(allowDemoCode ? { demoCode: code } : {}),
    expiresAt,
  });
}
