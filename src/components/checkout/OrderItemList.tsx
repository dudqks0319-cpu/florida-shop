"use client";

import Image from "next/image";
import { useState } from "react";

export interface OrderItem {
  id: string;
  name: string;
  image: string;
  option: string;
  quantity: number;
  price: number;
}

export default function OrderItemList({ items }: { items: OrderItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, 2);

  return (
    <section className="card">
      <h3 className="font-bold">📦 주문 상품 ({items.length}개)</h3>
      <div className="mt-3 space-y-2">
        {visible.map((item) => (
          <div key={item.id} className="flex gap-3 p-2 rounded-lg border bg-white">
            <Image src={item.image} alt={item.name} width={56} height={56} className="w-14 h-14 rounded object-cover" />
            <div className="text-sm">
              <p className="font-semibold">{item.name}</p>
              <p className="text-slate-500 text-xs">{item.option} / {item.quantity}개</p>
              <p className="font-semibold mt-1">{(item.price * item.quantity).toLocaleString("ko-KR")}원</p>
            </div>
          </div>
        ))}
      </div>
      {items.length > 2 && (
        <button className="mt-2 text-sm text-blue-600" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "접기 ▲" : `전체 ${items.length}개 상품 보기 ▼`}
        </button>
      )}
    </section>
  );
}
