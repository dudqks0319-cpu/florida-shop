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
    <section className="px-3 py-4 border-b bg-white">
      <div className="grid grid-cols-6 gap-y-4 text-center">
        {QUICK_MENUS.map((m, idx) => {
          const active = selected === m.key || (selected !== "전체" && m.key === selected && idx > 0);
          return (
            <button
              key={`${m.label}-${idx}`}
              className="flex flex-col items-center gap-1"
              onClick={() => onSelect?.(m.key)}
            >
              <span className={`text-lg transition-transform ${active ? "scale-110" : "opacity-90"}`}>{m.icon}</span>
              <span className={`text-[11px] ${active ? "text-[#FF6B35] font-semibold" : "text-slate-700"}`}>{m.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
