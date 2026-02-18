"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import OptionBottomSheet from "@/components/product/OptionBottomSheet";

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
  hasOptions?: boolean;
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
  hasOptions = true,
}: ProductCardProps) {
  const [localWish, setLocalWish] = useState(false);
  const [openOption, setOpenOption] = useState(false);
  const isWished = wished ?? localWish;
  const discountRate = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative">
        <Link href={`/florida/product/${id}`} onClick={onOpen}>
          {image ? (
            <Image src={image} alt={name} width={320} height={320} className="w-full h-36 object-cover" />
          ) : (
            <div className={`w-full h-36 bg-gradient-to-br ${colorClass || "from-slate-100 to-slate-300"}`} />
          )}
        </Link>

        <div className="absolute top-2 left-2 flex items-center gap-1">
          {isNew && <span className="text-[10px] font-bold bg-black text-white rounded-full px-2 py-1">NEW</span>}
          {discountRate > 0 && <span className="text-[10px] font-bold bg-rose-500 text-white rounded-full px-2 py-1">{discountRate}%</span>}
        </div>

        <button
          onClick={() => {
            if (onToggleWish) onToggleWish();
            else setLocalWish(!isWished);
          }}
          className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-white/90 backdrop-blur-sm shadow-sm text-sm"
          aria-label="찜하기"
        >
          <span className={`${isWished ? "text-rose-500" : "text-slate-600"}`}>{isWished ? "♥" : "♡"}</span>
        </button>
      </div>

      <div className="p-2.5">
        {shopName && <p className="text-[11px] text-slate-400">{shopName}</p>}
        <Link href={`/florida/product/${id}`} onClick={onOpen} className="text-sm font-semibold line-clamp-2 mt-0.5 block min-h-[36px]">
          {name}
        </Link>

        <div className="mt-1.5 flex items-end gap-1">
          {discountRate > 0 && <span className="text-rose-500 font-bold text-sm">{discountRate}%</span>}
          <span className="text-[24px] font-extrabold leading-none">{price.toLocaleString("ko-KR")}원</span>
          {originalPrice && originalPrice > price && (
            <span className="text-xs text-slate-400 line-through">{originalPrice.toLocaleString("ko-KR")}원</span>
          )}
        </div>

        <div className="mt-1.5 flex items-center justify-between">
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <span className="text-amber-500">★</span>
            {rating.toFixed(1)} ({reviewCount})
          </p>
          <button
            onClick={() => (hasOptions ? setOpenOption(true) : onAddCart?.())}
            className="text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white"
          >
            담기
          </button>
        </div>
      </div>

      <OptionBottomSheet
        isOpen={openOption}
        onClose={() => setOpenOption(false)}
        product={{ id, name, price, originalPrice }}
        options={{
          colors: [
            { name: "화이트", code: "#fff" },
            { name: "블랙", code: "#111" },
            { name: "네이비", code: "#1B2D45" },
          ],
          sizes: ["S", "M", "L", "XL"],
        }}
        onAddToCart={() => onAddCart?.()}
        onBuyNow={() => {
          onAddCart?.();
          window.location.href = "/florida/checkout";
        }}
      />
    </article>
  );
}
