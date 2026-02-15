import { NextRequest, NextResponse } from "next/server";

const JUSO_ENDPOINT = "https://business.juso.go.kr/addrlink/addrLinkApi.do";

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get("keyword")?.trim();
  if (!keyword) {
    return NextResponse.json({ error: "keyword가 필요합니다." }, { status: 400 });
  }

  const confmKey = process.env.GOV_JUSO_API_KEY;
  if (!confmKey) {
    return NextResponse.json(
      {
        error: "GOV_JUSO_API_KEY가 설정되지 않았습니다.",
        guide: "공공기관(도로명주소 API) 발급 키를 .env.local에 설정하세요.",
      },
      { status: 400 },
    );
  }

  const url = new URL(JUSO_ENDPOINT);
  url.searchParams.set("confmKey", confmKey);
  url.searchParams.set("currentPage", "1");
  url.searchParams.set("countPerPage", "8");
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("resultType", "json");

  try {
    const res = await fetch(url, { cache: "no-store" });
    const json = await res.json();

    const list = (json?.results?.juso || []).map((j: Record<string, string>) => ({
      roadAddr: j.roadAddr,
      jibunAddr: j.jibunAddr,
      siNm: j.siNm,
      sggNm: j.sggNm,
      emdNm: j.emdNm,
      zipNo: j.zipNo,
      bdNm: j.bdNm,
      admCd: j.admCd,
    }));

    return NextResponse.json({ items: list });
  } catch {
    return NextResponse.json({ error: "주소 조회에 실패했습니다." }, { status: 500 });
  }
}
