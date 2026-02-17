import Link from "next/link";

export default function OrderCompletePage() {
  const orderNumber = "FL20260217-001234";
  const orderDate = "2026.02.17";
  const estimatedDelivery = "2026.02.20 (목)";
  const totalAmount = 55900;

  return (
    <main className="max-w-md mx-auto p-4 pb-20">
      <h1 className="text-2xl font-black">주문 완료</h1>
      <section className="card mt-4 text-center">
        <p className="text-5xl">✅</p>
        <p className="font-bold mt-2">주문이 완료되었어요! 🎉</p>
        <p className="text-sm text-slate-500 mt-1">플로리다를 이용해주셔서 감사합니다.</p>
      </section>
      <section className="card mt-3 text-sm space-y-1">
        <p className="flex justify-between"><span>주문번호</span><b>{orderNumber}</b></p>
        <p className="flex justify-between"><span>주문일시</span><b>{orderDate}</b></p>
        <p className="flex justify-between"><span>결제금액</span><b>{totalAmount.toLocaleString("ko-KR")}원</b></p>
        <p className="flex justify-between"><span>예상 배송일</span><b>{estimatedDelivery}</b></p>
      </section>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href="/florida/mypage" className="btn-secondary text-center py-2">주문 내역 보기</Link>
        <Link href="/florida" className="btn-primary text-center py-2">쇼핑 계속하기</Link>
      </div>
    </main>
  );
}
