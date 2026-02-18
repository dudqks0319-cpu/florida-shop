import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { readDB, writeDB } from "@/lib/store";

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser(req);
  if (!currentUser) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json();
  const requestId = String(body?.requestId || "");
  const code = String(body?.code || "");

  if (!requestId || !code) {
    return NextResponse.json({ error: "requestId와 code가 필요합니다." }, { status: 400 });
  }

  const db = await readDB();
  const item = db.verifications.find((v) => v.id === requestId);
  if (!item) return NextResponse.json({ error: "인증 요청을 찾을 수 없습니다." }, { status: 404 });

  const isRequesterOwner = item.requesterId
    ? item.requesterId === currentUser.id
    : item.requester === currentUser.name;

  if (!isRequesterOwner) {
    return NextResponse.json({ error: "본인 인증 요청만 확인할 수 있습니다." }, { status: 403 });
  }
  if (currentUser.apartment && item.apartment !== currentUser.apartment) {
    return NextResponse.json({ error: "회원가입 주소지(아파트)와 인증 요청이 일치하지 않습니다." }, { status: 403 });
  }

  if (new Date(item.expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: "인증코드가 만료되었습니다." }, { status: 400 });
  }

  if (item.attempts >= 5) {
    return NextResponse.json({ error: "인증 시도 횟수를 초과했습니다. 코드를 다시 발급받아 주세요." }, { status: 429 });
  }

  if (item.code !== code) {
    item.attempts += 1;
    item.lastAttemptAt = new Date().toISOString();
    await writeDB(db);
    return NextResponse.json({ error: `인증코드가 일치하지 않습니다. (${item.attempts}/5)` }, { status: 400 });
  }

  item.verified = true;
  item.lastAttemptAt = new Date().toISOString();

  const me = db.users.find((u) => u.id === currentUser.id);
  if (me) {
    me.neighborhoodVerifiedAt = new Date().toISOString();
  }

  await writeDB(db);

  return NextResponse.json({ ok: true, neighborhood: `${item.dong} (${item.apartment})` });
}
