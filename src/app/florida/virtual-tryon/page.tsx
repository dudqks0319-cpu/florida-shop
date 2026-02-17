"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FLORIDA_PRODUCTS } from "@/lib/florida-products";

export default function VirtualTryOnPage() {
  const [productId, setProductId] = useState(() => {
    if (typeof window === "undefined") return FLORIDA_PRODUCTS[0]?.id || "v1";
    const q = new URLSearchParams(window.location.search).get("productId");
    if (q && FLORIDA_PRODUCTS.some((p) => p.id === q)) return q;
    return FLORIDA_PRODUCTS[0]?.id || "v1";
  });
  const [selfiePreview, setSelfiePreview] = useState("");
  const [selfieName, setSelfieName] = useState("");
  const [selfieDataUrl, setSelfieDataUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const selected = useMemo(() => FLORIDA_PRODUCTS.find((p) => p.id === productId), [productId]);

  const onPickSelfie = async (file?: File) => {
    if (!file) return;
    setSelfieName(file.name);
    setSelfiePreview(URL.createObjectURL(file));

    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("이미지 읽기 실패"));
      reader.readAsDataURL(file);
    });
    setSelfieDataUrl(dataUrl);
  };

  const generate = async () => {
    setBusy(true);
    setNotice("");
    const res = await fetch("/api/virtual-tryon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, selfieName, selfieDataUrl }),
    });
    const json = await res.json();
    if (!res.ok) {
      setNotice(json.error || "가상피팅 생성 실패");
      setBusy(false);
      return;
    }
    setResultUrl(json.resultImageUrl || "");
    setNotice(`${json.message || "생성 완료"} (${String(json.mode || "mock").toUpperCase()})`);
    setBusy(false);
  };

  return (
    <main className="max-w-md mx-auto p-4 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">가상피팅</h1>
        <Link href="/florida" className="text-sm text-slate-500">플로리다 홈</Link>
      </div>
      <p className="text-sm text-slate-500 mt-1">셀카 + 상품을 선택하면 AI 피팅 미리보기를 생성합니다. (현재 MVP mock)</p>

      <section className="mt-4 p-4 border rounded-xl bg-white">
        <h2 className="font-semibold">1) 상품 선택</h2>
        <select className="mt-2 w-full border rounded-lg px-3 py-2" value={productId} onChange={(e) => setProductId(e.target.value)}>
          {FLORIDA_PRODUCTS.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {selected && <p className="mt-2 text-sm">선택 상품: <b>{selected.name}</b> ({selected.price.toLocaleString("ko-KR")}원)</p>}
      </section>

      <section className="mt-3 p-4 border rounded-xl bg-white">
        <h2 className="font-semibold">2) 셀카 업로드</h2>
        <input className="mt-2" type="file" accept="image/*" onChange={(e) => onPickSelfie(e.target.files?.[0])} />
        {selfiePreview && <img src={selfiePreview} alt="selfie preview" className="mt-2 h-40 w-full object-cover rounded-lg" />}
      </section>

      <button onClick={generate} disabled={busy} className="mt-3 w-full rounded-xl bg-[#FF6B35] text-white py-3 font-semibold disabled:opacity-60">
        {busy ? "생성중..." : "가상피팅 생성"}
      </button>

      {notice && <p className="mt-2 text-sm text-blue-600">{notice}</p>}

      {resultUrl && (
        <section className="mt-3 p-4 border rounded-xl bg-white">
          <h2 className="font-semibold">3) 결과</h2>
          <img src={resultUrl} alt="virtual try-on result" className="mt-2 h-64 w-full object-cover rounded-lg" />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link href="/florida/cart" className="text-center border rounded-lg py-2 text-sm">장바구니 가기</Link>
            {selected && <Link href={`/florida/product/${selected.id}`} className="text-center border rounded-lg py-2 text-sm">상품상세 보기</Link>}
          </div>
        </section>
      )}
    </main>
  );
}
