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
      <header className="px-3 pt-3 pb-3 border-b border-slate-100 bg-white/95 sticky top-0 z-30 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <Link href="/florida" className="text-lg font-black tracking-tight text-[#1B2D45]">
            FLORIDA <span className="text-[#FF6B35]">🌴</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Link href="/florida/all" className="hover:text-[#FF6B35]">카테고리</Link>
            <Link href="/florida/virtual-tryon" className="text-[#FF6B35] font-semibold">가상피팅</Link>
            <Link href="/florida/cart" className="rounded-full border border-slate-200 px-2 py-1 font-semibold bg-slate-50">
              장바구니 {cartCount}
            </Link>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-[1fr_auto] gap-2 items-center">
          <button
            onClick={() => setShowSearch(true)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-left text-slate-500"
          >
            🔍 하나만 사도 무료배송
          </button>
          <button onClick={() => setShowSearch(true)} className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold">
            검색
          </button>
        </div>
      </header>

      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
}
