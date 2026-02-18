"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CurrentUser = {
  id: string;
  name: string;
  role: "requester" | "helper" | "admin";
};

type DisputeReasonType = "no_show" | "quality" | "fake_proof" | "amount" | "etc";

type Errand = {
  id: string;
  title: string;
  requester: string;
  helper?: string;
  rewardKrw: number;
  status: "open" | "matched" | "in_progress" | "done" | "cancelled";
  dispute?: {
    status: "open" | "resolved";
    reason: string;
    reasonType?: DisputeReasonType;
    detail?: string;
    evidenceNote?: string;
    reporterName: string;
    createdAt: string;
    expectedResolutionHours?: number;
    resolvedAt?: string;
    resolutionNote?: string;
    resolutionStatus?: "done" | "cancelled";
    resolverName?: string;
  };
};

const disputeTypeLabel: Record<DisputeReasonType, string> = {
  no_show: "노쇼/연락두절",
  quality: "요청 품질 불만",
  fake_proof: "허위/부족한 증빙",
  amount: "금액/정산 분쟁",
  etc: "기타",
};

const decisionLabel: Record<"done" | "cancelled", string> = {
  done: "완료 확정",
  cancelled: "취소 확정",
};

function formatKrw(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

function buildResolutionNote(errand: Errand, decision: "done" | "cancelled") {
  const disputeType = errand.dispute?.reasonType ? disputeTypeLabel[errand.dispute.reasonType] : "기타";
  const baseReason = errand.dispute?.reason || "사유 미입력";
  const evidence = errand.dispute?.evidenceNote || "추가 증빙 메모 없음";

  if (decision === "done") {
    return [
      "[관리자 분쟁 처리 안내]",
      `- 분쟁 유형: ${disputeType}`,
      `- 확인 내용: ${baseReason}`,
      `- 증빙 검토: ${evidence}`,
      "- 판단 결과: 수행 완료로 확정합니다.",
      "- 후속 처리: 의뢰를 완료 상태로 전환하고 정산을 진행합니다.",
    ].join("\n");
  }

  return [
    "[관리자 분쟁 처리 안내]",
    `- 분쟁 유형: ${disputeType}`,
    `- 확인 내용: ${baseReason}`,
    `- 증빙 검토: ${evidence}`,
    "- 판단 결과: 거래 취소로 확정합니다.",
    "- 후속 처리: 취소 정책에 따라 패널티/보상 규칙을 반영합니다.",
  ].join("\n");
}

export default function AdminDisputesPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [errands, setErrands] = useState<Errand[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { decision: "done" | "cancelled"; note: string }>>({});

  const openDisputes = useMemo(
    () => errands.filter((e) => e.dispute?.status === "open").sort((a, b) => (a.dispute!.createdAt < b.dispute!.createdAt ? 1 : -1)),
    [errands],
  );

  const recentResolved = useMemo(
    () => errands.filter((e) => e.dispute?.status === "resolved").sort((a, b) => (a.dispute!.resolvedAt || "") < (b.dispute!.resolvedAt || "") ? 1 : -1).slice(0, 6),
    [errands],
  );

  const loadAll = async () => {
    setLoading(true);
    try {
      const [meRes, errandsRes] = await Promise.all([fetch("/api/auth/me"), fetch("/api/errands")]);

      if (meRes.ok) {
        const meJson = await meRes.json();
        setCurrentUser(meJson.user || null);
      } else {
        setCurrentUser(null);
      }

      if (!errandsRes.ok) {
        const json = await errandsRes.json().catch(() => ({}));
        setNotice({ type: "error", text: json.error || "분쟁 목록을 불러오지 못했습니다." });
        setErrands([]);
      } else {
        const list = (await errandsRes.json()) as Errand[];
        setErrands(list);
      }
    } catch {
      setNotice({ type: "error", text: "서버에 연결할 수 없습니다." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!openDisputes.length) return;
    setDrafts((prev) => {
      const next = { ...prev };
      for (const errand of openDisputes) {
        if (!next[errand.id]) {
          next[errand.id] = {
            decision: "done",
            note: buildResolutionNote(errand, "done"),
          };
        }
      }
      return next;
    });
  }, [openDisputes]);

  const regenerateDraft = (errand: Errand) => {
    const decision = drafts[errand.id]?.decision || "done";
    setDrafts((prev) => ({
      ...prev,
      [errand.id]: {
        decision,
        note: buildResolutionNote(errand, decision),
      },
    }));
    setNotice({ type: "ok", text: "안내문 초안을 다시 생성했습니다." });
  };

  const resolveDispute = async (errand: Errand) => {
    const draft = drafts[errand.id];
    if (!draft) return;

    setBusyId(errand.id);
    const res = await fetch(`/api/errands/${errand.id}/dispute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "resolve",
        decision: draft.decision,
        note: draft.note.trim() || undefined,
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setNotice({ type: "error", text: json.error || "분쟁 처리에 실패했습니다." });
      setBusyId(null);
      return;
    }

    setNotice({ type: "ok", text: "분쟁 결과를 반영했습니다." });
    await loadAll();
    setBusyId(null);
  };

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-6">
        <p className="text-sm text-slate-500">분쟁 보드를 불러오는 중입니다...</p>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold">분쟁 처리 보드</h1>
        <p className="text-sm text-slate-600 mt-2">관리자 로그인이 필요합니다.</p>
        <Link href="/login" className="inline-flex mt-3 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold">
          로그인하러 가기
        </Link>
      </main>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <main className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold">분쟁 처리 보드</h1>
        <p className="text-sm text-rose-600 mt-2">관리자 권한이 필요합니다.</p>
        <Link href="/" className="inline-flex mt-3 px-3 py-2 rounded-lg border text-sm font-semibold">
          홈으로 돌아가기
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight">분쟁 처리 보드</h1>
          <p className="text-sm text-slate-500 mt-1">자동 초안을 기반으로 빠르게 검토·확정할 수 있습니다.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin" className="px-3 py-2 rounded-lg border text-sm font-semibold">관리자 홈</Link>
          <button onClick={loadAll} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold">새로고침</button>
        </div>
      </header>

      {notice && (
        <div className={`mt-3 px-3 py-2 rounded-lg border text-sm ${notice.type === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"}`}>
          {notice.text}
        </div>
      )}

      <section className="grid sm:grid-cols-3 gap-3 mt-4">
        <div className="p-3 rounded-xl border bg-white">
          <p className="text-xs text-slate-500">열린 분쟁</p>
          <p className="text-xl font-extrabold mt-1">{openDisputes.length}건</p>
        </div>
        <div className="p-3 rounded-xl border bg-white">
          <p className="text-xs text-slate-500">최근 처리 완료</p>
          <p className="text-xl font-extrabold mt-1">{recentResolved.length}건</p>
        </div>
        <div className="p-3 rounded-xl border bg-white">
          <p className="text-xs text-slate-500">처리 기준 SLA</p>
          <p className="text-xl font-extrabold mt-1">24시간</p>
        </div>
      </section>

      <section className="mt-5 space-y-3">
        {openDisputes.length === 0 && (
          <div className="p-6 rounded-xl border bg-white text-center text-slate-500 text-sm">열려있는 분쟁이 없습니다.</div>
        )}

        {openDisputes.map((e) => {
          const draft = drafts[e.id] || { decision: "done" as const, note: buildResolutionNote(e, "done") };
          return (
            <article key={e.id} className="p-4 rounded-2xl border bg-white shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold">{e.title}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    의뢰자: {e.requester} / 수행자: {e.helper || "미배정"} / 금액: {formatKrw(e.rewardKrw)}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-rose-100 border border-rose-200 text-rose-700 font-semibold">
                  분쟁 진행중
                </span>
              </div>

              <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800">
                <p className="font-semibold">
                  {e.dispute?.reasonType ? disputeTypeLabel[e.dispute.reasonType] : "기타"} · 신고자 {e.dispute?.reporterName}
                </p>
                <p className="mt-1">{e.dispute?.reason}</p>
                {e.dispute?.evidenceNote && <p className="text-xs mt-1">증빙 메모: {e.dispute.evidenceNote}</p>}
                <p className="text-xs mt-1 text-rose-700">
                  접수: {e.dispute?.createdAt ? new Date(e.dispute.createdAt).toLocaleString("ko-KR") : "-"}
                </p>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-[170px_1fr] gap-2">
                <select
                  value={draft.decision}
                  className="border rounded-lg px-3 py-2 text-sm"
                  onChange={(ev) => {
                    const decision = ev.target.value as "done" | "cancelled";
                    setDrafts((prev) => ({
                      ...prev,
                      [e.id]: {
                        decision,
                        note: prev[e.id]?.note || buildResolutionNote(e, decision),
                      },
                    }));
                  }}
                >
                  <option value="done">{decisionLabel.done}</option>
                  <option value="cancelled">{decisionLabel.cancelled}</option>
                </select>

                <button
                  onClick={() => regenerateDraft(e)}
                  className="rounded-lg border px-3 py-2 text-sm font-semibold bg-slate-50 hover:bg-slate-100"
                >
                  자동초안 다시 생성
                </button>
              </div>

              <textarea
                className="mt-2 w-full min-h-[120px] border rounded-lg px-3 py-2 text-sm"
                value={draft.note}
                onChange={(ev) =>
                  setDrafts((prev) => ({
                    ...prev,
                    [e.id]: {
                      decision: prev[e.id]?.decision || "done",
                      note: ev.target.value,
                    },
                  }))
                }
              />

              <div className="mt-2 flex gap-2">
                <button
                  disabled={busyId === e.id}
                  onClick={() => resolveDispute(e)}
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm font-semibold disabled:opacity-60"
                >
                  {busyId === e.id ? "처리중..." : "결과 반영"}
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {recentResolved.length > 0 && (
        <section className="mt-6">
          <h3 className="font-bold text-base">최근 처리 이력</h3>
          <div className="mt-2 space-y-2">
            {recentResolved.map((e) => (
              <div key={e.id} className="rounded-lg border bg-white p-3 text-sm text-slate-700">
                <p className="font-semibold">{e.title}</p>
                <p className="text-xs text-slate-500 mt-1">
                  결과: {e.dispute?.resolutionStatus || "-"} / 처리자: {e.dispute?.resolverName || "-"} / 처리시각: {e.dispute?.resolvedAt ? new Date(e.dispute.resolvedAt).toLocaleString("ko-KR") : "-"}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
