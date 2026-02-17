import { NextResponse } from "next/server";

export async function GET() {
  const providers = {
    kakao: Boolean(process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET),
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    naver: Boolean(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET),
  };

  return NextResponse.json({ ok: true, providers });
}
