"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getOrders, updateOrderAdmin, type FloridaOrder } from "@/lib/florida-store";

type Me = { user: { role: "requester" | "helper" | "admin" } | null };

export default function FloridaAdminOrdersPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<FloridaOrder[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me");
      const json = (await res.json()) as Me;
      const ok = Boolean(json.user && json.user.role === "admin");
      setAuthorized(ok);
      if (ok) setOrders(getOrders());
    })();
  }, []);

  const savePatch = (id: string, patch: Partial<FloridaOrder>) => {
    setOrders(updateOrderAdmin(id, patch));
  };

  if (authorized === null) return <main className="max-w-3xl mx-auto p-4">권한 확인 중...</main>;
  if (!authorized) return <main className="max-w-3xl mx-auto p-4">관리자 권한이 필요합니다.</main>;

  return (
    <main className="max-w-3xl mx-auto p-4 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">주문 관리</h1>
        <div className="flex gap-2 text-sm">
          <Link href="/florida/admin" className="text-slate-500">이미지관리</Link>
          <Link href="/florida/mypage" className="text-slate-500">마이페이지</Link>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {orders.length === 0 && <p className="text-sm text-slate-500">주문 데이터가 없습니다.</p>}
        {orders.map((o) => (
          <section key={o.id} className="p-4 rounded-xl border bg-white">
            <p className="font-semibold">{o.productName}</p>
            <p className="text-xs text-slate-500 mt-0.5">{o.id} · {new Date(o.createdAt).toLocaleString("ko-KR")}</p>
            <p className="text-sm mt-1">{o.amount.toLocaleString("ko-KR")}원 / {o.method} / {o.status}</p>

            <div className="mt-2 grid sm:grid-cols-3 gap-2">
              <select className="border rounded px-2 py-1 text-sm" value={o.status} onChange={(e) => savePatch(o.id, { status: e.target.value as FloridaOrder["status"] })}>
                <option value="결제대기">결제대기</option>
                <option value="주문완료">주문완료</option>
                <option value="배송준비">배송준비</option>
                <option value="배송중">배송중</option>
                <option value="배송완료">배송완료</option>
              </select>
              <input className="border rounded px-2 py-1 text-sm" placeholder="택배사" defaultValue={o.courier || ""} onBlur={(e) => savePatch(o.id, { courier: e.target.value })} />
              <input className="border rounded px-2 py-1 text-sm" placeholder="송장번호" defaultValue={o.trackingNumber || ""} onBlur={(e) => savePatch(o.id, { trackingNumber: e.target.value })} />
            </div>
            <input className="mt-2 w-full border rounded px-2 py-1 text-sm" placeholder="배송조회 URL" defaultValue={o.trackingUrl || ""} onBlur={(e) => savePatch(o.id, { trackingUrl: e.target.value })} />

            {o.claimType && (
              <div className="mt-3 p-2 rounded bg-amber-50 border text-sm">
                <p>클레임: {o.claimType} / {o.claimStatus || "요청접수"}</p>
                <p className="text-xs text-slate-600">사유: {o.claimReason}</p>
                <div className="mt-2 flex gap-2">
                  <button className="border rounded px-2 py-1" onClick={() => savePatch(o.id, { claimStatus: "처리중" })}>처리중</button>
                  <button className="border rounded px-2 py-1" onClick={() => savePatch(o.id, { claimStatus: "완료" })}>완료</button>
                  <button className="border rounded px-2 py-1" onClick={() => savePatch(o.id, { claimStatus: "반려" })}>반려</button>
                </div>
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
