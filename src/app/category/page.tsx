"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Product = { id: number; name: string; price: number; salePrice?: number; category: string; subCategory: string; colors: string[]; sizes: string[]; rating: number; reviewCount: number; sales: number };

const allProducts: Product[] = [
  { id: 1, name: "오버핏 린넨 셔츠", price: 45900, salePrice: 39900, category: "상의", subCategory: "셔츠", colors: ["화이트", "베이지"], sizes: ["S", "M", "L"], rating: 4.8, reviewCount: 234, sales: 512 },
  { id: 2, name: "와이드 데님 팬츠", price: 59900, salePrice: 49900, category: "하의", subCategory: "청바지", colors: ["블루", "블랙"], sizes: ["S", "M", "L"], rating: 4.6, reviewCount: 189, sales: 398 },
  { id: 3, name: "레더 숄더백", price: 89000, category: "가방", subCategory: "숄더백", colors: ["블랙"], sizes: ["FREE"], rating: 4.7, reviewCount: 312, sales: 456 },
];

const cats = ["전체", "상의", "하의", "가방"] as const;

export default function CategoryPage() {
  const [cat, setCat] = useState<(typeof cats)[number]>("전체");
  const [sort, setSort] = useState<"popular" | "price-low" | "price-high">("popular");

  const products = useMemo(() => {
    let r = allProducts.filter((p) => cat === "전체" || p.category === cat);
    if (sort === "popular") r = [...r].sort((a, b) => b.sales - a.sales);
    if (sort === "price-low") r = [...r].sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
    if (sort === "price-high") r = [...r].sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
    return r;
  }, [cat, sort]);

  return (
    <main className="max-w-md mx-auto p-4 pb-20">
      <h1 className="text-2xl font-black">카테고리</h1>
      <div className="mt-3 flex gap-2 overflow-x-auto">
        {cats.map((c) => <button key={c} onClick={() => setCat(c)} className={`px-3 py-1.5 rounded-full text-sm border ${cat === c ? "bg-black text-white" : "bg-white"}`}>{c}</button>)}
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span>{products.length}개 상품</span>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="border rounded-lg px-2 py-1">
          <option value="popular">인기순</option><option value="price-low">낮은가격순</option><option value="price-high">높은가격순</option>
        </select>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {products.map((p) => (
          <Link key={p.id} href={`/product/${p.id}`} className="border rounded-xl bg-white overflow-hidden">
            <div className="h-28 bg-gradient-to-br from-slate-100 to-slate-200" />
            <div className="p-2">
              <p className="text-sm font-semibold line-clamp-1">{p.name}</p>
              <p className="text-xs text-slate-500">★ {p.rating} ({p.reviewCount})</p>
              <p className="font-bold mt-1">{(p.salePrice ?? p.price).toLocaleString("ko-KR")}원</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
