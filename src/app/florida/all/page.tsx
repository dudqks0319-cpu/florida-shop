"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import { FLORIDA_PRODUCTS, type FloridaCategory } from "@/lib/florida-products";
import { getCart, getWish, pushRecent, setCart, setWish } from "@/lib/florida-store";
import { getImageOverrides } from "@/lib/florida-admin";

type SortKey = "recommend" | "price_low" | "price_high" | "review";

const CATEGORY_LIST: FloridaCategory[] = ["전체", "구제", "영캐주얼", "잡화", "모자"];

function getInitialQuery(name: string) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(name) || "";
}

function getRating(product: (typeof FLORIDA_PRODUCTS)[number]) {
  return product.reviews.length ? product.reviews.reduce((acc, cur) => acc + cur.rating, 0) / product.reviews.length : 4.7;
}

function getRecommendScore(product: (typeof FLORIDA_PRODUCTS)[number]) {
  const badgeWeight = product.badge === "오늘출발" ? 5 : product.badge === "인기" ? 4 : product.badge === "재입고" ? 3 : 1;
  return badgeWeight * 10 + product.reviews.length * 2 + (product.discountRate || 0);
}

export default function FloridaAllPage() {
  const [category, setCategory] = useState<FloridaCategory>(() => {
    const v = getInitialQuery("category");
    return CATEGORY_LIST.includes(v as FloridaCategory) ? (v as FloridaCategory) : "전체";
  });
  const [searchKeyword, setSearchKeyword] = useState(() => getInitialQuery("search"));
  const [sort, setSort] = useState<SortKey>(() => {
    const v = getInitialQuery("sort");
    return ["recommend", "price_low", "price_high", "review"].includes(v) ? (v as SortKey) : "recommend";
  });

  const [wish, setWishState] = useState<Record<string, boolean>>(() => getWish());
  const [cart, setCartState] = useState<Record<string, number>>(() => getCart());
  const [imageOverrides] = useState<Record<string, string>>(() => getImageOverrides());

  const filtered = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    const list = FLORIDA_PRODUCTS.filter((p) => {
      const byCategory = category === "전체" || p.category === category;
      const byKeyword = !keyword || p.name.toLowerCase().includes(keyword) || p.desc.toLowerCase().includes(keyword);
      return byCategory && byKeyword;
    });

    if (sort === "price_low") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "price_high") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "review") return [...list].sort((a, b) => b.reviews.length - a.reviews.length);

    return [...list].sort((a, b) => getRecommendScore(b) - getRecommendScore(a));
  }, [category, searchKeyword, sort]);

  const cartCount = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);

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

  return (
    <main className="min-h-screen bg-[#f5f6f8]">
      <div className="max-w-md mx-auto min-h-screen bg-white pb-16">
        <div className="bg-[#ff4d67] text-white px-3 py-2 flex items-center justify-between text-sm">
          <span className="font-semibold">앱에서 더 많은 상품을 볼 수 있어요!</span>
          <Link href="/florida/welcome" className="bg-white text-[#111] rounded-full px-3 py-1 text-xs font-semibold">혜택 보기</Link>
        </div>

        <header className="px-4 py-4 border-b sticky top-0 bg-white z-20">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black">전체보기</h1>
            <div className="flex items-center gap-2 text-xs">
              <Link href="/florida/cart" className="px-2 py-1 rounded border">장바구니 {cartCount}</Link>
              <Link href="/florida" className="text-slate-500">닫기 ✕</Link>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-[1fr_110px] gap-2">
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="상품 검색"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            <select className="border rounded-lg px-2 py-2 text-sm" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="recommend">추천순</option>
              <option value="price_low">낮은가격순</option>
              <option value="price_high">높은가격순</option>
              <option value="review">리뷰많은순</option>
            </select>
          </div>
        </header>

        <section className="grid grid-cols-[96px_1fr] min-h-[calc(100vh-140px)]">
          <aside className="border-r bg-[#f8f9fb]">
            {CATEGORY_LIST.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`w-full px-3 py-3 text-sm border-b text-left ${category === item ? "bg-white font-semibold text-[#FF6B35]" : "text-slate-600"}`}
              >
                {item}
              </button>
            ))}
          </aside>

          <div className="p-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">{category}</h2>
              <p className="text-xs text-slate-400">{filtered.length}개</p>
            </div>

            {filtered.length === 0 ? (
              <div className="mt-6 rounded-lg border bg-slate-50 p-4 text-sm text-slate-500 text-center">
                검색 결과가 없습니다.
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {filtered.map((p) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    price={p.price}
                    originalPrice={p.originalPrice}
                    image={imageOverrides[p.id] || p.image}
                    rating={getRating(p)}
                    reviewCount={p.reviews.length || 1}
                    shopName={p.badge || "플로리다 스타일"}
                    isNew={p.badge === "오늘출발" || p.badge === "재입고"}
                    colorClass={p.color}
                    wished={Boolean(wish[p.id])}
                    onToggleWish={() => toggleWish(p.id)}
                    onOpen={() => pushRecent(p.id)}
                    onAddCart={() => addCart(p.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
