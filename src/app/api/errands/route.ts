import { NextRequest, NextResponse } from "next/server";
import { makeId, readDB, writeDB } from "@/lib/store";

export async function GET() {
  const db = await readDB();
  const list = [...db.errands].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.title || !body?.requester || !body?.apartment || !body?.rewardKrw) {
    return NextResponse.json({ error: "필수 항목이 비었습니다." }, { status: 400 });
  }

  const db = await readDB();
  const errand = {
    id: makeId(),
    title: String(body.title),
    detail: String(body.detail || ""),
    category: (body.category || "etc") as "convenience" | "delivery" | "bank" | "admin" | "etc",
    rewardKrw: Number(body.rewardKrw),
    requester: String(body.requester),
    apartment: String(body.apartment),
    status: "open" as const,
    createdAt: new Date().toISOString(),
  };

  db.errands.unshift(errand);
  await writeDB(db);
  return NextResponse.json(errand, { status: 201 });
}
