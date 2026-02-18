"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AdminErrand = {
  id: string;
  title: string;
  detail: string;
  rewardKrw: number;
  requester: string;
  helper?: string;
  apartment: string;
  status: "open" | "matched" | "in_progress" | "done" | "cancelled";
  dispute?: {
    status: "open" | "resolved";
    reason: string;
    reasonType?: "no_show" | "quality" | "fake_proof" | "amount" | "etc";
    evidenceNote?: string;
    reporterName: string;
    createdAt: string;
    expectedResolutionHours?: number;
  };
};

type ResolveDraft = {
  decision: "done" | "cancelled";
  note: string;
};

const disputeTypeLabel: Record<"no_show" | "quality" | "fake_proof" | "amount" | "etc", string> = {
  no_show: "노쇼/연락두절",
  quality: "요청 품질 불만",
  fake_proof: "허위/부족한 증빙",
  amount: "금액/정산 분쟁",
  etc: "기타",
};

const recentOrders = [
  { id: "ORD-2026-0217-001", customer: "김**", product: "오버핏 린넨 셔츠", amount: 39900, status: "결제완료", time: "5분 전" },
  { id: "ORD-2026-0217-002", customer: "이**", product: "와이드 데님 팬츠", amount: 49900, status: "배송준비", time: "23분 전" },
  { id: "ORD-2026-0217-003", customer: "박**", product: "크롭 가디건 세트", amount: 67800, status: "배송중", time: "1시간 전" },
];

const topProducts = [
  { name: "오버핏 린넨 셔츠", sales: 156, revenue: 6224400, stock: 23 },
  { name: "와이드 데님 팬츠", sales: 134, revenue: 6686600, stock: 8 },
  { name: "레더 숄더백", sales: 87, revenue: 7743000, stock: 3 },
];

function formatKrw(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

function buildDisputeResolutionDraft(errand: AdminErrand, decision: "done" | "cancelled") {
  const disputeType = errand.dispute?.reasonType ? disputeTypeLabel[errand.dispute.reasonType] : "기타";
  const baseReason = errand.dispute?.reason || "사유 미입력";
  const evidence = errand.dispute?.evidenceNote || "추가 증빙 메모 없음";

  if (decision === "done") {
    return [
      `[관리자 분쟁 처리 안내]`,
      `- 분쟁 유형: ${disputeType}`,
      `- 확인 내용: ${baseReason}`,
      `- 증빙 검토: ${evidence}`,
      `- 판단 결과: 수행 완료로 확정합니다.`,
      `- 후속 처리: 의뢰를 완료 상태로 전환하고 정산을 진행합니다.`,
    ].join("\n");
  }

  return [
    `[관리자 분쟁 처리 안내]`,
    `- 분쟁 유형: ${disputeType}`,
    `- 확인 내용: ${baseReason}`,
    `- 증빙 검토: ${evidence}`,
    `- 판단 결과: 거래 취소로 확정합니다.`,
    `- 후속 처리: 취소 정책에 따라 패널티/보상 규칙을 반영합니다.`,
  ].join("\n");
}

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");
  const [errands, setErrands] = useState<AdminErrand[]>([]);
  const [loadingDisputes, setLoadingDisputes] = useState(false);
  const [resolveDrafts, setResolveDrafts] = useState<Record<string, ResolveDraft>>({});
  const [resolvingId, setResolvingId] = useState("");
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const stats = { totalSales: 2847000, orderCount: 47, visitorCount: 1283, conversionRate: 3.66 };

  const openDisputes = useMemo(
    () => errands.filter((e) => e.dispute?.status === "open").sort((a, b) => (a.dispute!.createdAt < b.dispute!.createdAt ? 1 : -1)),
    [errands],
  );

  const fetchErrands = async () => {
    setLoadingDisputes(true);
    try {
      const res = await fetch("/api/errands");
      const json = await res.json();
      if (!res.ok || !Array.isArray(json)) {
        setNotice({ type: "error", text: (json?.error as string) || "분쟁 목록을 불러오지 못했습니다." });
        setLoadingDisputes(false);
        return;
      }
      setErrands(json as AdminErrand[]);
    } catch {
      setNotice({ type: "error", text: "분쟁 목록 조회 중 네트워크 오류가 발생했습니다." });
    }
    setLoadingDisputes(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchErrands();
  }, []);

  const resolveDispute = async (errand: AdminErrand) => {
    const draft =
      resolveDrafts[errand.id] ||
      ({
        decision: "done" as const,
        note: buildDisputeResolutionDraft(errand, "done"),
      } satisfies ResolveDraft);

    if (!draft.note.trim()) {
      setNotice({ type: "error", text: "해결 메모를 입력해주세요." });
      return;
    }

    setResolvingId(errand.id);
    const res = await fetch(`/api/errands/${errand.id}/dispute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resolve", decision: draft.decision, note: draft.note.trim() }),
    });
    const json = await res.json();
    if (!res.ok) {
      setNotice({ type: "error", text: json.error || "분쟁 해결 처리 실패" });
      setResolvingId("");
      return;
    }

    setNotice({ type: "ok", text: "분쟁 처리 결과가 반영되었습니다." });
    await fetchErrands();
    setResolvingId("");
  };

  return (
    <main className="max-w-6xl mx-auto p-4 pb-16">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black">FLORIDA ADMIN</h1>
          <p className="text-sm text-slate-500">관리자 대시보드</p>
        </div>
        <div className="flex gap-2 text-sm flex-wrap justify-end">
          <Link href="/" className="px-3 py-2 border rounded-lg">동네심부름 홈</Link>
          <Link href="/admin/disputes" className="px-3 py-2 border rounded-lg">분쟁 전용 보드</Link>
          <Link href="/admin/products" className="px-3 py-2 border rounded-lg">상품 관리</Link>
          <Link href="/admin/products/new" className="px-3 py-2 bg-[#FF6B35] text-white rounded-lg">상품 등록</Link>
        </div>
      </header>

      {notice && (
        <div
          className={`mt-3 px-3 py-2.5 rounded-xl border text-sm ${
            notice.type === "ok" ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-rose-300 bg-rose-50 text-rose-800"
          }`}
        >
          {notice.text}
        </div>
      )}

      <section className="mt-4 flex gap-2">
        {(["today", "week", "month"] as const).map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg border text-sm ${period === p ? "bg-[#FF6B35] text-white" : "bg-white"}`}>
            {p === "today" ? "오늘" : p === "week" ? "이번 주" : "이번 달"}
          </button>
        ))}
      </section>

      <section className="grid md:grid-cols-4 gap-3 mt-4">
        <div className="p-4 border rounded-xl bg-white"><p className="text-xs text-slate-500">총 매출</p><p className="text-xl font-bold mt-1">{stats.totalSales.toLocaleString("ko-KR")}원</p></div>
        <div className="p-4 border rounded-xl bg-white"><p className="text-xs text-slate-500">주문 수</p><p className="text-xl font-bold mt-1">{stats.orderCount}건</p></div>
        <div className="p-4 border rounded-xl bg-white"><p className="text-xs text-slate-500">방문자</p><p className="text-xl font-bold mt-1">{stats.visitorCount.toLocaleString("ko-KR")}명</p></div>
        <div className="p-4 border rounded-xl bg-white"><p className="text-xs text-slate-500">전환율</p><p className="text-xl font-bold mt-1">{stats.conversionRate}%</p></div>
      </section>

      <section className="p-4 border rounded-xl bg-white mt-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="font-bold">동네심부름 분쟁 처리 보드</h2>
            <p className="text-xs text-slate-500 mt-1">자동초안 생성 → 메모 수정 → 완료/취소 확정</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full border border-rose-200 bg-rose-50 text-rose-700">
              열림 {openDisputes.length}건
            </span>
            <button onClick={() => void fetchErrands()} className="px-3 py-1.5 rounded-lg border text-sm bg-slate-50 hover:bg-slate-100" disabled={loadingDisputes || Boolean(resolvingId)}>
              새로고침
            </button>
          </div>
        </div>

        {loadingDisputes ? (
          <p className="text-sm text-slate-500 mt-3">분쟁 목록을 불러오는 중...</p>
        ) : openDisputes.length === 0 ? (
          <p className="text-sm text-slate-500 mt-3">현재 처리 대기 중인 분쟁이 없습니다.</p>
        ) : (
          <div className="grid gap-3 mt-3">
            {openDisputes.map((e) => {
              const decision = resolveDrafts[e.id]?.decision || "done";
              const note = resolveDrafts[e.id]?.note || buildDisputeResolutionDraft(e, decision);
              const disputeType = e.dispute?.reasonType ? disputeTypeLabel[e.dispute.reasonType] : "기타";
              const isBusy = resolvingId === e.id;

              return (
                <div key={e.id} className="border rounded-lg p-3 bg-slate-50">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-semibold">{e.title}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        의뢰자 {e.requester} · 수행자 {e.helper || "미정"} · {e.apartment} · {formatKrw(e.rewardKrw)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        분쟁유형 {disputeType} · 등록자 {e.dispute?.reporterName} · {e.dispute ? new Date(e.dispute.createdAt).toLocaleString("ko-KR") : "-"}
                      </p>
                    </div>
                    <span className="text-[11px] px-2 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-700">
                      ETA {e.dispute?.expectedResolutionHours || 24}시간
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 mt-2">사유: {e.dispute?.reason || "-"}</p>
                  {e.dispute?.evidenceNote && <p className="text-xs text-slate-500 mt-1">증빙 메모: {e.dispute.evidenceNote}</p>}

                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-[170px_1fr] gap-2">
                    <select
                      className="border rounded-lg px-3 py-2 text-sm"
                      value={decision}
                      onChange={(ev) => {
                        const nextDecision = ev.target.value as "done" | "cancelled";
                        setResolveDrafts((prev) => ({
                          ...prev,
                          [e.id]: {
                            decision: nextDecision,
                            note: prev[e.id]?.note || buildDisputeResolutionDraft(e, nextDecision),
                          },
                        }));
                      }}
                    >
                      <option value="done">완료 확정</option>
                      <option value="cancelled">취소 확정</option>
                    </select>

                    <button
                      className="px-3 py-2 rounded-lg border text-sm bg-white hover:bg-slate-100"
                      disabled={isBusy}
                      onClick={() =>
                        setResolveDrafts((prev) => ({
                          ...prev,
                          [e.id]: {
                            decision,
                            note: buildDisputeResolutionDraft(e, decision),
                          },
                        }))
                      }
                    >
                      자동초안 다시 생성
                    </button>
                  </div>

                  <textarea
                    className="mt-2 w-full border rounded-lg px-3 py-2 text-sm min-h-[110px]"
                    value={note}
                    onChange={(ev) =>
                      setResolveDrafts((prev) => ({
                        ...prev,
                        [e.id]: {
                          decision,
                          note: ev.target.value,
                        },
                      }))
                    }
                  />

                  <div className="mt-2 flex gap-2 flex-wrap">
                    <button
                      disabled={isBusy}
                      onClick={() => void resolveDispute(e)}
                      className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
                    >
                      {isBusy ? "처리 중..." : "결과 반영"}
                    </button>
                    <button
                      disabled={isBusy}
                      onClick={() =>
                        setResolveDrafts((prev) => ({
                          ...prev,
                          [e.id]: {
                            decision: "cancelled",
                            note: buildDisputeResolutionDraft(e, "cancelled"),
                          },
                        }))
                      }
                      className="px-3 py-2 rounded-lg border text-sm bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 disabled:opacity-60"
                    >
                      취소안으로 전환
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid md:grid-cols-2 gap-3 mt-4">
        <div className="p-4 border rounded-xl bg-white">
          <h2 className="font-bold">최근 주문</h2>
          <div className="mt-2 space-y-2 text-sm">
            {recentOrders.map((o) => (
              <div key={o.id} className="p-2 border rounded-lg flex items-center justify-between">
                <div><p className="font-semibold">{o.product}</p><p className="text-xs text-slate-500">{o.id} · {o.customer} · {o.time}</p></div>
                <div className="text-right"><p className="font-semibold">{o.amount.toLocaleString("ko-KR")}원</p><p className="text-xs text-slate-500">{o.status}</p></div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border rounded-xl bg-white">
          <h2 className="font-bold">인기 상품 TOP</h2>
          <div className="mt-2 space-y-2 text-sm">
            {topProducts.map((p, i) => (
              <div key={p.name} className="p-2 border rounded-lg flex items-center justify-between">
                <div><p className="font-semibold">{i + 1}. {p.name}</p><p className="text-xs text-slate-500">{p.sales}개 판매</p></div>
                <div className="text-right"><p>{p.revenue.toLocaleString("ko-KR")}원</p><p className={`text-xs ${p.stock < 10 ? "text-red-500" : "text-slate-500"}`}>재고 {p.stock}개</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
