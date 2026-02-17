"use client";

import Link from "next/link";
import { useState } from "react";

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [wish, setWish] = useState(false);
  const price = 39900;

  return (
    <main className="max-w-md mx-auto pb-24">
      <header className="sticky top-0 bg-white border-b p-3 flex justify-between">
        <Link href="/category">←</Link>
        <p className="text-sm">상품상세 #{params.id}</p>
        <button>공유</button>
      </header>

      <section className="h-72 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">상품 이미지</section>

      <section className="p-4 bg-white border-b">
        <p className="text-xs text-slate-500">FLORIDA</p>
        <h1 className="font-bold text-xl mt-1">오버핏 린넨 셔츠</h1>
        <p className="text-sm text-slate-500 mt-1">★ 4.8 (234개 리뷰) · 512개 구매</p>
        <p className="mt-2"><span className="text-rose-500 font-bold">13%</span> <b className="text-2xl">39,900원</b></p>
      </section>

      <section className="p-4 bg-white border-b space-y-3">
        <div><p className="text-sm font-semibold">컬러</p><div className="mt-1 flex gap-2">{["화이트","베이지","블루"].map((c)=><button key={c} onClick={()=>setColor(c)} className={`px-3 py-1 border rounded ${color===c?"border-[#FF6B35] text-[#FF6B35]":""}`}>{c}</button>)}</div></div>
        <div><p className="text-sm font-semibold">사이즈</p><div className="mt-1 flex gap-2">{["S","M","L","XL"].map((s)=><button key={s} onClick={()=>setSize(s)} className={`px-3 py-1 border rounded ${size===s?"border-[#FF6B35] text-[#FF6B35]":""}`}>{s}</button>)}</div></div>
        <div className="flex items-center gap-2"><button onClick={()=>setQty(Math.max(1,qty-1))} className="border rounded px-2">-</button><span>{qty}</span><button onClick={()=>setQty(qty+1)} className="border rounded px-2">+</button><span className="ml-auto font-bold">{(price*qty).toLocaleString("ko-KR")}원</span></div>
      </section>

      <section className="p-4 bg-white">
        <h2 className="font-semibold">상세정보</h2>
        <p className="text-sm text-slate-600 mt-2">가벼운 린넨 소재로 여름에도 시원하게 입을 수 있는 오버핏 셔츠입니다.</p>
      </section>

      <nav className="fixed bottom-0 inset-x-0 border-t bg-white p-2">
        <div className="max-w-md mx-auto grid grid-cols-[auto_1fr_1fr] gap-2">
          <button onClick={()=>setWish(v=>!v)} className="border rounded-xl px-3">{wish?"♥":"♡"}</button>
          <button onClick={()=>alert(`장바구니: ${color}/${size}/${qty}`)} className="border border-[#FF6B35] text-[#FF6B35] rounded-xl">장바구니</button>
          <button onClick={()=>alert("구매 진행") } className="bg-[#FF6B35] text-white rounded-xl">바로구매</button>
        </div>
      </nav>
    </main>
  );
}
