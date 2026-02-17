"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FLORIDA_PRODUCTS } from "@/lib/florida-products";

const QUICK_MENUS = [
  { icon: "👔", label: "남자패션" },
  { icon: "👕", label: "의류" },
  { icon: "💎", label: "주얼리" },
  { icon: "🧢", label: "패션소품" },
  { icon: "📏", label: "빅사이즈" },
  { icon: "🎟️", label: "쿠폰" },
  { icon: "👟", label: "신발" },
  { icon: "📱", label: "디지털" },
  { icon: "👜", label: "가방" },
  { icon: "💄", label: "뷰티" },
  { icon: "🏠", label: "라이프" },
  { icon: "✨", label: "추천" },
];

export default function FloridaPage() {
  const [wish, setWish] = useState<Record<string, boolean>>({});

  const products = useMemo(() => FLORIDA_PRODUCTS.slice(0, 8), []);

  const toggleWish = (id: string) => setWish((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <main className="min-h-screen bg-[#f5f6f8]">
      <div className="max-w-md mx-auto bg-white min-h-screen pb-24">
        <div className="bg-[#ff4d67] text-white px-3 py-2 flex items-center justify-between text-sm">
          <span className="font-semibold">앱에서 더 많은 상품을 볼 수 있어요!</span>
          <button className="bg-white text-[#111] rounded-full px-3 py-1 text-xs font-semibold">앱에서 보기</button>
        </div>

        <header className="px-3 py-3 border-b">
          <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
            <input className="bg-[#f1f3f5] rounded-xl px-4 py-2.5 text-sm" placeholder="하나만 사도 무료배송" />
            <button className="text-2xl">👜</button>
          </div>
        </header>

        <section className="bg-gradient-to-b from-[#4d8dff] to-[#5da8ff] text-white p-4">
          <p className="text-xs opacity-90">설 특집</p>
          <h2 className="text-4xl font-black mt-2">99특가</h2>
          <button className="mt-4 bg-white/20 rounded-full px-4 py-2 text-sm">지금 득템하기</button>
        </section>

        <section className="px-3 py-4 border-b bg-white">
          <div className="grid grid-cols-6 gap-y-4 text-center">
            {QUICK_MENUS.map((m) => (
              <button key={m.label} className="flex flex-col items-center gap-1">
                <span className="text-xl">{m.icon}</span>
                <span className="text-[11px] text-slate-700">{m.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="px-3 py-4">
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black tracking-tight">회원님을 위한 추천 상품</h3>
            <span className="text-slate-300 text-sm">sponsored</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {products.map((p) => (
              <article key={p.id} className="bg-white rounded-xl overflow-hidden">
                <Link href={`/florida/product/${p.id}`}>
                  <div className={`h-36 bg-gradient-to-br ${p.color}`} />
                </Link>
                <div className="p-2.5">
                  <p className="text-[11px] text-slate-400">{p.badge || "추천"}</p>
                  <Link href={`/florida/product/${p.id}`} className="text-sm font-semibold line-clamp-1 mt-0.5 block">{p.name}</Link>
                  <div className="mt-1">
                    <b className="text-xl leading-none">{p.price.toLocaleString("ko-KR")}</b>
                    <span className="text-sm ml-0.5">원</span>
                  </div>
                  <div className="mt-1 flex justify-between items-center">
                    <span className="text-[11px] text-slate-400">무료배송</span>
                    <button onClick={() => toggleWish(p.id)}>{wish[p.id] ? "❤️" : "🤍"}</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <nav className="fixed bottom-0 inset-x-0 border-t bg-white">
          <div className="max-w-md mx-auto grid grid-cols-4 text-center py-2 text-xs">
            <Link href="/florida" className="text-pink-500 font-semibold">홈</Link>
            <Link href="/florida/all">전체보기</Link>
            <Link href="/florida" className="">검색</Link>
            <Link href="/login">마이페이지</Link>
          </div>
        </nav>
      </div>
    </main>
  );
}
