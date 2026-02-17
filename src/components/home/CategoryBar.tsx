"use client";

const QUICK_MENUS = ["남자패션", "의류", "주얼리", "패션소품", "빅사이즈", "쿠폰", "신발", "디지털", "가방", "뷰티", "라이프", "추천"];

export default function CategoryBar() {
  return (
    <section className="px-3 py-4 border-b bg-white">
      <div className="grid grid-cols-6 gap-y-4 text-center">
        {QUICK_MENUS.map((m) => (
          <button key={m} className="flex flex-col items-center gap-1">
            <span className="text-lg">◻︎</span>
            <span className="text-[11px] text-slate-700">{m}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
