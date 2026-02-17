"use client";

import { useMemo, useState } from "react";
import { FLORIDA_PRODUCTS } from "@/lib/florida-products";
import { getCart, getWish, pushRecent, setCart, setWish } from "@/lib/florida-store";
import { getBannerImage, getImageOverrides } from "@/lib/florida-admin";
import ProductCard from "@/components/product/ProductCard";
import BottomNav from "@/components/layout/BottomNav";
import Header from "@/components/layout/Header";
import HeroBanner from "@/components/home/HeroBanner";
import CategoryBar from "@/components/home/CategoryBar";
import TimeDeal from "@/components/home/TimeDeal";

export default function FloridaPage() {
  const [wish, setWishState] = useState<Record<string, boolean>>(() => getWish());
  const [cart, setCartState] = useState<Record<string, number>>(() => getCart());
  const [banner] = useState(() => getBannerImage());
  const [imageOverrides] = useState<Record<string, string>>(() => getImageOverrides());

  const products = useMemo(() => FLORIDA_PRODUCTS.slice(0, 8), []);

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
      <div className="max-w-md mx-auto bg-white min-h-screen pb-24">
        <div className="bg-[#ff4d67] text-white px-3 py-2 flex items-center justify-between text-sm">
          <span className="font-semibold">앱에서 더 많은 상품을 볼 수 있어요!</span>
          <button className="bg-white text-[#111] rounded-full px-3 py-1 text-xs font-semibold">앱에서 보기</button>
        </div>

        <Header cartCount={cartCount} />
        <HeroBanner image={banner || undefined} />
        <CategoryBar />
        <TimeDeal />

        <section className="px-3 py-4">
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black tracking-tight">회원님을 위한 추천 상품</h3>
            <span className="text-slate-300 text-sm">sponsored</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {products.map((p) => {
              const rating = p.reviews.length ? p.reviews.reduce((acc, cur) => acc + cur.rating, 0) / p.reviews.length : 4.7;
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
        </section>

        <BottomNav />
      </div>
    </main>
  );
}
