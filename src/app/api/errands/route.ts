import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { limitErrandCreatePerHour } from "@/lib/rate-limit";
import { makeId, readDB, writeDB } from "@/lib/store";

const MIN_REWARD = 3000;
const MAX_REWARD = 100000;
const VALID_CATEGORIES = new Set(["convenience", "delivery", "bank", "admin", "etc"]);
const VALID_PAYMENT_METHODS = new Set(["kakaopay", "naverpay", "tosspay", "card"]);

export async function GET() {
  const db = await readDB();
  const list = [...db.errands].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }
    if (currentUser.role !== "requester" && currentUser.role !== "admin") {
      return NextResponse.json({ error: "의뢰자 권한으로만 의뢰 등록이 가능합니다." }, { status: 403 });
    }

    const createLimit = limitErrandCreatePerHour(currentUser.id);
    if (!createLimit.ok) {
      return NextResponse.json(
        { error: `의뢰 등록은 1시간에 최대 10건입니다. ${createLimit.retryAfterSec}초 후 다시 시도해주세요.` },
        { status: 429 },
      );
    }

    const body = await req.json();
    const title = String(body?.title || "").trim();
    const requester = currentUser.name;
    const apartment = String(body?.apartment || currentUser.apartment || "").trim();
    const rewardKrw = Number(body?.rewardKrw || 0);
    let verificationRequestId = String(body?.verificationRequestId || "").trim();
    const detail = String(body?.detail || "").trim();
    const category = String(body?.category || "etc").trim();
    const paymentMethod = String(body?.paymentMethod || "card").trim();

    if (!title || !apartment || !rewardKrw) {
      return NextResponse.json({ error: "필수 항목(제목/아파트/금액)이 비었습니다." }, { status: 400 });
    }
    if (currentUser.apartment && apartment !== currentUser.apartment) {
      return NextResponse.json({ error: "회원가입한 주소지(아파트)로만 의뢰를 등록할 수 있습니다." }, { status: 403 });
    }
    if (!currentUser.neighborhoodVerifiedAt) {
      return NextResponse.json({ error: "동네 인증 완료 후 의뢰를 등록할 수 있습니다." }, { status: 403 });
    }
    if (title.length > 80) {
      return NextResponse.json({ error: "제목은 80자 이내로 입력해주세요." }, { status: 400 });
    }
    if (!Number.isInteger(rewardKrw)) {
      return NextResponse.json({ error: "보상금은 정수(원 단위)로 입력해주세요." }, { status: 400 });
    }
    if (rewardKrw < MIN_REWARD || rewardKrw > MAX_REWARD) {
      return NextResponse.json({ error: `보상금은 ${MIN_REWARD.toLocaleString()}원~${MAX_REWARD.toLocaleString()}원 사이여야 합니다.` }, { status: 400 });
    }
    if (detail.length > 500) {
      return NextResponse.json({ error: "상세 내용은 500자 이내로 입력해주세요." }, { status: 400 });
    }
    if (!VALID_CATEGORIES.has(category)) {
      return NextResponse.json({ error: "유효하지 않은 카테고리입니다." }, { status: 400 });
    }
    if (!VALID_PAYMENT_METHODS.has(paymentMethod)) {
      return NextResponse.json({ error: "유효하지 않은 결제수단입니다." }, { status: 400 });
    }

    const db = await readDB();

    const nowMs = Date.now();
    const isSameVerificationOwner = (verification: (typeof db.verifications)[number]) =>
      verification.requesterId ? verification.requesterId === currentUser.id : verification.requester === requester;

    const verified = verificationRequestId
      ? db.verifications.find((v) => v.id === verificationRequestId)
      : db.verifications.find(
          (v) =>
            v.verified &&
            isSameVerificationOwner(v) &&
            v.apartment === apartment &&
            new Date(v.expiresAt).getTime() >= nowMs,
        );

    if (!verified || !verified.verified) {
      return NextResponse.json({ error: "동네 인증 완료 후 의뢰를 등록할 수 있습니다." }, { status: 403 });
    }

    if (new Date(verified.expiresAt).getTime() < nowMs) {
      return NextResponse.json({ error: "동네 인증이 만료되었습니다. 다시 인증해주세요." }, { status: 403 });
    }

    if (!isSameVerificationOwner(verified) || verified.apartment !== apartment) {
      return NextResponse.json({ error: "인증한 계정/아파트와 의뢰 정보가 일치하지 않습니다." }, { status: 403 });
    }

    verificationRequestId = verificationRequestId || verified.id;

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
      detail,
      category: category as "convenience" | "delivery" | "bank" | "admin" | "etc",
      rewardKrw,
      requester,
      requesterId: currentUser.id,
      apartment,
      status: "open" as const,
      payment: {
        method: paymentMethod as "kakaopay" | "naverpay" | "tosspay" | "card",
        status: "pending" as const,
        provider: "mock" as const,
        orderId: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      },
      createdAt: new Date().toISOString(),
    };

    db.errands.unshift(errand);
    await writeDB(db);
    return NextResponse.json(errand, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "의뢰 등록 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
