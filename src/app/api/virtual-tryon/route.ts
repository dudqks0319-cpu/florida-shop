import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const productId = String(body?.productId || "v1");
  const selfieProvided = Boolean(body?.selfieName);

  // MVP: 실제 AI 합성 대신 mock 결과 URL 반환
  const mockMap: Record<string, string> = {
    v1: "/florida/uploads/look-1.jpg",
    v2: "/florida/uploads/look-2.jpg",
    v3: "/florida/uploads/look-3.jpg",
  };

  return NextResponse.json({
    ok: true,
    mode: "mock",
    message: selfieProvided ? "가상피팅 결과가 생성되었습니다. (MVP mock)" : "셀카 없이 상품 기준 결과를 생성했습니다. (MVP mock)",
    resultImageUrl: mockMap[productId] || "/florida/uploads/look-1.jpg",
  });
}
