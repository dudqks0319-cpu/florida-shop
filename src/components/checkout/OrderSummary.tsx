"use client";

import { useState } from "react";

export default function OrderSummary({
  productTotal,
  shippingFee,
  couponDiscount,
  pointUsed,
  isMockMode = true,
  onSubmit,
}: {
  productTotal: number;
  shippingFee: number;
  couponDiscount: number;
  pointUsed: number;
  isMockMode?: boolean;
  onSubmit: () => void;
}) {
  const [agreed, setAgreed] = useState(false);
  const finalPrice = productTotal + shippingFee - couponDiscount - pointUsed;

  return (
    <section className="card">
      {isMockMode && <p className="text-xs text-slate-500">결제모드: <b>MOCK</b> (테스트)</p>}
      <div className="mt-2 text-sm space-y-1">
        <p className="flex justify-between"><span>상품금액</span><b>{productTotal.toLocaleString("ko-KR")}원</b></p>
        <p className="flex justify-between"><span>배송비</span><b>{shippingFee === 0 ? "무료" : `${shippingFee.toLocaleString("ko-KR")}원`}</b></p>
        <p className="flex justify-between"><span>쿠폰할인</span><b>-{couponDiscount.toLocaleString("ko-KR")}원</b></p>
        <p className="flex justify-between"><span>적립금 사용</span><b>-{pointUsed.toLocaleString("ko-KR")}원</b></p>
        <p className="flex justify-between text-lg mt-2"><span>최종 결제금액</span><b>{Math.max(finalPrice,0).toLocaleString("ko-KR")}원</b></p>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        주문/약관/개인정보 제공 동의
      </label>
      <button disabled={!agreed} onClick={onSubmit} className="mt-3 w-full py-3 rounded-xl bg-[#FF6B35] text-white font-semibold disabled:opacity-50">
        {Math.max(finalPrice,0).toLocaleString("ko-KR")}원 결제하기
      </button>
    </section>
  );
}
