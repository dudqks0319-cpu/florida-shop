"use client";

import { useEffect, useMemo, useState } from "react";
import NaverMap from "@/components/NaverMap";

type AddressItem = {
  roadAddr: string;
  jibunAddr: string;
  siNm: string;
  sggNm: string;
  emdNm: string;
  bdNm: string;
  admCd: string;
};

type CurrentUser = {
  id: string;
  name: string;
  role: "requester" | "helper" | "admin";
};

type Errand = {
  id: string;
  title: string;
  detail: string;
  category: "convenience" | "delivery" | "bank" | "admin" | "etc";
  rewardKrw: number;
  requester: string;
  apartment: string;
  status: "open" | "matched" | "in_progress" | "done" | "cancelled";
  helper?: string;
  payment: {
    method: "kakaopay" | "naverpay" | "tosspay" | "card";
    status: "pending" | "ready" | "paid" | "failed";
    provider: "mock" | "live";
    orderId: string;
    checkoutUrl?: string;
    paidAt?: string;
    failedReason?: string;
  };
  settlement?: {
    platformFeeKrw: number;
    helperPayoutKrw: number;
    status: "pending" | "paid";
    settledAt?: string;
  };
  cancellation?: {
    reason: string;
    penaltyLevel: "none" | "medium";
    requesterPenaltyKrw: number;
    helperCompensationKrw: number;
    decidedAt: string;
  };
};

const categoryLabel: Record<string, string> = {
  convenience: "편의점",
  delivery: "배달/수령",
  bank: "은행",
  admin: "행정/번호표",
  etc: "기타",
};

const statusLabel: Record<string, string> = {
  open: "모집중",
  matched: "매칭완료",
  in_progress: "진행중",
  done: "완료",
  cancelled: "취소",
};

const statusColor: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 border-blue-200",
  matched: "bg-amber-100 text-amber-800 border-amber-200",
  in_progress: "bg-purple-100 text-purple-800 border-purple-200",
  done: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const paymentMethodLabel: Record<string, string> = {
  kakaopay: "카카오페이",
  naverpay: "네이버페이",
  tosspay: "토스페이",
  card: "카드",
};

const paymentStatusLabel: Record<string, string> = {
  pending: "결제대기",
  ready: "결제준비",
  paid: "결제완료",
  failed: "결제실패",
};

function formatKrw(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export default function Home() {
  const [errands, setErrands] = useState<Errand[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loginName, setLoginName] = useState("");
  const [loginRole, setLoginRole] = useState<"requester" | "helper" | "admin">("requester");

  const [form, setForm] = useState({
    title: "",
    detail: "",
    category: "convenience",
    paymentMethod: "kakaopay",
    rewardKrw: 5000,
    requester: "",
    apartment: "",
  });
  const [helperName, setHelperName] = useState("");

  const [addrKeyword, setAddrKeyword] = useState("");
  const [addrItems, setAddrItems] = useState<AddressItem[]>([]);
  const [selectedAddr, setSelectedAddr] = useState<AddressItem | null>(null);
  const [verifyRequestId, setVerifyRequestId] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [verifiedDongne, setVerifiedDongne] = useState("");
  const [verifiedRequestId, setVerifiedRequestId] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | Errand["status"]>("all");
  const [searchKeyword, setSearchKeyword] = useState("");

  const openCount = useMemo(() => errands.filter((e) => e.status === "open").length, [errands]);
  const totalPenalty = useMemo(() => errands.reduce((sum, e) => sum + (e.cancellation?.requesterPenaltyKrw ?? 0), 0), [errands]);

  const mapQuery = useMemo(() => {
    if (!selectedAddr) return "울산광역시";
    return selectedAddr.roadAddr || selectedAddr.jibunAddr || `${selectedAddr.siNm} ${selectedAddr.sggNm} ${selectedAddr.emdNm}`;
  }, [selectedAddr]);

  const filteredErrands = useMemo(() => {
    return errands.filter((e) => {
      const byStatus = statusFilter === "all" || e.status === statusFilter;
      const keyword = searchKeyword.trim().toLowerCase();
      const byKeyword =
        !keyword ||
        e.title.toLowerCase().includes(keyword) ||
        e.detail.toLowerCase().includes(keyword) ||
        e.requester.toLowerCase().includes(keyword) ||
        e.apartment.toLowerCase().includes(keyword);
      return byStatus && byKeyword;
    });
  }, [errands, statusFilter, searchKeyword]);

  const refresh = async () => {
    try {
      const res = await fetch("/api/errands");
      if (!res.ok) {
        setNotice({ type: "error", text: "의뢰 목록을 불러오는데 실패했습니다." });
        return;
      }
      setErrands(await res.json());
    } catch {
      setNotice({ type: "error", text: "서버에 연결할 수 없습니다." });
    }
  };

  const fetchMe = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return;
      const json = await res.json();
      setCurrentUser(json.user || null);
      if (json.user?.name) {
        setForm((prev) => ({ ...prev, requester: json.user.name }));
      }
    } catch {
      // 세션 없는 경우 무시
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    fetchMe();
  }, []);

  const login = async () => {
    if (!loginName.trim()) {
      setNotice({ type: "error", text: "로그인 이름을 입력해주세요." });
      return;
    }
    setBusy(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: loginName.trim(), role: loginRole }),
    });
    const json = await res.json();
    if (!res.ok) {
      setNotice({ type: "error", text: json.error || "로그인 실패" });
      setBusy(false);
      return;
    }
    setCurrentUser(json.user);
    setForm((prev) => ({ ...prev, requester: json.user.name }));
    setNotice({ type: "ok", text: `${json.user.name}(${json.user.role}) 로그인 완료` });
    setBusy(false);
  };

  const logout = async () => {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
    setNotice({ type: "ok", text: "로그아웃 되었습니다." });
    setBusy(false);
  };

  const createErrand = async () => {
    if (!currentUser) {
      setNotice({ type: "error", text: "로그인 후 의뢰 등록이 가능합니다." });
      return;
    }
    if (!form.title || !form.requester || !form.apartment) {
      setNotice({ type: "error", text: "제목/의뢰자/아파트를 모두 입력해주세요." });
      return;
    }
    if (!verifiedRequestId) {
      setNotice({ type: "error", text: "동네 인증 완료 후 의뢰를 등록할 수 있어요." });
      return;
    }

    setBusy(true);
    const res = await fetch("/api/errands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, verificationRequestId: verifiedRequestId }),
    });

    if (!res.ok) {
      const json = await res.json();
      setNotice({ type: "error", text: json.error || "의뢰 등록 실패" });
      setBusy(false);
      return;
    }

    setForm({ ...form, title: "", detail: "", rewardKrw: 5000, paymentMethod: form.paymentMethod });
    setNotice({ type: "ok", text: "의뢰가 등록되었습니다." });
    await refresh();
    setBusy(false);
  };

  const updateErrand = async (id: string, patch: Partial<Errand>) => {
    setBusy(true);
    const res = await fetch(`/api/errands/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const json = await res.json();
      setNotice({ type: "error", text: json.error || "상태 변경 실패" });
      setBusy(false);
      return;
    }
    await refresh();
    setBusy(false);
  };

  const completeAndSettle = async (e: Errand) => {
    const platformFeeKrw = Math.round(e.rewardKrw * 0.1);
    const helperPayoutKrw = e.rewardKrw - platformFeeKrw;

    await updateErrand(e.id, {
      status: "done",
      settlement: {
        platformFeeKrw,
        helperPayoutKrw,
        status: "paid",
        settledAt: new Date().toISOString(),
      },
    });
  };

  const readyPayment = async (e: Errand) => {
    setBusy(true);
    const res = await fetch(`/api/payments/${e.id}/ready`, { method: "POST" });
    const json = await res.json();
    if (!res.ok) {
      setNotice({ type: "error", text: json.error || "결제 준비 실패" });
      setBusy(false);
      return;
    }
    setNotice({ type: "ok", text: `${paymentMethodLabel[e.payment.method]} 결제 준비 완료` });
    await refresh();
    setBusy(false);
  };

  const confirmPayment = async (e: Errand) => {
    setBusy(true);
    const res = await fetch(`/api/payments/${e.id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = await res.json();
    if (!res.ok) {
      setNotice({ type: "error", text: json.error || "결제 완료 처리 실패" });
      setBusy(false);
      return;
    }
    setNotice({ type: "ok", text: "결제 완료 처리되었습니다." });
    await refresh();
    setBusy(false);
  };

  const lookupAddress = async () => {
    if (!addrKeyword.trim()) {
      setNotice({ type: "error", text: "검색어를 입력해주세요." });
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/address/lookup?keyword=${encodeURIComponent(addrKeyword)}`);
    const json = await res.json();
    if (!res.ok) {
      setNotice({ type: "error", text: json.error || "주소 검색 실패" });
      setBusy(false);
      return;
    }
    setAddrItems(json.items || []);
    setNotice({ type: "ok", text: `주소 검색 결과 ${json.items?.length ?? 0}건` });
    setBusy(false);
  };

  const issueNeighborhoodCode = async () => {
    if (!selectedAddr) {
      setNotice({ type: "error", text: "먼저 주소/아파트를 선택해주세요." });
      return;
    }
    if (!form.requester.trim()) {
      setNotice({ type: "error", text: "의뢰자 이름을 먼저 입력해주세요." });
      return;
    }

    const apartment = selectedAddr.bdNm || selectedAddr.roadAddr;
    const dong = `${selectedAddr.siNm} ${selectedAddr.sggNm} ${selectedAddr.emdNm}`.trim();

    setForm((prev) => ({ ...prev, apartment }));
    setBusy(true);
    const res = await fetch("/api/neighborhood/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requester: form.requester.trim(), apartment, dong }),
    });
    const json = await res.json();
    if (!res.ok) {
      setNotice({ type: "error", text: json.error || "인증코드 발급 실패" });
      setBusy(false);
      return;
    }

    setVerifyRequestId(json.requestId);
    setDemoCode(json.demoCode || "");
    setNotice({
      type: "ok",
      text: json.demoCode
        ? `인증코드 발급 완료 (데모코드: ${json.demoCode})`
        : "인증코드 발급 완료. 운영모드에서는 코드가 화면에 노출되지 않습니다.",
    });
    setBusy(false);
  };

  const verifyNeighborhood = async () => {
    if (!verifyRequestId.trim() || !verifyCode.trim()) {
      setNotice({ type: "error", text: "인증코드를 입력해주세요." });
      return;
    }
    setBusy(true);
    const res = await fetch("/api/neighborhood/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: verifyRequestId, code: verifyCode }),
    });
    const json = await res.json();
    if (!res.ok) {
      setNotice({ type: "error", text: json.error || "동네 인증 실패" });
      setBusy(false);
      return;
    }
    setVerifiedDongne(json.neighborhood || "인증완료");
    setVerifiedRequestId(verifyRequestId);
    setNotice({ type: "ok", text: "동네 인증 완료! 이제 의뢰 등록이 가능합니다." });
    setBusy(false);
  };

  return (
    <main className="max-w-[1100px] mx-auto px-4 sm:px-5 py-5 pb-16">
      {/* 헤더 */}
      <h1 className="text-3xl sm:text-[40px] font-extrabold tracking-tight">동네 건당 심부름</h1>
      <p className="text-slate-500 mt-2 text-sm sm:text-base">아파트 단지 기반으로 심부름을 올리고, 건당으로 매칭하는 서비스입니다.</p>
      {currentUser?.role === "admin" && (
        <p className="mt-2">
          <a href="/admin" className="text-blue-500 font-semibold hover:underline">운영 대시보드 바로가기 →</a>
        </p>
      )}

      {/* 알림 */}
      {notice && (
        <div
          className={`mt-3 px-3 py-2.5 rounded-xl border text-sm ${
            notice.type === "ok"
              ? "border-green-300 bg-green-50 text-green-800"
              : "border-red-300 bg-red-50 text-red-800"
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* 로그인 / 권한 */}
      <section className="card mt-4">
        <h3 className="font-bold text-base">로그인 / 권한</h3>
        {currentUser ? (
          <div className="mt-3">
            <p className="text-sm">
              현재 로그인: <b>{currentUser.name}</b> ({currentUser.role})
            </p>
            <button disabled={busy} onClick={logout} className="btn-secondary mt-2">로그아웃</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_110px] gap-2.5 mt-3">
            <input
              placeholder="로그인 이름"
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              className="input-field"
            />
            <select value={loginRole} onChange={(e) => setLoginRole(e.target.value as CurrentUser["role"])} className="input-field">
              <option value="requester">의뢰자</option>
              <option value="helper">수행자</option>
              <option value="admin">관리자</option>
            </select>
            <button disabled={busy} onClick={login} className="btn-primary">{busy ? "처리중..." : "로그인"}</button>
          </div>
        )}
      </section>

      {/* 동네 인증 */}
      <section className="card mt-4">
        <h3 className="font-bold text-base">동네 인증</h3>
        {verifiedDongne ? (
          <div className="mt-3 text-green-800 bg-green-50 rounded-lg p-3 border border-green-200">
            <p className="font-medium">인증된 동네: <b>{verifiedDongne}</b></p>
          </div>
        ) : (
          <p className="mt-2 text-slate-500 text-sm">주소/아파트 검색 후 인증코드를 발급받아 동네를 인증하세요.</p>
        )}

        {/* Step 1: 주소 검색 */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2.5 mt-3">
          <input
            placeholder="도로명주소/아파트명 입력 (예: 화봉동, OO아파트)"
            value={addrKeyword}
            onChange={(e) => setAddrKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookupAddress()}
            className="input-field"
          />
          <button disabled={busy} onClick={lookupAddress} className="btn-secondary whitespace-nowrap">
            {busy ? "검색중..." : "주소 검색"}
          </button>
        </div>

        {/* 주소 검색 결과 */}
        {addrItems.length > 0 && (
          <div className="grid gap-2 mt-3">
            {addrItems.map((a, idx) => {
              const label = `${a.siNm} ${a.sggNm} ${a.emdNm} · ${a.bdNm || "건물명없음"}`;
              const isSelected = selectedAddr?.admCd === a.admCd && selectedAddr?.bdNm === a.bdNm;
              return (
                <button
                  key={`${a.admCd}-${idx}`}
                  onClick={() => setSelectedAddr(a)}
                  className={`text-left p-2.5 rounded-lg border text-sm transition-colors ${
                    isSelected ? "bg-blue-50 border-blue-300 font-medium" : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {label}
                  <span className="block text-xs text-slate-400 mt-0.5">{a.roadAddr}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Step 2: 인증코드 발급 */}
        {selectedAddr && !verifiedDongne && (
          <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600 mb-2">
              선택: <b>{selectedAddr.bdNm || selectedAddr.roadAddr}</b>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button disabled={busy} onClick={issueNeighborhoodCode} className="btn-primary">
                {busy ? "발급중..." : "인증코드 발급"}
              </button>
              {demoCode && <span className="text-slate-600 text-sm">데모코드: <b>{demoCode}</b></span>}
            </div>
          </div>
        )}

        {/* Step 3: 인증코드 입력 */}
        {verifyRequestId && !verifiedDongne && (
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2.5 mt-3">
            <input
              placeholder="인증코드 6자리 입력"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verifyNeighborhood()}
              className="input-field"
              maxLength={6}
            />
            <button disabled={busy} onClick={verifyNeighborhood} className="btn-primary whitespace-nowrap">
              {busy ? "확인중..." : "인증 확인"}
            </button>
          </div>
        )}
      </section>

      {/* 네이버 지도 */}
      <section className="card mt-4">
        <h3 className="font-bold text-base">네이버 지도</h3>
        <p className="mt-2 text-slate-500 text-sm">선택한 주소를 지도에서 확인할 수 있어요.</p>
        <div className="mt-3">
          <NaverMap queryAddress={mapQuery} />
        </div>
      </section>

      {/* 운영 요약 & 신뢰 규칙 */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
        <div className="card">
          <h3 className="font-bold text-base">운영 요약</h3>
          <ul className="mt-3 space-y-1.5 text-sm ml-4 list-disc text-slate-700">
            <li>총 의뢰: <b>{errands.length}건</b></li>
            <li>모집중: <b>{openCount}건</b></li>
            <li>완료: <b>{errands.filter((e) => e.status === "done").length}건</b></li>
            <li>패널티 누적: <b>{formatKrw(totalPenalty)}</b></li>
          </ul>
        </div>
        <div className="card">
          <h3 className="font-bold text-base">신뢰 규칙(초안)</h3>
          <ul className="mt-3 space-y-1.5 text-sm ml-4 list-disc text-slate-700">
            <li>건당 보상금 사전 표시 (3,000~100,000원)</li>
            <li>매칭 후 취소 최대 2,000원 패널티</li>
            <li>진행 중 취소 최대 3,000원 패널티</li>
            <li>완료 후 자동 정산 (플랫폼 10%, 수행자 90%)</li>
          </ul>
        </div>
      </section>

      {/* 심부름 의뢰 등록 */}
      <section className="card mt-4">
        <h3 className="font-bold text-base">심부름 의뢰 등록</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
          <input placeholder="제목 (예: 편의점 다녀와주세요)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" maxLength={80} />
          <input
            placeholder="의뢰자 이름"
            value={form.requester}
            readOnly={!!currentUser}
            onChange={(e) => setForm({ ...form, requester: e.target.value })}
            className={`input-field ${currentUser ? "bg-slate-50 text-slate-500" : ""}`}
          />
          <input placeholder="아파트/동" value={form.apartment} onChange={(e) => setForm({ ...form, apartment: e.target.value })} className="input-field" />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
            <option value="convenience">편의점</option>
            <option value="delivery">배달/수령</option>
            <option value="bank">은행</option>
            <option value="admin">행정/번호표</option>
            <option value="etc">기타</option>
          </select>
          <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="input-field">
            <option value="kakaopay">카카오페이</option>
            <option value="naverpay">네이버페이</option>
            <option value="tosspay">토스페이</option>
            <option value="card">카드</option>
          </select>
          <div className="relative">
            <input
              type="number"
              placeholder="건당 보상금"
              value={form.rewardKrw}
              onChange={(e) => setForm({ ...form, rewardKrw: Number(e.target.value) })}
              className="input-field w-full pr-8"
              min={3000}
              max={100000}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">원</span>
          </div>
        </div>
        <textarea
          placeholder="상세 내용 (요청사항, 물품 등을 자세히 적어주세요)"
          value={form.detail}
          onChange={(e) => setForm({ ...form, detail: e.target.value })}
          className="input-field w-full mt-2.5 min-h-[80px] resize-y"
          maxLength={500}
          rows={3}
        />
        {form.detail && (
          <p className="text-xs text-slate-400 text-right mt-1">{form.detail.length}/500</p>
        )}
        <div className="flex gap-2 mt-3 flex-wrap">
          {[3000, 5000, 10000, 15000].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setForm((p) => ({ ...p, rewardKrw: v }))}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                form.rewardKrw === v ? "bg-blue-50 border-blue-300 text-blue-700 font-medium" : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              {formatKrw(v)}
            </button>
          ))}
        </div>
        {form.rewardKrw > 0 && (
          <p className="text-xs text-slate-500 mt-2">
            수행자 지급: <b>{formatKrw(Math.round(form.rewardKrw * 0.9))}</b> / 플랫폼 수수료: <b>{formatKrw(Math.round(form.rewardKrw * 0.1))}</b>
          </p>
        )}
        <button
          disabled={busy || !verifiedRequestId}
          onClick={createErrand}
          className={`btn-primary w-full mt-3 ${!verifiedRequestId ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {busy ? "등록중..." : verifiedRequestId ? "의뢰 등록" : "동네 인증 후 의뢰 등록 가능"}
        </button>
      </section>

      {/* 의뢰 목록 */}
      <section className="card mt-4">
        <h3 className="font-bold text-base">의뢰 목록</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
          <input
            placeholder="수행자 이름 입력 (매칭할 때 사용)"
            value={helperName}
            onChange={(e) => setHelperName(e.target.value)}
            className="input-field"
          />
          <input
            placeholder="제목/아파트/의뢰자 검색"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {(["all", "open", "matched", "in_progress", "done", "cancelled"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                statusFilter === s ? "bg-blue-100 border-blue-300 text-blue-700 font-medium" : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              {s === "all" ? "전체" : statusLabel[s]}
            </button>
          ))}
        </div>

        <div className="grid gap-3 mt-4">
          {filteredErrands.length === 0 && <p className="text-slate-500 text-sm py-4 text-center">조건에 맞는 의뢰가 없습니다.</p>}
          {filteredErrands.map((e) => (
            <div key={e.id} className="border border-slate-200 rounded-xl p-3 sm:p-4 bg-white">
              <div className="flex justify-between items-start gap-2">
                <b className="text-sm sm:text-base leading-snug">{e.title}</b>
                <span className={`shrink-0 text-xs px-2.5 py-0.5 rounded-full border font-medium ${statusColor[e.status]}`}>
                  {statusLabel[e.status]}
                </span>
              </div>
              <p className="text-slate-500 mt-1.5 text-sm">{e.detail || "상세 내용 없음"}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-sm text-slate-600">
                <span>{categoryLabel[e.category]}</span>
                <span>{e.apartment}</span>
                <span className="font-semibold text-slate-800">{formatKrw(e.rewardKrw)}</span>
              </div>
              <p className="text-slate-500 mt-1 text-xs">
                의뢰자: {e.requester}{e.helper ? ` / 수행자: ${e.helper}` : ""}
              </p>
              <p className="text-slate-600 mt-1 text-xs">
                결제: <b>{paymentMethodLabel[e.payment.method]}</b> · <b>{paymentStatusLabel[e.payment.status]}</b>
              </p>
              {e.payment.failedReason && (
                <p className="text-red-700 mt-1 text-xs">결제오류: {e.payment.failedReason}</p>
              )}

              {e.settlement && (
                <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
                  정산: 수행자 <b>{formatKrw(e.settlement.helperPayoutKrw)}</b> / 수수료 <b>{formatKrw(e.settlement.platformFeeKrw)}</b>
                </div>
              )}

              {e.cancellation && (
                <div className="mt-2 p-2.5 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
                  취소: {e.cancellation.reason} · 패널티 <b>{formatKrw(e.cancellation.requesterPenaltyKrw)}</b>
                  {e.cancellation.helperCompensationKrw > 0 ? ` (수행자 보상 ${formatKrw(e.cancellation.helperCompensationKrw)})` : ""}
                </div>
              )}

              <div className="flex gap-2 mt-3 flex-wrap">
                {e.status === "open" && e.payment.status === "pending" && (
                  <button disabled={busy} onClick={() => readyPayment(e)} className="btn-secondary text-sm">결제 준비</button>
                )}
                {e.status === "open" && (e.payment.status === "ready" || e.payment.status === "pending") && (
                  <button disabled={busy} onClick={() => confirmPayment(e)} className="btn-secondary text-sm">결제 완료 처리</button>
                )}
                {e.status === "open" && (
                  <button
                    disabled={busy || e.payment.status !== "paid"}
                    onClick={() => updateErrand(e.id, { status: "matched", helper: helperName || "근처도우미" })}
                    className="btn-secondary text-sm disabled:opacity-50"
                  >
                    매칭
                  </button>
                )}
                {e.status === "matched" && (
                  <button disabled={busy} onClick={() => updateErrand(e.id, { status: "in_progress" })} className="btn-secondary text-sm">진행 시작</button>
                )}
                {e.status === "in_progress" && (
                  <button disabled={busy} onClick={() => completeAndSettle(e)} className="btn-secondary text-sm">완료 처리·정산</button>
                )}
                {e.status !== "done" && e.status !== "cancelled" && (
                  <button
                    disabled={busy}
                    onClick={() => {
                      if (confirm("정말 취소하시겠어요? 상태에 따라 패널티가 적용될 수 있습니다.")) {
                        updateErrand(e.id, { status: "cancelled" });
                      }
                    }}
                    className="btn-danger text-sm"
                  >
                    취소
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <style jsx global>{`
        .card {
          background: rgba(255, 255, 255, 0.76);
          border: 1px solid rgba(255, 255, 255, 0.85);
          border-radius: 16px;
          padding: 14px 16px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
          backdrop-filter: blur(14px);
        }
        .input-field {
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 9px 12px;
          background: #fff;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-field:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
        }
        .btn-primary {
          border: none;
          background: #2563eb;
          color: #fff;
          border-radius: 10px;
          padding: 9px 16px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: background 0.15s;
        }
        .btn-primary:hover:not(:disabled) {
          background: #1d4ed8;
        }
        .btn-primary:disabled {
          cursor: not-allowed;
        }
        .btn-secondary {
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          border-radius: 8px;
          padding: 7px 12px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.15s, border-color 0.15s;
        }
        .btn-secondary:hover:not(:disabled) {
          background: #f1f5f9;
          border-color: #94a3b8;
        }
        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-danger {
          border: 1px solid #fca5a5;
          background: #fef2f2;
          color: #b91c1c;
          border-radius: 8px;
          padding: 7px 12px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.15s;
        }
        .btn-danger:hover:not(:disabled) {
          background: #fee2e2;
        }
        .btn-danger:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </main>
  );
}
