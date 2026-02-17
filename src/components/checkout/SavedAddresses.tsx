"use client";

import { useState } from "react";

type Address = { id: string; name: string; phone: string; address: string; detail: string; isDefault: boolean };

export default function SavedAddresses({ onSelect }: { onSelect: (a: Address) => void }) {
  const [items, setItems] = useState<Address[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem("florida_addresses");
    return raw ? JSON.parse(raw) : [];
  });
  const [open, setOpen] = useState(false);

  const remove = (id: string) => {
    const next = items.filter((x) => x.id !== id);
    setItems(next);
    localStorage.setItem("florida_addresses", JSON.stringify(next));
  };

  if (!items.length) return null;

  return (
    <section className="card">
      <button onClick={() => setOpen((v) => !v)} className="text-sm text-[#FF6B35] font-semibold">
        저장된 배송지 ({items.length}) {open ? "▲" : "▼"}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {items.map((a) => (
            <button key={a.id} onClick={() => onSelect(a)} className="w-full text-left p-2 rounded-lg border bg-white">
              <p className="text-sm font-semibold">{a.name} {a.isDefault ? <span className="text-xs text-[#FF6B35]">기본</span> : null}</p>
              <p className="text-xs text-slate-500">{a.phone}</p>
              <p className="text-xs text-slate-600">{a.address} {a.detail}</p>
              <span onClick={(e)=>{e.stopPropagation(); remove(a.id);}} className="text-xs text-rose-500">삭제</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
