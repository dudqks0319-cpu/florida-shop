import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const db = await readDB();
  const idx = db.errands.findIndex((e) => e.id === id);
  if (idx < 0) return NextResponse.json({ error: "not found" }, { status: 404 });

  db.errands[idx] = { ...db.errands[idx], ...body };
  await writeDB(db);
  return NextResponse.json(db.errands[idx]);
}
