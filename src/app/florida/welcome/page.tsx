import Link from "next/link";

export default function FloridaWelcomePage() {
  return (
    <main className="min-h-screen bg-[#f5f6f8]">
      <div className="max-w-md mx-auto bg-white min-h-screen px-8 py-16 text-center">
        <h1 className="text-5xl font-black tracking-[0.25em]">ABLY</h1>
        <p className="mt-8 text-5xl font-black leading-tight">에이블리는<br />전 상품 <span className="text-rose-500">무료배송</span></p>

        <button className="mt-12 w-full rounded-xl bg-yellow-300 py-4 text-xl font-bold">카카오로 3초 만에 시작하기</button>

        <div className="mt-8 flex justify-center gap-4 text-3xl">
          <button>🟢</button>
          <button>⚫️</button>
          <button>🔵</button>
          <button>✉️</button>
        </div>

        <Link href="/login" className="mt-8 block underline text-slate-500">이메일로 로그인하기</Link>
      </div>
    </main>
  );
}
