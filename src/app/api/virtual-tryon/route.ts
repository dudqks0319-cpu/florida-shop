import { NextRequest, NextResponse } from "next/server";
import { FLORIDA_PRODUCTS } from "@/lib/florida-products";

function getMockResult(productId: string) {
  const mockMap: Record<string, string> = {
    v1: "/florida/uploads/look-1.jpg",
    v2: "/florida/uploads/look-2.jpg",
    v3: "/florida/uploads/look-3.jpg",
  };
  return mockMap[productId] || "/florida/uploads/look-1.jpg";
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const productId = String(body?.productId || "v1");
  const selfieProvided = Boolean(body?.selfieDataUrl);

  const mode = process.env.VTO_MODE === "live" ? "live" : "mock";
  const product = FLORIDA_PRODUCTS.find((p) => p.id === productId);

  if (mode === "mock") {
    return NextResponse.json({
      ok: true,
      mode,
      message: selfieProvided
        ? "가상피팅 결과가 생성되었습니다. (MVP mock)"
        : "셀카 없이 상품 기준 결과를 생성했습니다. (MVP mock)",
      resultImageUrl: getMockResult(productId),
    });
  }

  const apiUrl = process.env.VTO_API_URL;
  const apiKey = process.env.VTO_API_KEY;
  if (!apiUrl || !apiKey) {
    return NextResponse.json(
      { error: "VTO live 모드 설정이 누락되었습니다. VTO_API_URL/VTO_API_KEY를 확인해주세요." },
      { status: 400 },
    );
  }

  if (!product?.image || !body?.selfieDataUrl) {
    return NextResponse.json({ error: "상품 이미지 또는 셀카 이미지가 필요합니다." }, { status: 400 });
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const productImageUrl = product.image.startsWith("http") ? product.image : `${site}${product.image}`;

  try {
    const liveRes = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        productId,
        productImageUrl,
        userImageDataUrl: body.selfieDataUrl,
      }),
    });

    const liveJson = await liveRes.json().catch(() => ({}));
    if (!liveRes.ok) {
      return NextResponse.json({ error: liveJson?.error || "VTO API 호출 실패" }, { status: 502 });
    }

    const resultImageUrl = String(liveJson?.resultImageUrl || liveJson?.output?.image || "");
    if (!resultImageUrl) {
      return NextResponse.json({ error: "VTO API 응답에 결과 이미지가 없습니다." }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      mode,
      message: "가상피팅 결과가 생성되었습니다.",
      resultImageUrl,
      raw: liveJson,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "VTO 처리 실패" }, { status: 500 });
  }
}
