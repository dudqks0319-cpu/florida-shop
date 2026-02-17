"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRecentViewed } from "@/hooks/useRecentViewed";

export default function RecentViewedFloat() {
  const { recentProducts } = useRecentViewed();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!recentProducts.length || !visible) return null;

  return (
    <div className="fixed right-3 bottom-24 z-40">
      {!open ? (
        <button onClick={() => setOpen(true)} className="rounded-full border bg-white px-3 py-2 shadow">👁 최근 {recentProducts.length}</button>
      ) : (
        <div className="w-36 rounded-xl border bg-white p-2 shadow">
          <div className="flex justify-between text-xs mb-2"><span>최근 본 상품</span><button onClick={()=>setVisible(false)}>✕</button></div>
          <div className="space-y-2 max-h-64 overflow-auto">
            {recentProducts.slice(0, 6).map((p) => (
              <Link key={p.id} href={`/florida/product/${p.id}`} className="flex gap-2 items-center">
                <Image src={p.image} alt={p.name} width={32} height={32} className="w-8 h-8 rounded object-cover" />
                <span className="text-[11px] line-clamp-1">{p.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
