"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FLORIDA_PRODUCTS, type FloridaCategory } from "@/lib/florida-products";

const CATEGORIES: FloridaCategory[] = ["전체", "구제", "영캐주얼", "잡화", "모자"];

export default function FloridaPage() {
  const [activeCategory, setActiveCategory] = useState<FloridaCategory>("전체");
  const [keyword, setKeyword] = useState("");
  const [wish, setWish] = useState<Record<string, boolean>>({});

  const products = useMemo(() => {
    return FLORIDA_PRODUCTS.filter((p) => {
      const byCategory = activeCategory === "전체" || p.category === activeCategory;
      const k = keyword.trim().toLowerCase();
      const byKeyword = !k || p.name.toLowerCase().includes(k) || p.desc.toLowerCase().includes(k);
      return byCategory && byKeyword;
    });
  }, [activeCategory, keyword]);

  const toggleWish = (id: string) => setWish((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black tracking-tight">플로리다</h1>
            <div className="text-xs text-slate-500">에이블리 감성 쇼핑</div>
          </div>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm"
            placeholder="오늘 뭐 입지? 상품 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap border ${
                  activeCategory === c
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 mt-4">
        <div className="rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 text-white p-5">
          <p className="text-xs opacity-90">NEW DROP</p>
          <h2 className="text-2xl font-extrabold mt-1">영캐주얼 주간 특가</h2>
          <p className="mt-1 text-sm opacity-90">최대 40% · 오늘출발 아이템 모음</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {products.map((p) => (
          <article key={p.id} className="rounded-2xl overflow-hidden bg-white border border-slate-200">
            <Link href={`/florida/product/${p.id}`}>
              <div className={`h-40 bg-gradient-to-br ${p.color}`} />
            </Link>
            <div className="p-3">
              <p className="text-[11px] text-blue-600 font-semibold">{p.category}</p>
              <Link href={`/florida/product/${p.id}`} className="block mt-1 font-semibold leading-snug line-clamp-2">{p.name}</Link>
              <div className="mt-1 flex items-center gap-1">
                {p.discountRate && <span className="text-rose-500 text-sm font-bold">{p.discountRate}%</span>}
                <b className="text-lg">{p.price.toLocaleString("ko-KR")}원</b>
              </div>
              {p.originalPrice && <p className="text-xs line-through text-slate-400">{p.originalPrice.toLocaleString("ko-KR")}원</p>}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">{p.badge || "기획전"}</span>
                <button onClick={() => toggleWish(p.id)} className="text-lg">
                  {wish[p.id] ? "❤️" : "🤍"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-2 grid grid-cols-4 text-center text-xs">
          <Link href="/florida" className="py-2 font-semibold">홈</Link>
          <Link href="/florida" className="py-2">카테고리</Link>
          <Link href="/login" className="py-2">마이</Link>
          <Link href="/florida" className="py-2">찜</Link>
        </div>
      </nav>
    </main>
  );
}
