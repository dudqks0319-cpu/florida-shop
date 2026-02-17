"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FLORIDA_PRODUCTS, type FloridaCategory } from "@/lib/florida-products";

const CATEGORIES: FloridaCategory[] = ["전체", "구제", "영캐주얼", "잡화", "모자"];
const TOP_TABS = ["투데이", "랭킹", "신상", "세일", "브랜드"];

export default function FloridaPage() {
  const [activeTopTab, setActiveTopTab] = useState("투데이");
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
    <main className="min-h-screen bg-white pb-24">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white">
        <div className="max-w-md mx-auto px-4 pt-3 pb-2">
          <div className="flex items-center justify-between">
            <h1 className="text-[22px] font-black tracking-tight">FLORIDA</h1>
            <button className="text-sm text-slate-500">🔔</button>
          </div>
          <div className="mt-2">
            <input
              className="w-full rounded-full bg-slate-100 px-4 py-2.5 text-sm outline-none"
              placeholder="브랜드/상품/코디 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="mt-3 flex gap-4 overflow-x-auto whitespace-nowrap text-sm">
            {TOP_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTopTab(tab)}
                className={`pb-2 border-b-2 ${activeTopTab === tab ? "border-black font-bold text-black" : "border-transparent text-slate-400"}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="max-w-md mx-auto px-4 mt-3">
        <div className="rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white p-4">
          <p className="text-xs opacity-80">{activeTopTab} PICK</p>
          <h2 className="mt-1 text-2xl font-extrabold">플로리다 주간 코디 특가</h2>
          <p className="mt-1 text-sm opacity-90">구제 + 영캐주얼 최대 40% 할인</p>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-3 py-1.5 rounded-full text-sm border whitespace-nowrap ${
                activeCategory === c ? "bg-black text-white border-black" : "bg-white text-slate-700 border-slate-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-md mx-auto px-4 mt-4 grid grid-cols-2 gap-3">
        {products.map((p) => (
          <article key={p.id} className="rounded-2xl overflow-hidden bg-white">
            <Link href={`/florida/product/${p.id}`}>
              <div className={`h-48 bg-gradient-to-br ${p.color}`} />
            </Link>
            <div className="py-2">
              <p className="text-[11px] text-slate-400">{p.badge || "추천"}</p>
              <Link href={`/florida/product/${p.id}`} className="block mt-0.5 text-[15px] font-semibold leading-tight">
                {p.name}
              </Link>
              <div className="mt-1 flex items-center gap-1">
                {p.discountRate ? <span className="text-rose-500 font-bold text-sm">{p.discountRate}%</span> : null}
                <b className="text-[20px] leading-none">{p.price.toLocaleString("ko-KR")}</b>
                <span className="text-sm">원</span>
              </div>
              {p.originalPrice ? <p className="text-xs text-slate-400 line-through">{p.originalPrice.toLocaleString("ko-KR")}원</p> : null}

              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">무료배송</span>
                <button onClick={() => toggleWish(p.id)} className="text-lg leading-none">
                  {wish[p.id] ? "❤️" : "🤍"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <nav className="fixed bottom-0 inset-x-0 border-t border-slate-200 bg-white">
        <div className="max-w-md mx-auto grid grid-cols-5 text-center text-[11px] py-2">
          <Link href="/florida" className="font-semibold">홈</Link>
          <button>카테고리</button>
          <button>피드</button>
          <Link href="/login">마이</Link>
          <button>찜</button>
        </div>
      </nav>
    </main>
  );
}
