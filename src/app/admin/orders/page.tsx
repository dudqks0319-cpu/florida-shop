"use client";

import Link from "next/link";
import { useState } from "react";

type AdminOrder = {
  id: string;
  customer: string;
  product: string;
  amount: number;
  status: "결제완료" | "배송준비" | "배송중" | "배송완료";
  courier?: string;
  trackingNumber?: string;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([
    { id: "ORD-001", customer: "김**", product: "오버핏 린넨 셔츠", amount: 39900, status: "배송중", courier: "CJ", trackingNumber: "1234" },
    { id: "ORD-002", customer: "이**", product: "와이드 데님 팬츠", amount: 49900, status: "배송준비" },
  ]);

  const patch = (id: string, next: Partial<AdminOrder>) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...next } : o)));
  };

  return (
    <main className="max-w-4xl mx-auto p-4 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">주문 관리</h1>
        <Link href="/admin" className="text-sm text-slate-500">대시보드</Link>
      </div>

      <div className="mt-3 space-y-2">
        {orders.map((o) => (
          <section key={o.id} className="p-3 border rounded-xl bg-white text-sm">
            <p className="font-semibold">{o.product}</p>
            <p className="text-xs text-slate-500 mt-1">{o.id} · {o.customer}</p>
            <p className="mt-1">{o.amount.toLocaleString("ko-KR")}원</p>

            <div className="mt-2 grid grid-cols-3 gap-2">
              <select value={o.status} className="border rounded px-2 py-1" onChange={(e) => patch(o.id, { status: e.target.value as AdminOrder["status"] })}>
                <option>결제완료</option>
                <option>배송준비</option>
                <option>배송중</option>
                <option>배송완료</option>
              </select>
              <input defaultValue={o.courier || ""} onBlur={(e) => patch(o.id, { courier: e.target.value })} className="border rounded px-2 py-1" placeholder="택배사" />
              <input defaultValue={o.trackingNumber || ""} onBlur={(e) => patch(o.id, { trackingNumber: e.target.value })} className="border rounded px-2 py-1" placeholder="송장번호" />
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
