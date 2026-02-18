"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FLORIDA_PRODUCTS, type FloridaCategory } from "@/lib/florida-products";
import { getCart, getWish, pushRecent, setCart, setWish } from "@/lib/florida-store";
import { getBannerImage, getImageOverrides } from "@/lib/florida-admin";
import ProductCard from "@/components/product/ProductCard";
import BottomNav from "@/components/layout/BottomNav";
import Header from "@/components/layout/Header";
import HeroBanner from "@/components/home/HeroBanner";
import CategoryBar from "@/components/home/CategoryBar";
import TimeDeal from "@/components/home/TimeDeal";

type SortKey = "recommend" | "price_low" | "price_high" | "review";

function getRating(product: (typeof FLORIDA_PRODUCTS)[number]) {
  return product.reviews.length ? product.reviews.reduce((acc, cur) => acc + cur.rating, 0) / product.reviews.length : 4.7;
}

function getRecommendScore(product: (typeof FLORIDA_PRODUCTS)[number]) {
  const badgeWeight = product.badge === "오늘출발" ? 5 : product.badge === "인기" ? 4 : product.badge === "재입고" ? 3 : 1;
  const reviewWeight = product.reviews.length;
  const discountWeight = product.discountRate || 0;
  return badgeWeight * 10 + reviewWeight * 2 + discountWeight;
}

export default function FloridaPage() {
  const [wish, setWishState] = useState<Record<string, boolean>>(() => getWish());
  const [cart, setCartState] = useState<Record<string, number>>(() => getCart());
  const [banner] = useState(() => getBannerImage());
  const [imageOverrides] = useState<Record<string, string>>(() => getImageOverrides());
  const [category, setCategory] = useState<FloridaCategory>("전체");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sort, setSort] = useState<SortKey>("recommend");

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

  const filteredProducts = useMemo(() => {
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

  const topPicks = useMemo(() => [...FLORIDA_PRODUCTS].sort((a, b) => getRecommendScore(b) - getRecommendScore(a)).slice(0, 3), []);

  const applyTimeDealFilter = () => {
    setCategory("영캐주얼");
    setSort("price_low");
    setSearchKeyword("");
  };

  return (
    <main className="min-h-screen bg-[#eef1f4]">
      <div className="max-w-md mx-auto bg-[#f8fafc] min-h-screen pb-24 shadow-[0_0_0_1px_rgba(0,0,0,0.02)]">
        <div className="bg-[#ff4d67] text-white px-3 py-2 flex items-center justify-between text-sm">
          <span className="font-semibold">앱에서 더 많은 상품과 쿠폰을 볼 수 있어요!</span>
          <Link href="/florida/welcome" className="bg-white text-[#111] rounded-full px-3 py-1 text-xs font-semibold">
            앱 혜택 보기
          </Link>
        </div>

        <Header cartCount={cartCount} />
        <HeroBanner image={banner || undefined} />
        <CategoryBar selected={category} onSelect={setCategory} />
        <TimeDeal onAction={applyTimeDealFilter} />

        <section className="px-3 py-3 border-b border-slate-100 bg-white">
          <div className="rounded-2xl border border-slate-200 p-2 bg-slate-50">
            <div className="grid grid-cols-[1fr_110px] gap-2">
              <input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="상품명/설명 검색"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm">
                <option value="recommend">추천순</option>
                <option value="price_low">낮은가격순</option>
                <option value="price_high">높은가격순</option>
                <option value="review">리뷰많은순</option>
              </select>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {["전체", "구제", "영캐주얼", "잡화", "모자"].map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c as FloridaCategory)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    category === c ? "border-[#ffd4c4] text-[#FF6B35] bg-[#fff6f3]" : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="px-3 py-4 border-b border-slate-100 bg-white">
          <div className="rounded-2xl border border-slate-200 p-3 bg-slate-50">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold">오늘의 추천 TOP 3</h3>
              <Link href="/florida/all" className="text-xs text-slate-500">전체보기</Link>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {topPicks.map((p) => (
                <Link key={p.id} href={`/florida/product/${p.id}`} onClick={() => pushRecent(p.id)} className="rounded-lg border border-slate-200 p-2 bg-white">
                  <p className="text-[11px] font-semibold line-clamp-2 min-h-[30px]">{p.name}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{p.price.toLocaleString("ko-KR")}원</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-3 py-4">
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black tracking-tight">실시간 상품 목록</h3>
            <span className="text-slate-400 text-sm">{filteredProducts.length}개</span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              조건에 맞는 상품이 없습니다. 카테고리/검색어를 바꿔보세요.
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {filteredProducts.map((p) => {
                const rating = getRating(p);
                return (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    price={p.price}
                    originalPrice={p.originalPrice}
                    image={imageOverrides[p.id] || p.image}
                    rating={rating}
                    reviewCount={p.reviews.length || 1}
                    shopName={p.badge || "플로리다 스타일"}
                    isNew={p.badge === "오늘출발" || p.badge === "재입고"}
                    colorClass={p.color}
                    wished={Boolean(wish[p.id])}
                    onToggleWish={() => toggleWish(p.id)}
                    onOpen={() => pushRecent(p.id)}
                    onAddCart={() => addCart(p.id)}
                  />
                );
              })}
            </div>
          )}
        </section>

        <BottomNav />
      </div>
    </main>
  );
}
