"use client";

import { useState } from "react";

type OrderItem = { name: string; option: string; price: number; qty: number; status: string };
type Order = { id: string; date: string; items: OrderItem[]; totalPrice: number; payment: string };

export default function OrdersPage() {
  const [filterStatus, setFilterStatus] = useState("전체");

  const orders: Order[] = [
    {
      id: "ORD-2026-0215-001",
      date: "2026.02.15",
      items: [{ name: "오버핏 린넨 셔츠", option: "화이트 / M", price: 39900, qty: 1, status: "배송중" }],
      totalPrice: 39900,
      payment: "카카오페이",
    },
    {
      id: "ORD-2026-0212-003",
      date: "2026.02.12",
      items: [
        { name: "와이드 데님 팬츠", option: "블루 / L", price: 49900, qty: 1, status: "배송완료" },
        { name: "스트라이프 블라우스", option: "화이트 / M", price: 35700, qty: 1, status: "배송완료" },
      ],
      totalPrice: 85600,
      payment: "네이버페이",
    },
    {
      id: "ORD-2026-0210-005",
      date: "2026.02.10",
      items: [{ name: "레더 숄더백", option: "블랙 / FREE", price: 79000, qty: 1, status: "배송완료" }],
      totalPrice: 79000,
      payment: "토스페이",
    },
  ];

  const statuses = ["전체", "결제완료", "배송준비", "배송중", "배송완료", "교환/환불"];
  const statusColor: Record<string, string> = {
    결제완료: "text-blue-600",
    배송준비: "text-yellow-600",
    배송중: "text-green-600",
    배송완료: "text-gray-500",
    "교환/환불": "text-red-500",
  };

  const formatPrice = (n: number) => n.toLocaleString("ko-KR") + "원";
  const filteredOrders = filterStatus === "전체" ? orders : orders.filter((o) => o.items.some((item) => item.status === filterStatus));

  return (
    <main className="max-w-md mx-auto p-4 pb-20">
      <h1 className="text-2xl font-black">주문내역</h1>

      <div className="mt-3 flex gap-2 overflow-x-auto">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition ${
              filterStatus === s ? "bg-gray-900 text-white font-semibold" : "bg-gray-100 text-gray-500"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        {filteredOrders.map((order) => (
          <section key={order.id} className="card text-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">{order.date}</p>
              <p className="text-xs text-slate-500">{order.id}</p>
            </div>

            <div className="mt-2 space-y-2">
              {order.items.map((item, idx) => (
                <div key={`${item.name}-${idx}`} className="p-2 border rounded-lg bg-white">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.option} · {item.qty}개</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="font-semibold">{formatPrice(item.price)}</p>
                    <p className={`text-xs ${statusColor[item.status] || "text-slate-500"}`}>{item.status}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-2 text-xs text-slate-500">결제: {order.payment}</div>
            <div className="mt-1 text-sm font-semibold">총 {formatPrice(order.totalPrice)}</div>
          </section>
        ))}

        {filteredOrders.length === 0 && <p className="text-sm text-slate-500">해당 상태의 주문이 없습니다</p>}
      </div>
    </main>
  );
}
