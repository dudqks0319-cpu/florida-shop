"use client";

import type { FloridaCategory } from "@/lib/florida-products";

const QUICK_MENUS: Array<{ key: FloridaCategory; label: string; icon: string }> = [
  { key: "전체", label: "전체", icon: "🛍️" },
  { key: "구제", label: "구제", icon: "🧥" },
  { key: "영캐주얼", label: "영캐주얼", icon: "👖" },
  { key: "잡화", label: "잡화", icon: "👜" },
  { key: "모자", label: "모자", icon: "🧢" },
  { key: "영캐주얼", label: "신상", icon: "✨" },
  { key: "구제", label: "아우터", icon: "🧶" },
  { key: "잡화", label: "가방", icon: "🎒" },
  { key: "모자", label: "캡/비니", icon: "🧵" },
  { key: "영캐주얼", label: "인기", icon: "🔥" },
  { key: "잡화", label: "특가", icon: "💸" },
  { key: "전체", label: "추천", icon: "⭐" },
];

type CategoryBarProps = {
  selected?: FloridaCategory;
  onSelect?: (category: FloridaCategory) => void;
};

export default function CategoryBar({ selected = "전체", onSelect }: CategoryBarProps) {
  return (
    <section className="px-3 py-3 border-b border-slate-100 bg-white">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {QUICK_MENUS.map((m, idx) => {
          const active = selected === m.key || (selected !== "전체" && m.key === selected && idx > 0);
          return (
            <button
              key={`${m.label}-${idx}`}
              className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                active ? "border-[#ffd4c4] bg-[#fff5f1] text-[#FF6B35]" : "border-slate-200 bg-white text-slate-600"
              }`}
              onClick={() => onSelect?.(m.key)}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
