import { NextRequest, NextResponse } from "next/server";
import { makeId, readDB, writeDB } from "@/lib/store";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const requester = String(body?.requester || "").trim();
  const apartment = String(body?.apartment || "").trim();
  const dong = String(body?.dong || "").trim();

  if (!requester || !apartment || !dong) {
    return NextResponse.json({ error: "이름, 아파트명, 동네 정보가 필요합니다." }, { status: 400 });
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
    createdAt: new Date().toISOString(),
  });

  await writeDB(db);

  return NextResponse.json({
    requestId,
    message: "인증코드가 발급되었습니다. (MVP 데모에서는 코드가 바로 표시됩니다)",
    demoCode: code,
    expiresAt,
  });
}
