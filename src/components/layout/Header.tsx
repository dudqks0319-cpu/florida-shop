"use client";

import Link from "next/link";
import { useState } from "react";
import SearchModal from "@/components/common/SearchModal";

type HeaderProps = {
  cartCount: number;
};

export default function Header({ cartCount }: HeaderProps) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <>
    <header className="px-3 py-3 border-b bg-white sticky top-0 z-20">
      <div className="flex items-center justify-between gap-2">
        <Link href="/florida" className="text-lg font-black tracking-tight text-[#1B2D45]">
          FLORIDA <span className="text-[#FF6B35]">🌴</span>
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/florida/all" className="text-slate-600">카테고리</Link>
          <Link href="/florida/virtual-tryon" className="text-[#FF6B35] font-semibold">가상피팅</Link>
          <Link href="/florida/cart" className="font-semibold">장바구니 {cartCount}</Link>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-[1fr_auto] gap-2 items-center">
        <button onClick={() => setShowSearch(true)} className="bg-[#f1f3f5] rounded-xl px-4 py-2.5 text-sm text-left text-slate-500">하나만 사도 무료배송</button>
        <button onClick={() => setShowSearch(true)} className="text-xs px-3 py-2 rounded-lg border">검색</button>
      </div>
    </header>
    <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
}
