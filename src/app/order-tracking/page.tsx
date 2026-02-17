"use client";

import { useState } from "react";

type TimelineStep = { step: string; date: string; done: boolean };
type TrackingResult = { orderNumber: string; status: string; carrier: string; trackingNumber: string; timeline: TimelineStep[] };

export default function OrderTrackingPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState("");

  const handleSearch = () => {
    if (!orderNumber || !password) return setError("주문번호와 비밀번호를 모두 입력해주세요.");
    setResult({
      orderNumber,
      status: "배송중",
      carrier: "CJ대한통운",
      trackingNumber: "1234567890",
      timeline: [
        { step: "주문완료", date: "02.15 14:30", done: true },
        { step: "결제확인", date: "02.15 14:31", done: true },
        { step: "상품준비", date: "02.16 09:00", done: true },
        { step: "배송중", date: "02.17 08:30", done: true },
        { step: "배송완료", date: "", done: false },
      ],
    });
    setError("");
  };

  return (
    <main className="max-w-md mx-auto p-4 pb-20">
      <h1 className="text-2xl font-black">비회원 주문 조회</h1>
      <p className="text-sm text-slate-500 mt-1">주문번호와 비밀번호를 입력해주세요.</p>

      <section className="card mt-3 space-y-2">
        <input value={orderNumber} onChange={(e)=>setOrderNumber(e.target.value)} className="input-field w-full" placeholder="주문번호" />
        <input value={password} onChange={(e)=>setPassword(e.target.value)} className="input-field w-full" placeholder="비밀번호" type="password" />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button className="btn-primary w-full" onClick={handleSearch}>조회하기</button>
      </section>

      {result && (
        <section className="card mt-3">
          <p className="font-semibold">현재 상태: {result.status}</p>
          <p className="text-sm text-slate-600 mt-1">{result.carrier} · {result.trackingNumber}</p>
          <div className="mt-3 space-y-2 text-sm">
            {result.timeline.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span>{s.done ? "🟢" : "⚪"}</span>
                <span>{s.step}</span>
                <span className="text-slate-400">{s.date}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
