import Link from "next/link";

const BENEFITS = [
  { title: "전 상품 무료배송", desc: "하나만 주문해도 배송비 0원" },
  { title: "신규 쿠폰 즉시 지급", desc: "가입 후 바로 3,000원 쿠폰 제공" },
  { title: "오늘출발 빠른 배송", desc: "오후 2시 전 결제 시 당일 출고" },
];

export default function FloridaWelcomePage() {
  return (
    <main className="min-h-screen bg-[#eef1f4]">
      <div className="max-w-md mx-auto bg-[#f8fafc] min-h-screen px-4 py-6 pb-24">
        <section className="rounded-3xl bg-gradient-to-r from-[#FF6B35] to-[#00BFA6] p-5 text-white shadow-sm">
          <p className="text-xs font-semibold opacity-90">FLORIDA WELCOME</p>
          <h1 className="text-3xl font-black tracking-tight mt-2">지금 시작하면
            <br />혜택이 바로 적용돼요.
          </h1>
          <p className="text-sm mt-2 opacity-95">무료배송 + 신규쿠폰 + 오늘출발 상품까지 한 번에.</p>
        </section>

        <section className="mt-4 space-y-2">
          {BENEFITS.map((b) => (
            <article key={b.title} className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="font-semibold text-sm">{b.title}</p>
              <p className="text-xs text-slate-500 mt-1">{b.desc}</p>
            </article>
          ))}
        </section>

        <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur p-3">
          <div className="max-w-md mx-auto grid gap-2">
            <Link href="/login" className="w-full rounded-xl bg-[#FEE500] py-3 text-center font-bold text-[#191919]">카카오로 3초 만에 시작하기</Link>
            <Link href="/login" className="w-full rounded-xl border border-slate-300 py-3 text-center font-semibold">이메일/소셜로 로그인</Link>
            <Link href="/florida" className="w-full rounded-xl border border-slate-200 py-3 text-center text-slate-600">먼저 둘러보기</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
