"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/florida", label: "홈" },
  { href: "/florida/all", label: "전체보기" },
  { href: "/florida/cart", label: "장바구니" },
  { href: "/florida/mypage", label: "마이페이지" },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (!pathname) return null;

  if (pathname.startsWith("/admin") || pathname.startsWith("/florida/admin")) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 border-t bg-white/95 backdrop-blur">
      <div className="max-w-md mx-auto grid grid-cols-4 text-center py-2 text-xs">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={isActive ? "text-pink-500 font-semibold" : "text-slate-600"}>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
