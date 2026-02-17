"use client";

import Link from "next/link";
import { useState } from "react";

export default function MyPage() {
  const [loggedIn, setLoggedIn] = useState(true);

  if (!loggedIn) {
    return (
      <main className="max-w-md mx-auto p-4">
        <h1 className="text-2xl font-black">로그인이 필요합니다</h1>
        <p className="text-sm text-slate-500 mt-1">주문내역/찜/쿠폰 확인을 위해 로그인 해주세요.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link href="/login" className="btn-primary text-center py-2">로그인</Link>
          <Link href="/order-tracking" className="btn-secondary text-center py-2">비회원 주문조회</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto p-4 pb-20">
      <section className="card">
        <p className="text-xs text-slate-500">VIP</p>
        <h1 className="text-2xl font-black mt-1">영빈님</h1>
        <p className="text-sm text-slate-500">yeongbin@florida.shop</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="border rounded-lg p-2"><p className="text-slate-500">포인트</p><b>3,500P</b></div>
          <div className="border rounded-lg p-2"><p className="text-slate-500">쿠폰</p><b>5장</b></div>
        </div>
      </section>

      <section className="card mt-3">
        <div className="flex items-center justify-between"><h2 className="font-semibold">주문 · 배송</h2><Link href="/mypage/orders" className="text-sm text-blue-600">전체보기</Link></div>
        <div className="mt-2 grid grid-cols-5 text-center text-xs gap-1">
          {[["결제완료",2],["배송준비",1],["배송중",1],["배송완료",12],["교환/환불",0]].map(([k,v]) => <div key={String(k)} className="border rounded-lg p-2"><b>{String(v)}</b><p className="text-slate-500 mt-1">{String(k)}</p></div>)}
        </div>
      </section>

      <section className="card mt-3 text-sm">
        <div className="space-y-2">
          <Link href="/mypage/orders" className="block border rounded-lg p-2">주문내역</Link>
          <Link href="/florida/mypage" className="block border rounded-lg p-2">찜 목록</Link>
          <Link href="/order-tracking" className="block border rounded-lg p-2">비회원 주문조회</Link>
        </div>
      </section>

      <button onClick={()=>setLoggedIn(false)} className="mt-3 w-full border rounded-lg py-2 text-slate-500">로그아웃</button>
    </main>
  );
}
