"use client";

import Link from "next/link";

const orders = [
  { id: "ORD-2026-0215-001", product: "오버핏 린넨 셔츠", option: "화이트 / M", price: 39900, status: "배송중", date: "2026.02.15" },
  { id: "ORD-2026-0212-003", product: "와이드 데님 팬츠", option: "블루 / L", price: 49900, status: "배송완료", date: "2026.02.12" },
];

export default function MyOrdersPage() {
  return (
    <main className="max-w-md mx-auto p-4 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">주문내역</h1>
        <Link href="/mypage" className="text-sm text-slate-500">마이페이지</Link>
      </div>

      <div className="mt-3 space-y-2">
        {orders.map((o) => (
          <section key={o.id} className="card text-sm">
            <p className="font-semibold">{o.product}</p>
            <p className="text-slate-500 mt-1">{o.option}</p>
            <p className="mt-1">{o.price.toLocaleString("ko-KR")}원</p>
            <div className="mt-2 flex justify-between text-xs text-slate-500"><span>{o.id}</span><span>{o.status} · {o.date}</span></div>
          </section>
        ))}
      </div>
    </main>
  );
}
