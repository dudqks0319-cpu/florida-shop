"use client";

import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FLORIDA_PRODUCTS } from "@/lib/florida-products";
import { addOrder, getCart, pushRecent, setCart, type FloridaOrder } from "@/lib/florida-store";
import { getImageOverrides } from "@/lib/florida-admin";

const METHOD_LABEL: Record<string, string> = {
  kakaopay: "카카오페이",
  naverpay: "네이버페이",
  tosspay: "토스페이",
  card: "카드",
};

export default function FloridaProductDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();

  const [buyerName, setBuyerName] = useState("");
  const [size, setSize] = useState("");
  const [method, setMethod] = useState<"kakaopay" | "naverpay" | "tosspay" | "card">("kakaopay");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [imageOverrides] = useState<Record<string, string>>(() => getImageOverrides());

  const product = FLORIDA_PRODUCTS.find((p) => p.id === id);

  useEffect(() => {
    if (!product) return;
    pushRecent(product.id);
  }, [product]);

  if (!product) return notFound();
  const selectedSize = size || product.sizes[0] || "";

  const addToCart = () => {
    const cur = getCart();
    const next = { ...cur, [product.id]: (cur[product.id] || 0) + 1 };
    setCart(next);
    setNotice("장바구니에 담았습니다.");
  };

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

    const order: FloridaOrder = {
      id: `ord-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      size: selectedSize,
      qty: 1,
      amount: product.price,
      method,
      buyerName: buyerName.trim(),
      createdAt: new Date().toISOString(),
      status: "배송준비",
    };
    addOrder(order);

    setNotice(`${METHOD_LABEL[method]} 결제창으로 이동합니다.`);
    window.open(json.checkoutUrl, "_blank", "noopener,noreferrer");
    setBusy(false);
  };

  return (
    <main className="max-w-md mx-auto p-4 pb-20">
      <div className="flex justify-between items-center">
        <Link href="/florida" className="text-sm text-slate-500">← 플로리다 홈</Link>
        <button onClick={() => router.push("/florida/mypage")} className="text-sm">마이페이지</button>
      </div>

      {imageOverrides[product.id] || product.image ? <img src={imageOverrides[product.id] || product.image} alt={product.name} className="mt-3 h-72 w-full object-cover rounded-2xl" /> : <div className={`mt-3 h-72 rounded-2xl bg-gradient-to-br ${product.color}`} />}

      <p className="mt-4 text-xs text-blue-600 font-semibold">{product.category}</p>
      <h1 className="text-2xl font-extrabold mt-1">{product.name}</h1>
      <p className="text-slate-500 mt-1">{product.desc}</p>
      <div className="mt-3 flex items-center gap-2">
        <b className="text-2xl">{product.price.toLocaleString("ko-KR")}원</b>
        {product.originalPrice && <span className="text-sm line-through text-slate-400">{product.originalPrice.toLocaleString("ko-KR")}원</span>}
      </div>

      <section className="mt-4 p-4 border rounded-2xl bg-white">
        <h2 className="font-bold">사이즈</h2>
        <div className="mt-2 flex gap-2 flex-wrap">
          {product.sizes.map((s) => (
            <button key={s} onClick={() => setSize(s)} className={`px-3 py-1.5 rounded-full border text-sm ${selectedSize === s ? "bg-black text-white border-black" : "bg-white"}`}>
              {s}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-500">배송: {product.shippingInfo}</p>
      </section>

      <section className="mt-4 border rounded-2xl p-4 bg-slate-50">
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
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={addToCart} className="rounded-xl border py-3 font-semibold bg-white">장바구니 담기</button>
          <button onClick={checkout} disabled={busy} className="rounded-xl bg-blue-600 text-white py-3 font-semibold disabled:opacity-60">
            {busy ? "결제 준비중..." : `${METHOD_LABEL[method]} 결제`}
          </button>
        </div>
        {notice && <p className="text-sm text-rose-600 mt-2">{notice}</p>}
      </section>

      <section className="mt-4 p-4 border rounded-2xl bg-white">
        <h2 className="font-bold">리뷰 ({product.reviews.length})</h2>
        <div className="mt-2 space-y-2">
          {product.reviews.map((r, idx) => (
            <div key={`${r.user}-${idx}`} className="rounded-lg bg-slate-50 p-3">
              <p className="text-sm font-semibold">{r.user} · {"⭐".repeat(r.rating)}</p>
              <p className="text-sm text-slate-600 mt-1">{r.comment}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
