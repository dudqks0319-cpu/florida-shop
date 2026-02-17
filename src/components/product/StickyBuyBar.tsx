"use client";

export default function StickyBuyBar({ isWished, onToggleWish, onOpenOptions }: { isWished: boolean; onToggleWish: () => void; onOpenOptions: () => void }) {
  return (
    <div className="fixed bottom-0 inset-x-0 border-t bg-white p-2 z-40 safe-area-bottom">
      <div className="max-w-md mx-auto grid grid-cols-[auto_1fr_1fr] gap-2">
        <button onClick={onToggleWish} className="px-3 rounded-xl border">{isWished ? "♥" : "♡"}</button>
        <button onClick={onOpenOptions} className="rounded-xl border border-[#FF6B35] text-[#FF6B35] font-semibold">장바구니</button>
        <button onClick={onOpenOptions} className="rounded-xl bg-[#FF6B35] text-white font-semibold">바로구매</button>
      </div>
    </div>
  );
}
