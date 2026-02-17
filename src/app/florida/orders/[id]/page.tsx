"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import { getOrders, requestOrderClaim } from "@/lib/florida-store";

export default function FloridaOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [orders, setOrders] = useState(() => getOrders());
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState("");

  const order = orders.find((o) => o.id === id);
  if (!order) return notFound();

  const claim = (type: "refund" | "exchange") => {
    if (!reason.trim()) {
      setNotice("사유를 입력해주세요.");
      return;
    }
    setOrders(requestOrderClaim(order.id, type, reason.trim()));
    setNotice(type === "refund" ? "환불 요청이 접수되었습니다." : "교환 요청이 접수되었습니다.");
  };

  return (
    <main className="max-w-md mx-auto p-4 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">주문 상세</h1>
        <Link href="/florida/mypage" className="text-sm text-slate-500">마이페이지</Link>
      </div>

      <section className="mt-4 p-4 border rounded-xl bg-white text-sm space-y-1">
        <p><b>주문번호</b> {order.id}</p>
        <p><b>상품</b> {order.productName}</p>
        <p><b>상태</b> {order.status}</p>
        <p><b>결제</b> {order.amount.toLocaleString("ko-KR")}원 / {order.method}</p>
        <p><b>배송지</b> {order.roadAddress} {order.detailAddress}</p>
        <p><b>요청사항</b> {order.deliveryRequest || "없음"}</p>
        {order.claimType && <p><b>클레임</b> {order.claimType} / {order.claimStatus} / {order.claimReason}</p>}
      </section>

      <section className="mt-3 p-4 border rounded-xl bg-slate-50">
        <h2 className="font-semibold">환불/교환 요청</h2>
        <textarea className="mt-2 w-full border rounded-lg px-3 py-2" rows={3} placeholder="사유를 입력해주세요" value={reason} onChange={(e) => setReason(e.target.value)} />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button onClick={() => claim("refund")} className="border rounded-lg py-2 bg-white">환불 요청</button>
          <button onClick={() => claim("exchange")} className="border rounded-lg py-2 bg-white">교환 요청</button>
        </div>
        {notice && <p className="text-sm text-blue-600 mt-2">{notice}</p>}
      </section>
    </main>
  );
}
