"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/florida", label: "홈", icon: "🏠" },
  { href: "/florida/all", label: "카테고리", icon: "📂" },
  { href: "/florida/welcome", label: "혜택", icon: "🎁" },
  { href: "/florida/cart", label: "장바구니", icon: "🛒" },
  { href: "/florida/mypage", label: "마이", icon: "👤" },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (!pathname) return null;

  if (pathname.startsWith("/admin") || pathname.startsWith("/florida/admin") || pathname.startsWith("/florida/checkout")) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="max-w-md mx-auto grid grid-cols-5 py-2">
        {navItems.map((item) => {
          const isActive = item.href === "/florida" ? pathname === "/florida" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className="text-center">
              <span
                className={`mx-auto h-6 w-10 rounded-full text-[12px] flex items-center justify-center ${
                  isActive ? "bg-[#fff1ec] text-[#FF6B35]" : "text-slate-500"
                }`}
              >
                {item.icon}
              </span>
              <span className={`text-[11px] mt-0.5 block ${isActive ? "text-[#FF6B35] font-semibold" : "text-slate-600"}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
