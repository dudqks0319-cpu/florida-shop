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

const categoryLabel = {
  convenience: "편의점",
  delivery: "배달/수령",
  bank: "은행",
  admin: "행정/번호표",
  etc: "기타",
};

const statusLabel = {
  open: "모집중",
  matched: "매칭완료",
  in_progress: "진행중",
  done: "완료",
  cancelled: "취소",
};

export default function Home() {
  const [errands, setErrands] = useState<Errand[]>([]);
  const [form, setForm] = useState({
    title: "",
    detail: "",
    category: "convenience",
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
    const res = await fetch("/api/errands");
    setErrands(await res.json());
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, []);

  const createErrand = async () => {
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

    setForm({ ...form, title: "", detail: "", rewardKrw: 5000 });
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
    const platformFeeKrw = Math.round(e.rewardKrw * 0.1); // 10% 수수료
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
      setNotice({ type: "error", text: "인증요청 ID와 인증코드를 입력해주세요." });
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
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: 40, fontWeight: 800 }}>동네 건당 심부름</h1>
      <p style={{ color: "#64748b", marginTop: 8 }}>아파트 단지 기반으로 심부름을 올리고, 건당으로 매칭하는 MVP입니다.</p>
      {notice && (
        <div
          style={{
            marginTop: 10,
            padding: "10px 12px",
            borderRadius: 10,
            border: `1px solid ${notice.type === "ok" ? "#86efac" : "#fecaca"}`,
            background: notice.type === "ok" ? "#f0fdf4" : "#fef2f2",
            color: notice.type === "ok" ? "#166534" : "#991b1b",
          }}
        >
          {notice.text}
        </div>
      )}

      <section style={{ ...cardStyle, marginTop: 14 }}>
        <h3>동네 인증 (당근 스타일 데모)</h3>
        {verifiedDongne ? (
          <div style={{ marginTop: 10, color: "#166534" }}>
            <p>✅ 인증된 동네: <b>{verifiedDongne}</b></p>
            <p style={{ marginTop: 4, fontSize: 13 }}>인증 ID 연결 완료: <b>{verifiedRequestId}</b></p>
          </div>
        ) : (
          <p style={{ marginTop: 10, color: "#64748b" }}>주소/아파트 검색 후 인증코드를 발급받아 동네를 인증하세요.</p>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 10, marginTop: 10 }}>
          <input
            placeholder="도로명주소/아파트명 입력 (예: 화봉동, 무룡로, OO아파트)"
            value={addrKeyword}
            onChange={(e) => setAddrKeyword(e.target.value)}
            style={inputStyle}
          />
          <button disabled={busy} onClick={lookupAddress} style={secondaryBtn}>{busy ? "처리중..." : "검색"}</button>
        </div>

        {addrItems.length > 0 && (
          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            {addrItems.map((a, idx) => {
              const label = `${a.siNm} ${a.sggNm} ${a.emdNm} · ${a.bdNm || "건물명없음"}`;
              return (
                <button
                  key={`${a.admCd}-${idx}`}
                  onClick={() => setSelectedAddr(a)}
                  style={{
                    ...secondaryBtn,
                    textAlign: "left",
                    background: selectedAddr?.admCd === a.admCd ? "#e0f2fe" : "#fff",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, marginTop: 10 }}>
          <input
            placeholder="인증요청 ID"
            value={verifyRequestId}
            onChange={(e) => setVerifyRequestId(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="인증코드 6자리"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value)}
            style={inputStyle}
          />
          <button disabled={busy} onClick={verifyNeighborhood} style={primaryBtn}>{busy ? "확인중..." : "인증 확인"}</button>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
          <button disabled={busy} onClick={issueNeighborhoodCode} style={secondaryBtn}>{busy ? "발급중..." : "인증코드 발급"}</button>
          {demoCode && <span style={{ color: "#475569" }}>데모코드: <b>{demoCode}</b></span>}
        </div>
      </section>

      <section style={{ ...cardStyle, marginTop: 14 }}>
        <h3>네이버 지도</h3>
        <p style={{ marginTop: 8, color: "#64748b" }}>선택한 주소를 지도에서 확인할 수 있어요.</p>
        <div style={{ marginTop: 10 }}>
          <NaverMap queryAddress={mapQuery} />
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 20 }}>
        <div style={cardStyle}>
          <h3>운영 요약</h3>
          <ul style={{ marginLeft: 18, marginTop: 10 }}>
            <li>총 의뢰: <b>{errands.length}건</b></li>
            <li>모집중: <b>{openCount}건</b></li>
            <li>완료: <b>{errands.filter((e) => e.status === "done").length}건</b></li>
            <li>패널티 누적: <b>{totalPenalty.toLocaleString()}원</b></li>
          </ul>
        </div>
        <div style={cardStyle}>
          <h3>신뢰 규칙(초안)</h3>
          <ul style={{ marginLeft: 18, marginTop: 10 }}>
            <li>건당 보상금 사전 표시 (3,000~100,000원)</li>
            <li>중강도 패널티: 매칭 후 취소 최대 2,000원, 진행 중 취소 최대 3,000원</li>
            <li>완료 확인 후 자동 정산(플랫폼 10%, 수행자 90%)</li>
            <li>파일럿 1개 단지 외 의뢰 등록 제한</li>
          </ul>
        </div>
      </section>

      <section style={{ ...cardStyle, marginTop: 14 }}>
        <h3>심부름 의뢰 등록</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
          <input placeholder="제목(예: 편의점 다녀와주세요)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
          <input placeholder="의뢰자 이름" value={form.requester} onChange={(e) => setForm({ ...form, requester: e.target.value })} style={inputStyle} />
          <input placeholder="아파트/동" value={form.apartment} onChange={(e) => setForm({ ...form, apartment: e.target.value })} style={inputStyle} />
          <input type="number" placeholder="건당 금액" value={form.rewardKrw} onChange={(e) => setForm({ ...form, rewardKrw: Number(e.target.value) })} style={inputStyle} />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle}>
            <option value="convenience">편의점</option>
            <option value="delivery">배달/수령</option>
            <option value="bank">은행</option>
            <option value="admin">행정/번호표</option>
            <option value="etc">기타</option>
          </select>
          <input placeholder="상세 내용" value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} style={inputStyle} />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {[5000, 10000, 15000].map((v) => (
            <button key={v} type="button" onClick={() => setForm((p) => ({ ...p, rewardKrw: v }))} style={secondaryBtn}>
              {v.toLocaleString()}원
            </button>
          ))}
        </div>
        <button disabled={busy} onClick={createErrand} style={{ ...primaryBtn, opacity: verifiedRequestId ? 1 : 0.7 }}>
          {busy ? "등록중..." : verifiedRequestId ? "의뢰 등록" : "동네 인증 후 의뢰 등록"}
        </button>
      </section>

      <section style={{ ...cardStyle, marginTop: 14 }}>
        <h3>의뢰 목록</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
          <input placeholder="수행자 이름 입력(매칭할 때 사용)" value={helperName} onChange={(e) => setHelperName(e.target.value)} style={inputStyle} />
          <input placeholder="제목/아파트/의뢰자 검색" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {(["all", "open", "matched", "in_progress", "done", "cancelled"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{ ...secondaryBtn, background: statusFilter === s ? "#dbeafe" : "#f8fafc" }}
            >
              {s === "all" ? "전체" : statusLabel[s]}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          {filteredErrands.length === 0 && <p>조건에 맞는 의뢰가 없습니다.</p>}
          {filteredErrands.map((e) => (
            <div key={e.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <b>{e.title}</b>
                <span style={badgeStyle}>{statusLabel[e.status]}</span>
              </div>
              <p style={{ color: "#475569", marginTop: 6 }}>{e.detail || "상세 내용 없음"}</p>
              <p style={{ color: "#334155", marginTop: 6 }}>
                {categoryLabel[e.category]} · {e.apartment} · <b>{e.rewardKrw.toLocaleString()}원</b>
              </p>
              <p style={{ color: "#64748b", marginTop: 4 }}>의뢰자: {e.requester}{e.helper ? ` / 수행자: ${e.helper}` : ""}</p>

              {e.settlement && (
                <div style={{ marginTop: 8, padding: 10, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10 }}>
                  <p style={{ margin: 0, color: "#334155" }}>
                    정산: 수행자 <b>{e.settlement.helperPayoutKrw.toLocaleString()}원</b> / 플랫폼 수수료 <b>{e.settlement.platformFeeKrw.toLocaleString()}원</b>
                  </p>
                </div>
              )}

              {e.cancellation && (
                <div style={{ marginTop: 8, padding: 10, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10 }}>
                  <p style={{ margin: 0, color: "#9a3412" }}>
                    취소정책: {e.cancellation.reason} · 패널티 <b>{e.cancellation.requesterPenaltyKrw.toLocaleString()}원</b>
                    {e.cancellation.helperCompensationKrw > 0 ? ` (수행자 보상 ${e.cancellation.helperCompensationKrw.toLocaleString()}원)` : ""}
                  </p>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                {e.status === "open" && (
                  <button disabled={busy} onClick={() => updateErrand(e.id, { status: "matched", helper: helperName || "근처도우미" })} style={secondaryBtn}>매칭</button>
                )}
                {e.status === "matched" && (
                  <button disabled={busy} onClick={() => updateErrand(e.id, { status: "in_progress" })} style={secondaryBtn}>진행 시작</button>
                )}
                {e.status === "in_progress" && (
                  <button disabled={busy} onClick={() => completeAndSettle(e)} style={secondaryBtn}>완료 처리·정산</button>
                )}
                {e.status !== "done" && e.status !== "cancelled" && (
                  <button
                    disabled={busy}
                    onClick={() => {
                      if (confirm("정말 취소하시겠어요? 상태에 따라 패널티가 적용될 수 있습니다.")) {
                        updateErrand(e.id, { status: "cancelled" });
                      }
                    }}
                    style={dangerBtn}
                  >
                    취소
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(255,255,255,0.8)",
  borderRadius: 20,
  padding: 16,
  boxShadow: "0 20px 40px rgba(15,23,42,0.08)",
  backdropFilter: "blur(14px)",
};

const inputStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "10px 12px",
  background: "#fff",
};

const primaryBtn: React.CSSProperties = {
  marginTop: 12,
  border: "1px solid #0a84ff",
  background: "#0a84ff",
  color: "#fff",
  borderRadius: 12,
  padding: "10px 14px",
  cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  borderRadius: 10,
  padding: "8px 12px",
  cursor: "pointer",
};

const dangerBtn: React.CSSProperties = {
  border: "1px solid #ef4444",
  background: "#fff1f2",
  color: "#b91c1c",
  borderRadius: 10,
  padding: "8px 12px",
  cursor: "pointer",
};

const badgeStyle: React.CSSProperties = {
  border: "1px solid #bae6fd",
  background: "#e0f2fe",
  color: "#075985",
  borderRadius: 999,
  padding: "3px 10px",
  fontSize: 12,
};
