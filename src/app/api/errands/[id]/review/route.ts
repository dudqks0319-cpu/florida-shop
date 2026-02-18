import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { makeId, readDB, writeDB } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const rating = Number(body?.rating);
  const comment = String(body?.comment || "").trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "평점은 1~5점 정수로 입력해주세요." }, { status: 400 });
  }
  if (comment.length > 200) {
    return NextResponse.json({ error: "리뷰 코멘트는 200자 이내로 입력해주세요." }, { status: 400 });
  }

  const db = await readDB();
  const idx = db.errands.findIndex((e) => e.id === id);
  if (idx < 0) return NextResponse.json({ error: "의뢰를 찾을 수 없습니다." }, { status: 404 });

  const errand = db.errands[idx];
  if (errand.status !== "done") {
    return NextResponse.json({ error: "완료된 의뢰에만 리뷰를 남길 수 있습니다." }, { status: 400 });
  }

  const isRequesterOwner = errand.requesterId ? errand.requesterId === user.id : errand.requester === user.name;
  const isHelper = errand.helperId ? errand.helperId === user.id : errand.helper === user.name;

  if (!isRequesterOwner && !isHelper && user.role !== "admin") {
    return NextResponse.json({ error: "의뢰자/수행자/관리자만 리뷰를 남길 수 있습니다." }, { status: 403 });
  }

  let targetRole: "requester" | "helper";
  if (isRequesterOwner) {
    if (!errand.helper) {
      return NextResponse.json({ error: "수행자가 없는 건은 리뷰를 남길 수 없습니다." }, { status: 400 });
    }
    targetRole = "helper";
  } else if (isHelper) {
    targetRole = "requester";
  } else {
    const targetRaw = String(body?.targetRole || "").trim();
    if (targetRaw !== "requester" && targetRaw !== "helper") {
      return NextResponse.json({ error: "관리자는 targetRole(requester/helper)을 지정해야 합니다." }, { status: 400 });
    }
    targetRole = targetRaw;
  }

  const reviews = errand.reviews || [];
  const exists = reviews.find((r) => r.reviewerId === user.id && r.targetRole === targetRole);
  if (exists) {
    return NextResponse.json({ error: "같은 대상에 대한 리뷰는 1회만 등록할 수 있습니다." }, { status: 409 });
  }

  reviews.push({
    id: makeId(),
    reviewerId: user.id,
    reviewerName: user.name,
    targetRole,
    rating,
    comment: comment || undefined,
    createdAt: new Date().toISOString(),
  });

  db.errands[idx] = {
    ...errand,
    reviews,
  };

  await writeDB(db);

  return NextResponse.json({ ok: true, reviews: db.errands[idx].reviews || [] });
}
