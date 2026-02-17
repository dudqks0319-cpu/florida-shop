"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FLORIDA_PRODUCTS } from "@/lib/florida-products";
import { getCart, updateCartQty } from "@/lib/florida-store";

export default function FloridaCartPage() {
  const [cart, setCart] = useState<Record<string, number>>(() => getCart());

  const items = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const p = FLORIDA_PRODUCTS.find((x) => x.id === id);
          if (!p) return null;
          return { product: p, qty };
        })
        .filter(Boolean) as { product: (typeof FLORIDA_PRODUCTS)[number]; qty: number }[],
    [cart],
  );

  const total = useMemo(() => items.reduce((sum, item) => sum + item.product.price * item.qty, 0), [items]);

  const changeQty = (id: string, qty: number) => {
    const next = updateCartQty(id, qty);
    setCart(next);
  };

  return (
    <main className="max-w-md mx-auto p-4 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">장바구니</h1>
        <Link href="/florida" className="text-sm text-slate-500">홈으로</Link>
      </div>

      <div className="mt-4 space-y-2">
        {items.length === 0 && <p className="text-sm text-slate-500">장바구니가 비어 있습니다.</p>}
        {items.map(({ product, qty }) => (
          <div key={product.id} className="p-3 rounded-xl border bg-white">
            <div className="flex items-center gap-3">
              {product.image ? <img src={product.image} alt={product.name} className="w-16 h-16 rounded object-cover" /> : <div className="w-16 h-16 rounded bg-slate-100" />}
              <div className="flex-1">
                <p className="font-semibold text-sm">{product.name}</p>
                <p className="text-xs text-slate-500">{product.price.toLocaleString("ko-KR")}원</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button className="border rounded px-2" onClick={() => changeQty(product.id, qty - 1)}>-</button>
              <span>{qty}</span>
              <button className="border rounded px-2" onClick={() => changeQty(product.id, qty + 1)}>+</button>
              <button className="ml-auto text-xs text-rose-500" onClick={() => changeQty(product.id, 0)}>삭제</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 rounded-xl border bg-slate-50">
        <p className="font-semibold">총 결제예상금액: {total.toLocaleString("ko-KR")}원</p>
      </div>
    </main>
  );
}
