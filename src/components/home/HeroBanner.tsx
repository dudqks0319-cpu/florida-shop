/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";

type HeroBannerProps = {
  image?: string;
};

export default function HeroBanner({ image }: HeroBannerProps) {
  if (image) {
    return (
      <section className="px-3 pt-3 bg-white">
        <div className="relative h-44 rounded-2xl overflow-hidden">
          <img src={image} alt="메인 배너" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute left-4 bottom-4 text-white">
            <p className="text-xs font-semibold">FLORIDA PICK</p>
            <p className="text-lg font-black mt-1">이번 주 추천 스타일</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-3 pt-3 bg-white">
      <div className="h-44 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#00BFA6] text-white p-4 shadow-sm">
        <p className="text-xs opacity-90 font-semibold">FLORIDA WEEK</p>
        <h2 className="text-3xl font-black mt-2">최대 60% 특가</h2>
        <p className="text-sm mt-1 opacity-95">경쟁사 인기템 가격대 맞춤 큐레이션</p>
        <div className="mt-3 flex gap-2 text-[11px]">
          <span className="rounded-full bg-white/20 px-2 py-1">무료배송</span>
          <span className="rounded-full bg-white/20 px-2 py-1">오늘출발</span>
        </div>
        <Link href="/florida/all" className="mt-3 inline-flex bg-white/20 rounded-full px-4 py-2 text-sm font-semibold">
          지금 쇼핑하기
        </Link>
      </div>
    </section>
  );
}
