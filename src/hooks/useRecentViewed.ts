"use client";

import { useState } from "react";

export type RecentProduct = { id: string; name: string; image: string; price: number; viewedAt: number };
const KEY = "florida_recent_viewed";

export function useRecentViewed() {
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  });

  const addRecentProduct = (p: Omit<RecentProduct, "viewedAt">) => {
    setRecentProducts((prev) => {
      const next = [{ ...p, viewedAt: Date.now() }, ...prev.filter((x) => x.id !== p.id)].slice(0, 20);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  };

  const removeRecentProduct = (id: string) => {
    const next = recentProducts.filter((x) => x.id !== id);
    setRecentProducts(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const clearAll = () => {
    setRecentProducts([]);
    localStorage.removeItem(KEY);
  };

  return { recentProducts, addRecentProduct, removeRecentProduct, clearAll };
}
