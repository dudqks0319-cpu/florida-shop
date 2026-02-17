export type FloridaCategory = "전체" | "구제" | "영캐주얼" | "잡화" | "모자";

export type FloridaReview = {
  user: string;
  rating: number;
  comment: string;
};

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
  image?: string;
  sizes: string[];
  shippingInfo: string;
  reviews: FloridaReview[];
};

export const FLORIDA_PRODUCTS: FloridaProduct[] = [
  {
    id: "v1",
    name: "빈티지 데님 자켓",
    category: "구제",
    price: 49000,
    originalPrice: 69000,
    discountRate: 29,
    desc: "워싱 포인트, 유니섹스 핏",
    badge: "오늘출발",
    color: "from-blue-100 to-blue-300",
    image: "/florida/uploads/look-1.jpg",
    sizes: ["S", "M", "L"],
    shippingInfo: "오늘 결제 시 내일 출발 · 무료배송",
    reviews: [
      { user: "민지", rating: 5, comment: "핏이 예뻐서 데일리로 잘 입어요." },
      { user: "서연", rating: 4, comment: "실물이 더 빈티지해서 만족!" },
    ],
  },
  {
    id: "v2",
    name: "Y2K 카고 팬츠",
    category: "영캐주얼",
    price: 39000,
    originalPrice: 55000,
    discountRate: 29,
    desc: "와이드 실루엣, 데일리 코디",
    badge: "인기",
    color: "from-zinc-100 to-zinc-300",
    image: "/florida/uploads/look-2.jpg",
    sizes: ["S", "M", "L", "XL"],
    shippingInfo: "2시 이전 결제 시 당일 출고",
    reviews: [
      { user: "지우", rating: 5, comment: "길이감 딱 좋고 힙해요." },
      { user: "하늘", rating: 4, comment: "허리 밴딩이라 편해요." },
    ],
  },
  {
    id: "v3",
    name: "레터링 볼캡",
    category: "모자",
    price: 19000,
    desc: "사계절 착용 가능한 기본 캡",
    badge: "재입고",
    color: "from-emerald-100 to-emerald-300",
    image: "/florida/uploads/look-3.jpg",
    sizes: ["Free"],
    shippingInfo: "무료배송 · 제주/도서산간 추가요금",
    reviews: [{ user: "나영", rating: 5, comment: "로고 포인트 예쁘고 챙 깊이 딱 좋아요." }],
  },
  {
    id: "v4",
    name: "캔버스 숄더백",
    category: "잡화",
    price: 29000,
    originalPrice: 39000,
    discountRate: 26,
    desc: "수납 넉넉한 데일리 백",
    color: "from-amber-100 to-amber-300",
    sizes: ["Free"],
    shippingInfo: "오늘출발 · 무료배송",
    reviews: [{ user: "하은", rating: 4, comment: "가볍고 수납이 진짜 좋아요." }],
  },
  {
    id: "v5",
    name: "크롭 후드 집업",
    category: "영캐주얼",
    price: 42000,
    desc: "가벼운 소재, 간절기 추천",
    badge: "MD추천",
    color: "from-rose-100 to-rose-300",
    sizes: ["S", "M"],
    shippingInfo: "무료배송",
    reviews: [{ user: "유진", rating: 5, comment: "크롭 기장이라 코디하기 좋아요." }],
  },
  {
    id: "v6",
    name: "체인 키링 세트",
    category: "잡화",
    price: 12000,
    desc: "포인트 액세서리 3종",
    color: "from-violet-100 to-violet-300",
    sizes: ["Free"],
    shippingInfo: "무료배송",
    reviews: [{ user: "수빈", rating: 4, comment: "가방에 달면 포인트 됩니다." }],
  },
  {
    id: "v7",
    name: "패치워크 니트",
    category: "구제",
    price: 45000,
    desc: "유니크 패턴, 포근한 착용감",
    color: "from-orange-100 to-orange-300",
    sizes: ["M", "L"],
    shippingInfo: "무료배송",
    reviews: [{ user: "가영", rating: 5, comment: "퀄리티 좋고 따뜻해요." }],
  },
  {
    id: "v8",
    name: "플리츠 미니 스커트",
    category: "영캐주얼",
    price: 33000,
    desc: "교복핏 무드의 데일리룩",
    color: "from-pink-100 to-pink-300",
    sizes: ["S", "M", "L"],
    shippingInfo: "무료배송",
    reviews: [{ user: "채원", rating: 4, comment: "주름 잘 잡혀 있고 핏 예뻐요." }],
  },
];
