"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const loginEmail = async () => {
    setBusy(true);
    setNotice("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "email", email, password }),
    });
    const json = await res.json();
    if (!res.ok) {
      setNotice(json.error || "로그인 실패");
      setBusy(false);
      return;
    }
    router.push("/");
  };

  const oauthLogin = (provider: "kakao" | "google" | "naver") => {
    window.location.href = `/api/auth/signin?provider=${provider}&callbackUrl=/`;
  };

  return (
    <main className="max-w-xl mx-auto p-5">
      <h1 className="text-2xl font-bold">로그인</h1>
      <p className="text-sm text-slate-500 mt-1">이메일 로그인 또는 OAuth(카카오/구글/네이버) 로그인</p>
      <p className="text-xs text-slate-500 mt-1">역할(requester/helper)은 회원가입 시 선택됩니다.</p>

      <section className="mt-4 p-4 border rounded-xl bg-white">
        <h2 className="font-semibold">이메일 로그인</h2>
        <div className="mt-2 grid gap-2">
          <input className="border rounded-lg px-3 py-2" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" className="border rounded-lg px-3 py-2" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={loginEmail} disabled={busy} className="bg-blue-600 text-white rounded-lg px-3 py-2 disabled:opacity-60">이메일로 로그인</button>
        </div>
      </section>

      <section className="mt-3 p-4 border rounded-xl bg-white">
        <h2 className="font-semibold">OAuth 로그인</h2>
        <p className="text-xs text-slate-500 mt-1">실제 카카오/구글/네이버 OAuth 인증으로 로그인합니다.</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <button onClick={() => oauthLogin("kakao")} disabled={busy} className="rounded-lg px-3 py-2 bg-yellow-300">카카오</button>
          <button onClick={() => oauthLogin("google")} disabled={busy} className="rounded-lg px-3 py-2 bg-slate-100">구글</button>
          <button onClick={() => oauthLogin("naver")} disabled={busy} className="rounded-lg px-3 py-2 bg-green-500 text-white">네이버</button>
        </div>
      </section>

      {notice && <p className="mt-3 text-sm text-rose-600">{notice}</p>}

      <p className="mt-4 text-sm">
        계정이 없나요? <Link href="/signup" className="text-blue-600 underline">회원가입</Link>
      </p>
    </main>
  );
}
