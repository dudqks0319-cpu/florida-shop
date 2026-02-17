"use client";

import { useEffect, useState } from "react";

type Opt = { colors: { name: string; code: string }[]; sizes: string[] };

export default function OptionBottomSheet({
  isOpen,
  onClose,
  product,
  options,
  onAddToCart,
  onBuyNow,
}: {
  isOpen: boolean;
  onClose: () => void;
  product: { id: string; name: string; price: number; originalPrice?: number };
  options: Opt;
  onAddToCart: (selected: { color: string; size: string; quantity: number }) => void;
  onBuyNow?: (selected: { color: string; size: string; quantity: number }) => void;
}) {
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;
  const ok = color && size;

  return (
    <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose}>
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 animate-slide-up" onClick={(e)=>e.stopPropagation()}>
        <p className="font-bold">{product.name}</p>
        <p className="text-sm text-slate-600 mt-1">{product.price.toLocaleString("ko-KR")}원</p>

        <p className="mt-3 text-sm font-semibold">컬러</p>
        <div className="flex gap-2 mt-1">{options.colors.map((c)=><button key={c.name} onClick={()=>setColor(c.name)} className={`px-3 py-1 rounded border ${color===c.name?"border-[#FF6B35] text-[#FF6B35]":"border-slate-300"}`}>{c.name}</button>)}</div>

        <p className="mt-3 text-sm font-semibold">사이즈</p>
        <div className="flex gap-2 mt-1">{options.sizes.map((s)=><button key={s} onClick={()=>setSize(s)} className={`px-3 py-1 rounded border ${size===s?"border-[#FF6B35] text-[#FF6B35]":"border-slate-300"}`}>{s}</button>)}</div>

        <div className="mt-3 flex items-center gap-2">
          <button onClick={()=>setQty((q)=>Math.max(1,q-1))} className="border rounded px-2">-</button>
          <span>{qty}</span>
          <button onClick={()=>setQty((q)=>q+1)} className="border rounded px-2">+</button>
          <span className="ml-auto font-semibold">{(product.price*qty).toLocaleString("ko-KR")}원</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button disabled={!ok} onClick={()=>{onAddToCart({color,size,quantity:qty}); onClose();}} className="border border-[#FF6B35] text-[#FF6B35] rounded-xl py-2 disabled:opacity-50">장바구니</button>
          <button disabled={!ok} onClick={()=>{onBuyNow?.({color,size,quantity:qty});}} className="bg-[#FF6B35] text-white rounded-xl py-2 disabled:opacity-50">바로구매</button>
        </div>
      </div>
    </div>
  );
}
