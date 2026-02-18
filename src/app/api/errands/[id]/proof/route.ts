import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getCurrentUser } from "@/lib/auth";
import { readDB, writeDB } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const db = await readDB();
  const idx = db.errands.findIndex((e) => e.id === id);
  if (idx < 0) return NextResponse.json({ error: "의뢰를 찾을 수 없습니다." }, { status: 404 });

  const errand = db.errands[idx];
  const isHelper = errand.helperId ? errand.helperId === user.id : errand.helper === user.name;

  if (!isHelper && user.role !== "admin") {
    return NextResponse.json({ error: "담당 수행자 또는 관리자만 완료 증빙을 업로드할 수 있습니다." }, { status: 403 });
  }
  if (errand.status !== "in_progress") {
    return NextResponse.json({ error: "진행중 상태에서만 완료 증빙을 업로드할 수 있습니다." }, { status: 400 });
  }

  const form = await req.formData();
  const note = String(form.get("note") || "").trim();
  const file = form.get("file");

  if (!note && !(file instanceof File)) {
    return NextResponse.json({ error: "메모 또는 증빙 이미지 중 하나는 필요합니다." }, { status: 400 });
  }

  let imageUrl = errand.proof?.imageUrl;

  if (file instanceof File) {
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ error: "jpg/png/webp 파일만 업로드할 수 있습니다." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "증빙 이미지는 5MB 이하만 업로드할 수 있습니다." }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const filename = `proof-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "errands");
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), bytes);
    imageUrl = `/uploads/errands/${filename}`;
  }

  db.errands[idx] = {
    ...errand,
    proof: {
      note: note || undefined,
      imageUrl,
      uploadedAt: new Date().toISOString(),
      helperId: user.id,
      helperName: user.name,
    },
  };

  await writeDB(db);

  return NextResponse.json({ ok: true, proof: db.errands[idx].proof });
}
