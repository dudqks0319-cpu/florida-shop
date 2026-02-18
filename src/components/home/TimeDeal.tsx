"use client";

import { useEffect, useMemo, useState } from "react";

type TimeDealProps = {
  onAction?: () => void;
};

function getRemainText(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function TimeDeal({ onAction }: TimeDealProps) {
  const [remainSec, setRemainSec] = useState(0);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      const diff = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
      setRemainSec(diff);
    };

    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const remainText = useMemo(() => getRemainText(remainSec), [remainSec]);

  return (
    <section className="px-3 py-3 border-b border-slate-100 bg-white">
      <div className="rounded-2xl border border-[#ffe1d6] bg-gradient-to-r from-[#fff7f2] to-[#fff9f4] p-3">
        <div className="flex items-center justify-between">
          <p className="font-bold text-sm text-[#E55A2B]">⏰ 타임딜</p>
          <p className="text-xs text-slate-500">오늘 종료까지 {remainText}</p>
        </div>
        <p className="mt-1 text-sm font-medium">인기 카고팬츠 · 볼캡 · 숄더백 추가 10% 쿠폰</p>
        <button
          onClick={onAction}
          className="mt-2 text-xs font-semibold rounded-full border border-[#ffd2c2] bg-white px-3 py-1 text-[#E55A2B]"
        >
          타임딜 상품만 보기
        </button>
      </div>
    </section>
  );
}
