import Link from "next/link";

const LEFT = ["아우터", "상의", "팬츠", "원피스/세트", "스커트", "신발", "가방", "주얼리", "패션소품", "빅사이즈", "언더웨어"];
const OUTER = ["가디건", "자켓", "집업/점퍼", "바람막이", "코트", "플리스", "야상", "패딩"];

export default function FloridaAllPage() {
  return (
    <main className="min-h-screen bg-[#f5f6f8]">
      <div className="max-w-md mx-auto min-h-screen bg-white pb-16">
        <div className="bg-[#ff4d67] text-white px-3 py-2 flex items-center justify-between text-sm">
          <span className="font-semibold">앱에서 더 많은 상품을 볼 수 있어요!</span>
          <button className="bg-white text-[#111] rounded-full px-3 py-1 text-xs font-semibold">앱에서 보기</button>
        </div>
        <header className="px-4 py-4 flex items-center justify-between border-b">
          <h1 className="text-4xl font-black">전체보기</h1>
          <Link href="/florida" className="text-sm text-slate-500">닫기 ✕</Link>
        </header>

        <section className="grid grid-cols-[100px_1fr] min-h-[calc(100vh-130px)]">
          <aside className="border-r bg-[#f8f9fb]">
            {LEFT.map((item) => (
              <div key={item} className="px-3 py-3 text-sm border-b">{item}</div>
            ))}
          </aside>
          <div className="p-3">
            <h2 className="text-4xl font-black">아우터</h2>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {OUTER.map((o) => (
                <div key={o} className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-slate-100" />
                  <p className="mt-1 text-xs">{o}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
