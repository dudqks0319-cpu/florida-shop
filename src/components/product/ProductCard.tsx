"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type ProductCardProps = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  rating: number;
  reviewCount: number;
  shopName?: string;
  isNew?: boolean;
  colorClass?: string;
  wished?: boolean;
  onToggleWish?: () => void;
  onOpen?: () => void;
  onAddCart?: () => void;
};

export default function ProductCard({
  id,
  name,
  price,
  originalPrice,
  image,
  rating,
  reviewCount,
  shopName,
  isNew,
  colorClass,
  wished,
  onToggleWish,
  onOpen,
  onAddCart,
}: ProductCardProps) {
  const [localWish, setLocalWish] = useState(false);
  const isWished = wished ?? localWish;
  const discountRate = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <article className="rounded-xl border bg-white overflow-hidden">
      <div className="relative">
        <Link href={`/florida/product/${id}`} onClick={onOpen}>
          {image ? (
            <Image src={image} alt={name} width={320} height={320} className="w-full h-44 object-cover" />
          ) : (
            <div className={`w-full h-44 bg-gradient-to-br ${colorClass || "from-slate-100 to-slate-300"}`} />
          )}
        </Link>

        {isNew && <span className="absolute top-2 left-2 text-[10px] font-bold bg-black text-white rounded-full px-2 py-1">NEW</span>}
        {discountRate > 0 && <span className="absolute top-2 left-12 text-[10px] font-bold bg-rose-500 text-white rounded-full px-2 py-1">{discountRate}%</span>}

        <button
          onClick={() => {
            if (onToggleWish) onToggleWish();
            else setLocalWish(!isWished);
          }}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-all hover:scale-110"
          aria-label="찜하기"
        >
          <span className={`text-sm ${isWished ? "text-rose-500" : "text-slate-600"}`}>{isWished ? "♥" : "♡"}</span>
        </button>
      </div>

      <div className="p-2.5">
        {shopName && <p className="text-[11px] text-slate-400">{shopName}</p>}
        <Link href={`/florida/product/${id}`} onClick={onOpen} className="text-sm font-semibold line-clamp-2 mt-0.5 block">
          {name}
        </Link>

        <div className="mt-1.5 flex items-end gap-1">
          {discountRate > 0 && <span className="text-rose-500 font-bold text-sm">{discountRate}%</span>}
          <span className="text-lg font-extrabold leading-none">{price.toLocaleString("ko-KR")}원</span>
          {originalPrice && originalPrice > price && (
            <span className="text-xs text-slate-400 line-through">{originalPrice.toLocaleString("ko-KR")}원</span>
          )}
        </div>

        <div className="mt-1 flex items-center justify-between">
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <span className="text-amber-500">★</span>
            {rating.toFixed(1)} ({reviewCount})
          </p>
          <button onClick={onAddCart} className="text-xs border rounded px-2 py-0.5">담기</button>
        </div>
      </div>
    </article>
  );
}
