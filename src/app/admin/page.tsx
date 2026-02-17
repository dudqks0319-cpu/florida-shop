"use client";

import Link from "next/link";
import { useState } from "react";

const recentOrders = [
  { id: "ORD-2026-0217-001", customer: "김**", product: "오버핏 린넨 셔츠", amount: 39900, status: "결제완료", time: "5분 전" },
  { id: "ORD-2026-0217-002", customer: "이**", product: "와이드 데님 팬츠", amount: 49900, status: "배송준비", time: "23분 전" },
  { id: "ORD-2026-0217-003", customer: "박**", product: "크롭 가디건 세트", amount: 67800, status: "배송중", time: "1시간 전" },
];

const topProducts = [
  { name: "오버핏 린넨 셔츠", sales: 156, revenue: 6224400, stock: 23 },
  { name: "와이드 데님 팬츠", sales: 134, revenue: 6686600, stock: 8 },
  { name: "레더 숄더백", sales: 87, revenue: 7743000, stock: 3 },
];

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");
  const stats = { totalSales: 2847000, orderCount: 47, visitorCount: 1283, conversionRate: 3.66 };

  return (
    <main className="max-w-6xl mx-auto p-4 pb-16">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">FLORIDA ADMIN</h1>
          <p className="text-sm text-slate-500">관리자 대시보드</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href="/admin/products" className="px-3 py-2 border rounded-lg">상품 관리</Link>
          <Link href="/admin/products/new" className="px-3 py-2 bg-[#FF6B35] text-white rounded-lg">상품 등록</Link>
        </div>
      </header>

      <section className="mt-4 flex gap-2">
        {(["today", "week", "month"] as const).map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg border text-sm ${period === p ? "bg-[#FF6B35] text-white" : "bg-white"}`}>
            {p === "today" ? "오늘" : p === "week" ? "이번 주" : "이번 달"}
          </button>
        ))}
      </section>

      <section className="grid md:grid-cols-4 gap-3 mt-4">
        <div className="p-4 border rounded-xl bg-white"><p className="text-xs text-slate-500">총 매출</p><p className="text-xl font-bold mt-1">{stats.totalSales.toLocaleString("ko-KR")}원</p></div>
        <div className="p-4 border rounded-xl bg-white"><p className="text-xs text-slate-500">주문 수</p><p className="text-xl font-bold mt-1">{stats.orderCount}건</p></div>
        <div className="p-4 border rounded-xl bg-white"><p className="text-xs text-slate-500">방문자</p><p className="text-xl font-bold mt-1">{stats.visitorCount.toLocaleString("ko-KR")}명</p></div>
        <div className="p-4 border rounded-xl bg-white"><p className="text-xs text-slate-500">전환율</p><p className="text-xl font-bold mt-1">{stats.conversionRate}%</p></div>
      </section>

      <section className="grid md:grid-cols-2 gap-3 mt-4">
        <div className="p-4 border rounded-xl bg-white">
          <h2 className="font-bold">최근 주문</h2>
          <div className="mt-2 space-y-2 text-sm">
            {recentOrders.map((o) => (
              <div key={o.id} className="p-2 border rounded-lg flex items-center justify-between">
                <div><p className="font-semibold">{o.product}</p><p className="text-xs text-slate-500">{o.id} · {o.customer} · {o.time}</p></div>
                <div className="text-right"><p className="font-semibold">{o.amount.toLocaleString("ko-KR")}원</p><p className="text-xs text-slate-500">{o.status}</p></div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border rounded-xl bg-white">
          <h2 className="font-bold">인기 상품 TOP</h2>
          <div className="mt-2 space-y-2 text-sm">
            {topProducts.map((p, i) => (
              <div key={p.name} className="p-2 border rounded-lg flex items-center justify-between">
                <div><p className="font-semibold">{i + 1}. {p.name}</p><p className="text-xs text-slate-500">{p.sales}개 판매</p></div>
                <div className="text-right"><p>{p.revenue.toLocaleString("ko-KR")}원</p><p className={`text-xs ${p.stock < 10 ? "text-red-500" : "text-slate-500"}`}>재고 {p.stock}개</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
