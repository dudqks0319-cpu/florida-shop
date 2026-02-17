"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const HOT = ["린넨 셔츠", "와이드 팬츠", "캔버스 백", "볼캡", "카고팬츠", "니트"];
const ALL = ["린넨 셔츠", "린넨 바지", "와이드 팬츠", "캔버스 백", "크로스백", "후드집업"];

export default function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem("florida_recent_searches");
    return raw ? JSON.parse(raw) : [];
  });
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;
  const suggestions = q ? ALL.filter((k) => k.toLowerCase().includes(q.toLowerCase())) : [];

  const go = (keyword: string) => {
    if (!keyword.trim()) return;
    const next = [keyword, ...recent.filter((x) => x !== keyword)].slice(0, 10);
    setRecent(next);
    localStorage.setItem("florida_recent_searches", JSON.stringify(next));
    router.push(`/florida/all?search=${encodeURIComponent(keyword)}`);
    onClose();
    setQ("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-white p-4">
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&go(q)} className="border rounded-full px-4 py-2" placeholder="검색어를 입력하세요" />
        <button onClick={onClose}>취소</button>
      </div>
      <div className="mt-4 space-y-2">
        {q && suggestions.length > 0 ? suggestions.map((k) => <button key={k} onClick={() => go(k)} className="block text-left w-full">🔎 {k}</button>) : (
          <>
            {!!recent.length && <div><p className="font-semibold">최근 검색어</p>{recent.map((k)=><button key={k} onClick={()=>go(k)} className="mr-2 mt-2 px-2 py-1 border rounded-full text-sm">{k}</button>)}</div>}
            <div className="mt-4"><p className="font-semibold">인기 검색어</p>{HOT.map((k,i)=><button key={k} onClick={()=>go(k)} className="block mt-1">{i+1}. {k}</button>)}</div>
          </>
        )}
      </div>
    </div>
  );
}
