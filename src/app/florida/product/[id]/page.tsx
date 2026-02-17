"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import { FLORIDA_PRODUCTS } from "@/lib/florida-products";

const METHOD_LABEL: Record<string, string> = {
  kakaopay: "카카오페이",
  naverpay: "네이버페이",
  tosspay: "토스페이",
  card: "카드",
};

export default function FloridaProductDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [buyerName, setBuyerName] = useState("");
  const [method, setMethod] = useState<"kakaopay" | "naverpay" | "tosspay" | "card">("kakaopay");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const product = FLORIDA_PRODUCTS.find((p) => p.id === id);
  if (!product) return notFound();

  const checkout = async () => {
    if (!buyerName.trim()) {
      setNotice("주문자 이름을 입력해주세요.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/florida/payment/ready", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, amount: product.price, orderName: `${product.name} 주문` }),
    });
    const json = await res.json();
    if (!res.ok) {
      setNotice(json.error || "결제 준비 실패");
      setBusy(false);
      return;
    }
    setNotice(`${METHOD_LABEL[method]} 결제창으로 이동합니다.`);
    window.open(json.checkoutUrl, "_blank", "noopener,noreferrer");
    setBusy(false);
  };

  return (
    <main className="max-w-3xl mx-auto p-4 pb-20">
      <Link href="/florida" className="text-sm text-slate-500">← 플로리다 홈</Link>
      <div className={`mt-3 h-72 rounded-2xl bg-gradient-to-br ${product.color}`} />
      <p className="mt-4 text-xs text-blue-600 font-semibold">{product.category}</p>
      <h1 className="text-2xl font-extrabold mt-1">{product.name}</h1>
      <p className="text-slate-500 mt-1">{product.desc}</p>
      <div className="mt-3 flex items-center gap-2">
        <b className="text-2xl">{product.price.toLocaleString("ko-KR")}원</b>
        {product.originalPrice && <span className="text-sm line-through text-slate-400">{product.originalPrice.toLocaleString("ko-KR")}원</span>}
      </div>

      <section className="mt-6 border rounded-2xl p-4 bg-slate-50">
        <h2 className="font-bold">바로결제</h2>
        <div className="grid sm:grid-cols-[1fr_180px] gap-2 mt-3">
          <input className="rounded-lg border px-3 py-2" placeholder="주문자 이름" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
          <select className="rounded-lg border px-3 py-2" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
            <option value="kakaopay">카카오페이</option>
            <option value="naverpay">네이버페이</option>
            <option value="tosspay">토스페이</option>
            <option value="card">카드</option>
          </select>
        </div>
        <button onClick={checkout} disabled={busy} className="mt-3 w-full rounded-xl bg-blue-600 text-white py-3 font-semibold disabled:opacity-60">
          {busy ? "결제 준비중..." : `${METHOD_LABEL[method]}로 ${product.price.toLocaleString("ko-KR")}원 결제`}
        </button>
        {notice && <p className="text-sm text-rose-600 mt-2">{notice}</p>}
      </section>
    </main>
  );
}
