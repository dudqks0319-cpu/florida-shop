"use client";

import { useState } from "react";
import { FLORIDA_PRODUCTS } from "@/lib/florida-products";
import { getBannerImage, getImageOverrides, setBannerImage, setImageOverrides } from "@/lib/florida-admin";

export default function FloridaAdminPage() {
  const [banner, setBanner] = useState(() => getBannerImage());
  const [overrides, setOverrides] = useState<Record<string, string>>(() => getImageOverrides());
  const [notice, setNotice] = useState("");

  const upload = async (file: File, onDone: (url: string) => void) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/florida/admin/upload", { method: "POST", body: form });
    const json = await res.json();
    if (!res.ok) {
      setNotice(json.error || "업로드 실패");
      return;
    }
    onDone(json.url);
    setNotice("업로드 완료");
  };

  return (
    <main className="max-w-2xl mx-auto p-4 pb-20">
      <h1 className="text-2xl font-black">플로리다 관리자</h1>
      <p className="text-sm text-slate-500 mt-1">배너/상품 이미지 교체</p>

      <section className="mt-4 p-4 border rounded-xl bg-white">
        <h2 className="font-bold">메인 배너</h2>
        {banner && <img src={banner} alt="banner" className="mt-2 w-full h-36 object-cover rounded" />}
        <input className="mt-2" type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, (url) => { setBanner(url); setBannerImage(url); }); }} />
      </section>

      <section className="mt-4 p-4 border rounded-xl bg-white">
        <h2 className="font-bold">상품 이미지 교체</h2>
        <div className="space-y-3 mt-2">
          {FLORIDA_PRODUCTS.map((p) => (
            <div key={p.id} className="border rounded p-2">
              <p className="text-sm font-semibold">{p.name}</p>
              {(overrides[p.id] || p.image) && <img src={overrides[p.id] || p.image} alt={p.name} className="mt-1 w-24 h-24 rounded object-cover" />}
              <input type="file" accept="image/*" className="mt-1" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, (url) => { const next = { ...overrides, [p.id]: url }; setOverrides(next); setImageOverrides(next); }); }} />
            </div>
          ))}
        </div>
      </section>

      {notice && <p className="mt-3 text-sm text-blue-600">{notice}</p>}
    </main>
  );
}
