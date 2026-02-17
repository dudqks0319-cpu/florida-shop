"use client";

import { useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  category: "구제" | "영캐주얼" | "잡화" | "모자";
  price: number;
  desc: string;
};

const PRODUCTS: Product[] = [
  { id: "v1", name: "빈티지 데님 자켓", category: "구제", price: 49000, desc: "워싱 포인트, 유니섹스 핏" },
  { id: "v2", name: "Y2K 카고 팬츠", category: "영캐주얼", price: 39000, desc: "와이드 실루엣, 데일리 코디" },
  { id: "v3", name: "레터링 볼캡", category: "모자", price: 19000, desc: "사계절 착용 가능한 기본 캡" },
  { id: "v4", name: "캔버스 숄더백", category: "잡화", price: 29000, desc: "수납 넉넉한 데일리 백" },
  { id: "v5", name: "크롭 후드 집업", category: "영캐주얼", price: 42000, desc: "가벼운 소재, 간절기 추천" },
  { id: "v6", name: "체인 키링 세트", category: "잡화", price: 12000, desc: "포인트 액세서리 3종" },
];

const METHOD_LABEL: Record<string, string> = {
  kakaopay: "카카오페이",
  naverpay: "네이버페이",
  tosspay: "토스페이",
  card: "카드",
};

export default function FloridaPage() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<"kakaopay" | "naverpay" | "tosspay" | "card">("kakaopay");
  const [buyerName, setBuyerName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string>("");

  const items = useMemo(() =>
    PRODUCTS.filter((p) => (cart[p.id] || 0) > 0).map((p) => ({ ...p, qty: cart[p.id] })),
  [cart]);

  const total = useMemo(() => items.reduce((sum, i) => sum + i.price * i.qty, 0), [items]);

  const add = (id: string) => setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const sub = (id: string) =>
    setCart((prev) => {
      const next = { ...prev };
      next[id] = Math.max((next[id] || 0) - 1, 0);
      if (next[id] === 0) delete next[id];
      return next;
    });

  const checkout = async () => {
    if (!buyerName.trim()) {
      setNotice("주문자 이름을 입력해주세요.");
      return;
    }
    if (!items.length) {
      setNotice("상품을 1개 이상 담아주세요.");
      return;
    }

    setBusy(true);
    setNotice("");

    const orderName = `${buyerName.trim()}님의 플로리다 주문`;
    const res = await fetch("/api/florida/payment/ready", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: paymentMethod, amount: total, orderName }),
    });
    const json = await res.json();

    if (!res.ok) {
      setNotice(json.error || "결제 준비 실패");
      setBusy(false);
      return;
    }

    setNotice(`${METHOD_LABEL[paymentMethod]} 결제창으로 이동합니다.`);
    window.open(json.checkoutUrl, "_blank", "noopener,noreferrer");
    setBusy(false);
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 pb-20">
      <h1 className="text-4xl font-black tracking-tight">플로리다 옷가게</h1>
      <p className="mt-2 text-slate-600">구제옷 · 영캐주얼 의류 · 모자 · 잡화를 한 번에.</p>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCTS.map((p) => (
          <article key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-blue-600 font-semibold">{p.category}</p>
            <h3 className="mt-1 font-bold text-lg">{p.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{p.desc}</p>
            <p className="mt-3 font-extrabold text-xl">{p.price.toLocaleString("ko-KR")}원</p>
            <div className="mt-3 flex items-center gap-2">
              <button onClick={() => sub(p.id)} className="rounded-lg border px-3 py-1.5">-</button>
              <span className="min-w-8 text-center">{cart[p.id] || 0}</span>
              <button onClick={() => add(p.id)} className="rounded-lg bg-slate-900 text-white px-3 py-1.5">+</button>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-xl font-bold">주문/결제</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_180px]">
          <input
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            className="rounded-lg border px-3 py-2"
            placeholder="주문자 이름"
          />
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
            className="rounded-lg border px-3 py-2"
          >
            <option value="kakaopay">카카오페이</option>
            <option value="naverpay">네이버페이</option>
            <option value="tosspay">토스페이</option>
            <option value="card">카드</option>
          </select>
        </div>

        <div className="mt-4 text-sm text-slate-600">선택 상품 {items.length}개 · 총액 <b>{total.toLocaleString("ko-KR")}원</b></div>

        <button
          onClick={checkout}
          disabled={busy}
          className="mt-4 w-full rounded-xl bg-blue-600 text-white py-3 font-semibold disabled:opacity-60"
        >
          {busy ? "결제 준비중..." : `${METHOD_LABEL[paymentMethod]}로 결제하기`}
        </button>

        {notice && <p className="mt-3 text-sm text-rose-600">{notice}</p>}
      </section>
    </main>
  );
}
