import { NextRequest, NextResponse } from "next/server";
import { makeId, readDB, writeDB } from "@/lib/store";

const MIN_REWARD = 3000;
const MAX_REWARD = 100000;

export async function GET() {
  const db = await readDB();
  const list = [...db.errands].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const title = String(body?.title || "").trim();
  const requester = String(body?.requester || "").trim();
  const apartment = String(body?.apartment || "").trim();
  const rewardKrw = Number(body?.rewardKrw || 0);
  const verificationRequestId = String(body?.verificationRequestId || "").trim();

  if (!title || !requester || !apartment || !rewardKrw || !verificationRequestId) {
    return NextResponse.json({ error: "필수 항목(제목/의뢰자/아파트/금액/동네인증)이 비었습니다." }, { status: 400 });
  }
  if (title.length > 80) {
    return NextResponse.json({ error: "제목은 80자 이내로 입력해주세요." }, { status: 400 });
  }
  if (rewardKrw < MIN_REWARD || rewardKrw > MAX_REWARD) {
    return NextResponse.json({ error: `보상금은 ${MIN_REWARD.toLocaleString()}원~${MAX_REWARD.toLocaleString()}원 사이여야 합니다.` }, { status: 400 });
  }

  const db = await readDB();

  const verified = db.verifications.find((v) => v.id === verificationRequestId);
  if (!verified || !verified.verified) {
    return NextResponse.json({ error: "동네 인증 완료 후 의뢰를 등록할 수 있습니다." }, { status: 403 });
  }
  if (new Date(verified.expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: "동네 인증이 만료되었습니다. 다시 인증해주세요." }, { status: 403 });
  }
  if (verified.requester !== requester || verified.apartment !== apartment) {
    return NextResponse.json({ error: "인증한 이름/아파트와 의뢰 정보가 일치하지 않습니다." }, { status: 403 });
  }

  if (!db.meta) db.meta = {};
  if (!db.meta.pilotApartment) {
    db.meta.pilotApartment = apartment;
  }
  if (db.meta.pilotApartment !== apartment) {
    return NextResponse.json({ error: `현재 파일럿은 '${db.meta.pilotApartment}' 1개 단지만 운영합니다.` }, { status: 403 });
  }

  const errand = {
    id: makeId(),
    title,
    detail: String(body.detail || ""),
    category: (body.category || "etc") as "convenience" | "delivery" | "bank" | "admin" | "etc",
    rewardKrw,
    requester,
    apartment,
    status: "open" as const,
    createdAt: new Date().toISOString(),
  };

  db.errands.unshift(errand);
  await writeDB(db);
  return NextResponse.json(errand, { status: 201 });
}
