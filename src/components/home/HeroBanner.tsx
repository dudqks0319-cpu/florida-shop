/* eslint-disable @next/next/no-img-element */
"use client";

type HeroBannerProps = {
  image?: string;
};

export default function HeroBanner({ image }: HeroBannerProps) {
  if (image) {
    return <img src={image} alt="메인 배너" className="w-full h-44 object-cover" />;
  }

  return (
    <div className="bg-gradient-to-r from-[#FF6B35] to-[#00BFA6] text-white p-4 h-44">
      <p className="text-xs opacity-90">FLORIDA WEEK</p>
      <h2 className="text-3xl font-black mt-2">최대 60% 특가</h2>
      <p className="text-sm mt-1 opacity-95">경쟁사 인기템 가격대 맞춤 큐레이션</p>
      <button className="mt-4 bg-white/20 rounded-full px-4 py-2 text-sm">지금 쇼핑하기</button>
    </div>
  );
}
