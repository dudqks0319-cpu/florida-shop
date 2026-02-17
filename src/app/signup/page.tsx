"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Provider = "email" | "kakao" | "google" | "naver";

export default function SignupPage() {
  const router = useRouter();

  const [provider, setProvider] = useState<Provider>("email");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string>("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    birthDate: "",
    address: "",
    apartment: "",
    dong: "",
    role: "requester",
  });

  const signup = async () => {
    setBusy(true);
    setNotice("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, provider }),
    });
    const json = await res.json();
    if (!res.ok) {
      setNotice(json.error || "회원가입 실패");
      setBusy(false);
      return;
    }
    setNotice("회원가입 완료! 메인으로 이동합니다.");
    setTimeout(() => router.push("/"), 500);
  };

  return (
    <main className="max-w-xl mx-auto p-5">
      <h1 className="text-2xl font-bold">회원가입</h1>
      <p className="text-sm text-slate-500 mt-1">미성년자는 가입할 수 없습니다. (만 19세 이상)</p>

      <div className="mt-4 grid gap-3">
        <select className="border rounded-lg px-3 py-2" value={provider} onChange={(e) => setProvider(e.target.value as Provider)}>
          <option value="email">이메일 가입</option>
          <option value="kakao">카카오 간편가입</option>
          <option value="google">구글 간편가입</option>
          <option value="naver">네이버 간편가입</option>
        </select>
        <input className="border rounded-lg px-3 py-2" placeholder="이름" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        <input className="border rounded-lg px-3 py-2" placeholder="이메일" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
        {provider === "email" && (
          <input type="password" className="border rounded-lg px-3 py-2" placeholder="비밀번호(8자 이상)" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
        )}
        <input type="date" className="border rounded-lg px-3 py-2" value={form.birthDate} onChange={(e) => setForm((p) => ({ ...p, birthDate: e.target.value }))} />
        <input className="border rounded-lg px-3 py-2" placeholder="주소지" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
        <input className="border rounded-lg px-3 py-2" placeholder="아파트명" value={form.apartment} onChange={(e) => setForm((p) => ({ ...p, apartment: e.target.value }))} />
        <input className="border rounded-lg px-3 py-2" placeholder="동 (예: 화봉동)" value={form.dong} onChange={(e) => setForm((p) => ({ ...p, dong: e.target.value }))} />

        <button onClick={signup} disabled={busy} className="bg-blue-600 text-white rounded-lg px-3 py-2 disabled:opacity-60">
          {busy ? "처리중..." : "회원가입"}
        </button>
      </div>

      {notice && <p className="mt-3 text-sm text-rose-600">{notice}</p>}

      <p className="mt-4 text-sm">
        이미 계정이 있나요? <Link href="/login" className="text-blue-600 underline">로그인</Link>
      </p>
    </main>
  );
}
