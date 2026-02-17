"use client";

import Link from "next/link";

type HeaderProps = {
  cartCount: number;
};

export default function Header({ cartCount }: HeaderProps) {
  return (
    <header className="px-3 py-3 border-b bg-white sticky top-0 z-20">
      <div className="flex items-center justify-between gap-2">
        <Link href="/florida" className="text-lg font-black tracking-tight text-[#1B2D45]">
          FLORIDA <span className="text-[#FF6B35]">🌴</span>
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/florida/all" className="text-slate-600">카테고리</Link>
          <Link href="/florida/cart" className="font-semibold">장바구니 {cartCount}</Link>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-[1fr_auto] gap-2 items-center">
        <input className="bg-[#f1f3f5] rounded-xl px-4 py-2.5 text-sm" placeholder="하나만 사도 무료배송" />
        <button className="text-xs px-3 py-2 rounded-lg border">검색</button>
      </div>
    </header>
  );
}
