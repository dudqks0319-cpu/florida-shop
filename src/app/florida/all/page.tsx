"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import { FLORIDA_PRODUCTS, type FloridaCategory } from "@/lib/florida-products";
import {
  CATEGORY_LIST,
  filterAndSortProducts,
  getProductRating,
  parseCatalogFilters,
  toCatalogQueryString,
  type SortKey,
} from "@/lib/florida-catalog";
import { getCart, getWish, pushRecent, setCart, setWish } from "@/lib/florida-store";
import { getImageOverrides } from "@/lib/florida-admin";

const SORT_LABEL: Record<SortKey, string> = {
  recommend: "추천순",
  price_low: "낮은가격순",
  price_high: "높은가격순",
  review: "리뷰많은순",
};

function parsePriceInput(raw: string): number | null {
  if (!raw.trim()) return null;
  const onlyDigits = raw.replace(/[^0-9]/g, "");
  if (!onlyDigits) return null;
  const value = Number.parseInt(onlyDigits, 10);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

function formatPriceInput(value: string) {
  const parsed = parsePriceInput(value);
  return parsed === null ? "" : parsed.toLocaleString("ko-KR");
}

export default function FloridaAllPage() {
  const router = useRouter();

  const initial = useMemo(() => {
    if (typeof window === "undefined") return parseCatalogFilters(new URLSearchParams());
    return parseCatalogFilters(new URLSearchParams(window.location.search));
  }, []);

  const [category, setCategory] = useState<FloridaCategory>(initial.category);
  const [searchKeyword, setSearchKeyword] = useState(initial.searchKeyword);
  const [sort, setSort] = useState<SortKey>(initial.sort);
  const [minPriceInput, setMinPriceInput] = useState(initial.minPrice === null ? "" : String(initial.minPrice));
  const [maxPriceInput, setMaxPriceInput] = useState(initial.maxPrice === null ? "" : String(initial.maxPrice));

  const [wish, setWishState] = useState<Record<string, boolean>>(() => getWish());
  const [cart, setCartState] = useState<Record<string, number>>(() => getCart());
  const [imageOverrides] = useState<Record<string, string>>(() => getImageOverrides());

  const minPrice = useMemo(() => parsePriceInput(minPriceInput), [minPriceInput]);
  const maxPrice = useMemo(() => parsePriceInput(maxPriceInput), [maxPriceInput]);
  const normalizedMaxPrice = minPrice !== null && maxPrice !== null && maxPrice < minPrice ? minPrice : maxPrice;

  const filtered = useMemo(
    () =>
      filterAndSortProducts(FLORIDA_PRODUCTS, {
        category,
        searchKeyword,
        sort,
        minPrice,
        maxPrice: normalizedMaxPrice,
      }),
    [category, searchKeyword, sort, minPrice, normalizedMaxPrice],
  );

  const cartCount = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = toCatalogQueryString({
      category,
      searchKeyword,
      sort,
      minPrice,
      maxPrice: normalizedMaxPrice,
    });
    const nextUrl = query ? `/florida/all?${query}` : "/florida/all";
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [category, searchKeyword, sort, minPrice, normalizedMaxPrice, router]);

  const toggleWish = (id: string) => {
    const next = { ...wish, [id]: !wish[id] };
    setWishState(next);
    setWish(next);
  };

  const addCart = (id: string) => {
    const next = { ...cart, [id]: (cart[id] || 0) + 1 };
    setCartState(next);
    setCart(next);
  };

  const resetFilters = () => {
    setCategory("전체");
    setSearchKeyword("");
    setSort("recommend");
    setMinPriceInput("");
    setMaxPriceInput("");
  };

  const applyPricePreset = (preset: { min: number | null; max: number | null }) => {
    setMinPriceInput(preset.min === null ? "" : String(preset.min));
    setMaxPriceInput(preset.max === null ? "" : String(preset.max));
  };

  const hasActiveFilter =
    category !== "전체" ||
    searchKeyword.trim().length > 0 ||
    sort !== "recommend" ||
    minPrice !== null ||
    normalizedMaxPrice !== null;

  return (
    <main className="min-h-screen bg-[#eef1f4]">
      <div className="max-w-md mx-auto min-h-screen bg-[#f8fafc] pb-20">
        <div className="bg-[#ff4d67] text-white px-3 py-2 flex items-center justify-between text-sm">
          <span className="font-semibold">앱에서 더 많은 상품을 볼 수 있어요!</span>
          <Link href="/florida/welcome" className="bg-white text-[#111] rounded-full px-3 py-1 text-xs font-semibold">
            혜택 보기
          </Link>
        </div>

        <header className="px-4 py-4 border-b border-slate-100 sticky top-0 bg-white/95 z-20 backdrop-blur">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black">전체보기</h1>
            <div className="flex items-center gap-2 text-xs">
              <Link href="/florida/cart" className="px-2 py-1 rounded-full border border-slate-200 bg-slate-50">
                장바구니 {cartCount}
              </Link>
              <Link href="/florida" className="text-slate-500">
                닫기 ✕
              </Link>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-[1fr_110px] gap-2">
            <input
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
              placeholder="상품 검색"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            <select className="border border-slate-200 rounded-xl px-2 py-2 text-sm bg-white" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="recommend">추천순</option>
              <option value="price_low">낮은가격순</option>
              <option value="price_high">높은가격순</option>
              <option value="review">리뷰많은순</option>
            </select>
          </div>

          <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORY_LIST.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  category === item ? "border-[#ffd4c4] bg-[#fff5f1] text-[#FF6B35]" : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <input
              value={formatPriceInput(minPriceInput)}
              onChange={(e) => setMinPriceInput(e.target.value)}
              inputMode="numeric"
              placeholder="최소가격"
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
            />
            <input
              value={formatPriceInput(maxPriceInput)}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              inputMode="numeric"
              placeholder="최대가격"
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
            />
          </div>

          <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {[
              { label: "3만원 이하", min: null, max: 30000 },
              { label: "3~5만원", min: 30000, max: 50000 },
              { label: "5만원 이상", min: 50000, max: null },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyPricePreset(preset)}
                className="shrink-0 rounded-full border border-slate-200 bg-white text-slate-600 px-3 py-1 text-xs"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {hasActiveFilter && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              {category !== "전체" && <span className="rounded-full bg-slate-100 px-2 py-1">카테고리: {category}</span>}
              {searchKeyword.trim() && <span className="rounded-full bg-slate-100 px-2 py-1">검색: {searchKeyword.trim()}</span>}
              {sort !== "recommend" && <span className="rounded-full bg-slate-100 px-2 py-1">정렬: {SORT_LABEL[sort]}</span>}
              {minPrice !== null && <span className="rounded-full bg-slate-100 px-2 py-1">최소: {minPrice.toLocaleString("ko-KR")}원</span>}
              {normalizedMaxPrice !== null && <span className="rounded-full bg-slate-100 px-2 py-1">최대: {normalizedMaxPrice.toLocaleString("ko-KR")}원</span>}
              <button onClick={resetFilters} className="rounded-full border border-slate-300 px-2 py-1 text-slate-600">
                필터 초기화
              </button>
            </div>
          )}
        </header>

        <section className="p-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black">{category} 상품</h2>
            <p className="text-xs text-slate-400">{filtered.length}개</p>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 text-center">
              검색 결과가 없습니다.
              <br />
              검색어/가격/카테고리를 다시 선택해보세요.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  originalPrice={product.originalPrice}
                  image={imageOverrides[product.id] || product.image}
                  rating={getProductRating(product)}
                  reviewCount={product.reviews.length || 1}
                  shopName={product.badge || "플로리다 스타일"}
                  isNew={product.badge === "오늘출발" || product.badge === "재입고"}
                  colorClass={product.color}
                  wished={Boolean(wish[product.id])}
                  onToggleWish={() => toggleWish(product.id)}
                  onOpen={() => pushRecent(product.id)}
                  onAddCart={() => addCart(product.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
