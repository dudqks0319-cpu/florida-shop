"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Product = { id: number; name: string; category: string; price: number; salePrice: number | null; stock: number; status: "판매중" | "품절" | "숨김"; createdAt: string };

const products: Product[] = [
  { id: 1, name: "오버핏 린넨 셔츠", category: "상의", price: 45900, salePrice: 39900, stock: 23, status: "판매중", createdAt: "2026-02-15" },
  { id: 2, name: "와이드 데님 팬츠", category: "하의", price: 59900, salePrice: 49900, stock: 8, status: "판매중", createdAt: "2026-02-14" },
  { id: 3, name: "레더 숄더백", category: "가방", price: 89000, salePrice: null, stock: 0, status: "품절", createdAt: "2026-02-13" },
  { id: 4, name: "울 블렌드 코트", category: "아우터", price: 189000, salePrice: 159000, stock: 12, status: "숨김", createdAt: "2026-02-12" },
];

export default function AdminProductsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | Product["status"]>("all");

  const filtered = useMemo(() => products.filter((p) => (status === "all" || p.status === status) && (p.name.includes(q) || p.category.includes(q))), [q, status]);

  return (
    <main className="max-w-6xl mx-auto p-4 pb-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">상품 관리</h1>
        <div className="flex gap-2"><Link href="/admin" className="px-3 py-2 border rounded-lg">대시보드</Link><Link href="/admin/products/new" className="px-3 py-2 bg-[#FF6B35] text-white rounded-lg">상품 등록</Link></div>
      </div>

      <div className="mt-4 grid md:grid-cols-[1fr_auto] gap-2">
        <input value={q} onChange={(e)=>setQ(e.target.value)} className="border rounded-lg px-3 py-2" placeholder="상품명/카테고리 검색" />
        <div className="flex gap-2">
          {(["all", "판매중", "품절", "숨김"] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`px-3 py-2 rounded-lg text-sm border ${status === s ? "bg-[#FF6B35] text-white" : "bg-white"}`}>{s === "all" ? "전체" : s}</button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto border rounded-xl bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50"><tr className="text-left"><th className="p-3">상품</th><th>카테고리</th><th>가격</th><th>재고</th><th>상태</th><th>등록일</th></tr></thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3 font-semibold">{p.name}</td>
                <td>{p.category}</td>
                <td>{(p.salePrice ?? p.price).toLocaleString("ko-KR")}원</td>
                <td>{p.stock}개</td>
                <td>{p.status}</td>
                <td>{p.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
