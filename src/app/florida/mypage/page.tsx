"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FLORIDA_PRODUCTS } from "@/lib/florida-products";
import { getOrders, getRecent, getWish } from "@/lib/florida-store";

export default function FloridaMypage() {
  const [orders] = useState(() => getOrders());
  const [recentIds] = useState<string[]>(() => getRecent());
  const [wishMap] = useState<Record<string, boolean>>(() => getWish());

  const recentProducts = useMemo(
    () => recentIds.map((id) => FLORIDA_PRODUCTS.find((p) => p.id === id)).filter(Boolean),
    [recentIds],
  );

  const wishProducts = useMemo(() => FLORIDA_PRODUCTS.filter((p) => wishMap[p.id]), [wishMap]);

  return (
    <main className="max-w-md mx-auto p-4 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">마이페이지</h1>
        <Link href="/florida" className="text-sm text-slate-500">홈으로</Link>
      </div>

      <section className="mt-4 p-4 rounded-2xl border bg-white">
        <h2 className="font-bold">주문내역 ({orders.length})</h2>
        <div className="mt-2 space-y-2">
          {orders.length === 0 && <p className="text-sm text-slate-500">아직 주문내역이 없습니다.</p>}
          {orders.map((o) => (
            <div key={o.id} className="rounded-lg bg-slate-50 p-3">
              <p className="font-semibold text-sm">{o.productName}</p>
              <p className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleString("ko-KR")} · {o.status}</p>
              <p className="text-sm mt-1">{o.amount.toLocaleString("ko-KR")}원 / {o.method}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 p-4 rounded-2xl border bg-white">
        <h2 className="font-bold">최근 본 상품 ({recentProducts.length})</h2>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {recentProducts.map((p) => (
            <Link key={p!.id} href={`/florida/product/${p!.id}`} className="text-center">
              {p!.image ? <img src={p!.image} alt={p!.name} className="h-20 w-full object-cover rounded-lg" /> : <div className="h-20 rounded-lg bg-slate-100" />}
              <p className="text-[11px] mt-1 line-clamp-1">{p!.name}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-4 p-4 rounded-2xl border bg-white">
        <h2 className="font-bold">찜한 상품 ({wishProducts.length})</h2>
        <div className="mt-2 space-y-2">
          {wishProducts.length === 0 && <p className="text-sm text-slate-500">찜한 상품이 없습니다.</p>}
          {wishProducts.map((p) => (
            <Link key={p.id} href={`/florida/product/${p.id}`} className="block rounded-lg bg-slate-50 p-3">
              <p className="font-semibold text-sm">{p.name}</p>
              <p className="text-xs text-slate-500 mt-1">{p.price.toLocaleString("ko-KR")}원</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
