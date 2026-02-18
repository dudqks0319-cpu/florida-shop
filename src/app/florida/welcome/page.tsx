import Link from "next/link";

const BENEFITS = [
  { title: "전 상품 무료배송", desc: "하나만 주문해도 배송비 0원" },
  { title: "신규 쿠폰 즉시 지급", desc: "가입 후 바로 3,000원 쿠폰 제공" },
  { title: "오늘출발 빠른 배송", desc: "오후 2시 전 결제 시 당일 출고" },
];

export default function FloridaWelcomePage() {
  return (
    <main className="min-h-screen bg-[#f5f6f8]">
      <div className="max-w-md mx-auto bg-white min-h-screen px-6 py-10">
        <p className="text-xs font-semibold text-[#FF6B35]">FLORIDA WELCOME</p>
        <h1 className="text-4xl font-black tracking-tight mt-2">플로리다에서
          <br />패션 쇼핑을 시작해보세요.
        </h1>
        <p className="mt-3 text-sm text-slate-600">지금 가입하면 무료배송 + 신규 쿠폰 혜택을 받을 수 있어요.</p>

        <section className="mt-6 space-y-2">
          {BENEFITS.map((b) => (
            <article key={b.title} className="rounded-xl border bg-slate-50 p-3">
              <p className="font-semibold text-sm">{b.title}</p>
              <p className="text-xs text-slate-500 mt-1">{b.desc}</p>
            </article>
          ))}
        </section>

        <div className="mt-8 grid gap-2">
          <Link href="/login" className="w-full rounded-xl bg-[#FEE500] py-3 text-center font-bold">카카오로 3초 만에 시작하기</Link>
          <Link href="/login" className="w-full rounded-xl border py-3 text-center font-semibold">이메일/소셜로 로그인</Link>
          <Link href="/florida" className="w-full rounded-xl border py-3 text-center text-slate-600">먼저 둘러보기</Link>
        </div>
      </div>
    </main>
  );
}
