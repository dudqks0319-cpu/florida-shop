export type FloridaCategory = "전체" | "구제" | "영캐주얼" | "잡화" | "모자";

export type FloridaProduct = {
  id: string;
  name: string;
  category: Exclude<FloridaCategory, "전체">;
  price: number;
  originalPrice?: number;
  discountRate?: number;
  desc: string;
  badge?: string;
  color: string;
};

export const FLORIDA_PRODUCTS: FloridaProduct[] = [
  { id: "v1", name: "빈티지 데님 자켓", category: "구제", price: 49000, originalPrice: 69000, discountRate: 29, desc: "워싱 포인트, 유니섹스 핏", badge: "오늘출발", color: "from-blue-100 to-blue-300" },
  { id: "v2", name: "Y2K 카고 팬츠", category: "영캐주얼", price: 39000, originalPrice: 55000, discountRate: 29, desc: "와이드 실루엣, 데일리 코디", badge: "인기", color: "from-zinc-100 to-zinc-300" },
  { id: "v3", name: "레터링 볼캡", category: "모자", price: 19000, desc: "사계절 착용 가능한 기본 캡", badge: "재입고", color: "from-emerald-100 to-emerald-300" },
  { id: "v4", name: "캔버스 숄더백", category: "잡화", price: 29000, originalPrice: 39000, discountRate: 26, desc: "수납 넉넉한 데일리 백", color: "from-amber-100 to-amber-300" },
  { id: "v5", name: "크롭 후드 집업", category: "영캐주얼", price: 42000, desc: "가벼운 소재, 간절기 추천", badge: "MD추천", color: "from-rose-100 to-rose-300" },
  { id: "v6", name: "체인 키링 세트", category: "잡화", price: 12000, desc: "포인트 액세서리 3종", color: "from-violet-100 to-violet-300" },
  { id: "v7", name: "패치워크 니트", category: "구제", price: 45000, desc: "유니크 패턴, 포근한 착용감", color: "from-orange-100 to-orange-300" },
  { id: "v8", name: "플리츠 미니 스커트", category: "영캐주얼", price: 33000, desc: "교복핏 무드의 데일리룩", color: "from-pink-100 to-pink-300" }
];
