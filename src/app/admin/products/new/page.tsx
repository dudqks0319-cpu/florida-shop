/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useState } from "react";

export default function AdminProductNewPage() {
  const [images, setImages] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [description, setDescription] = useState("");

  return (
    <main className="max-w-3xl mx-auto p-4 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">새 상품 등록</h1>
        <Link href="/admin/products" className="px-3 py-2 border rounded-lg text-sm">목록으로</Link>
      </div>

      <section className="mt-4 p-4 border rounded-xl bg-white">
        <h2 className="font-semibold">상품 이미지</h2>
        <input type="file" multiple accept="image/*" className="mt-2" onChange={(e)=>{
          const f = e.target.files;
          if (!f) return;
          const urls = Array.from(f).map((x)=>URL.createObjectURL(x));
          setImages((prev)=>[...prev, ...urls].slice(0, 10));
        }} />
        <div className="mt-2 grid grid-cols-5 gap-2">
          {images.map((img, idx) => <img key={img+idx} src={img} alt="preview" className="w-full h-16 object-cover rounded border" />)}
        </div>
      </section>

      <section className="mt-3 p-4 border rounded-xl bg-white space-y-2">
        <h2 className="font-semibold">기본 정보</h2>
        <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="상품명" />
        <select value={category} onChange={(e)=>setCategory(e.target.value)} className="w-full border rounded-lg px-3 py-2">
          <option value="">카테고리 선택</option><option>상의</option><option>하의</option><option>아우터</option><option>가방</option><option>신발</option>
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input value={price} onChange={(e)=>setPrice(e.target.value.replace(/\D/g,""))} className="border rounded-lg px-3 py-2" placeholder="정가" />
          <input value={salePrice} onChange={(e)=>setSalePrice(e.target.value.replace(/\D/g,""))} className="border rounded-lg px-3 py-2" placeholder="할인가" />
        </div>
        <textarea value={description} onChange={(e)=>setDescription(e.target.value)} className="w-full border rounded-lg px-3 py-2" rows={5} placeholder="상품 설명" />
      </section>

      <button onClick={() => alert("상품이 등록되었습니다! (테스트)")} className="mt-4 w-full py-3 rounded-xl bg-[#FF6B35] text-white font-semibold">상품 등록하기</button>
    </main>
  );
}
