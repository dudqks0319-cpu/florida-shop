export type ShopProduct = {
  id: string;
  name: string;
  price: number;
  salePrice?: number | null;
  category: string;
  image?: string | null;
};

const FALLBACK_PRODUCTS: ShopProduct[] = [
  { id: "1", name: "오버핏 린넨 셔츠", price: 45900, salePrice: 39900, category: "상의" },
  { id: "2", name: "와이드 데님 팬츠", price: 59900, salePrice: 49900, category: "하의" },
  { id: "3", name: "레더 숄더백", price: 89000, category: "가방" },
];

export async function listShopProducts(): Promise<ShopProduct[]> {
  // TODO: Supabase 연결 시 실제 products 테이블 조회로 교체
  return FALLBACK_PRODUCTS;
}
