"use client";

import Link from "next/link";
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
  email?: string;
  provider?: "email" | "kakao" | "google" | "naver";
  apartment?: string;
  dong?: string;
  address?: string;
  neighborhoodVerifiedAt?: string;
};

type Errand = {
  id: string;
  title: string;
  detail: string;
  category: "convenience" | "delivery" | "bank" | "admin" | "etc";
  rewardKrw: number;
  requester: string;
  requesterId?: string;
  apartment: string;
  status: "open" | "matched" | "in_progress" | "done" | "cancelled";
  helper?: string;
  helperId?: string;
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
  proof?: {
    note?: string;
    imageUrl?: string;
    uploadedAt: string;
    helperId: string;
    helperName: string;
  };
  dispute?: {
    status: "open" | "resolved";
    reason: string;
    reasonType?: "no_show" | "quality" | "fake_proof" | "amount" | "etc";
    detail?: string;
    evidenceNote?: string;
    expectedResolutionHours?: number;
    reporterId: string;
    reporterName: string;
    createdAt: string;
    resolvedAt?: string;
    resolverName?: string;
    resolutionNote?: string;
    resolutionStatus?: "done" | "cancelled";
  };
  reviews?: Array<{
    id: string;
    reviewerId: string;
    reviewerName: string;
    targetRole: "requester" | "helper";
    rating: number;
    comment?: string;
    createdAt: string;
  }>;
  approvedAt?: string;
  approvedByName?: string;
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

const disputeTypeLabel: Record<"no_show" | "quality" | "fake_proof" | "amount" | "etc", string> = {
  no_show: "노쇼/연락두절",
  quality: "요청 품질 불만",
  fake_proof: "허위/부족한 증빙",
  amount: "금액/정산 분쟁",
  etc: "기타",
};

function formatKrw(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

function isRequesterOwnerForUser(e: Errand, user: CurrentUser | null) {
  if (!user) return false;
  return e.requesterId ? e.requesterId === user.id : e.requester === user.name;
}

function isAssignedHelperForUser(e: Errand, user: CurrentUser | null) {
  if (!user) return false;
  return e.helperId ? e.helperId === user.id : e.helper === user.name;
}

export default function Home() {
  const [errands, setErrands] = useState<Errand[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [form, setForm] = useState({
    title: "",
    detail: "",
    category: "convenience",
    paymentMethod: "kakaopay",
    rewardKrw: 5000,
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
  const [scopeFilter, setScopeFilter] = useState<"all" | "mine_requester" | "mine_helper">("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [proofNotes, setProofNotes] = useState<Record<string, string>>({});
  const [proofFiles, setProofFiles] = useState<Record<string, File | null>>({});
  const [verifyRemainSec, setVerifyRemainSec] = useState(0);
  const [resendCooldownSec, setResendCooldownSec] = useState(0);
  const [verificationGuide, setVerificationGuide] = useState("");
  const [disputeFormOpen, setDisputeFormOpen] = useState<Record<string, boolean>>({});
  const [disputeDrafts, setDisputeDrafts] = useState<
    Record<string, { reasonType: "no_show" | "quality" | "fake_proof" | "amount" | "etc"; detail: string; evidenceNote: string }>
  >({});
  const [reviewFormOpen, setReviewFormOpen] = useState<Record<string, boolean>>({});
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, { rating: number; comment: string }>>({});

  const openCount = useMemo(() => errands.filter((e) => e.status === "open").length, [errands]);
  const doneCount = useMemo(() => errands.filter((e) => e.status === "done").length, [errands]);
  const openDisputeCount = useMemo(() => errands.filter((e) => e.dispute?.status === "open").length, [errands]);
  const totalPenalty = useMemo(() => errands.reduce((sum, e) => sum + (e.cancellation?.requesterPenaltyKrw ?? 0), 0), [errands]);
  const settledAmount = useMemo(
    () => errands.reduce((sum, e) => sum + (e.settlement?.status === "paid" ? e.settlement.helperPayoutKrw : 0), 0),
    [errands],
  );
  const isNeighborhoodVerified = Boolean(verifiedRequestId || currentUser?.neighborhoodVerifiedAt);

  const myPendingPaymentCount = useMemo(
    () => errands.filter((e) => isRequesterOwnerForUser(e, currentUser) && e.status === "open" && e.payment.status === "pending").length,
    [currentUser, errands],
  );

  const myApprovalWaitingCount = useMemo(
    () => errands.filter((e) => isRequesterOwnerForUser(e, currentUser) && e.status === "in_progress" && Boolean(e.proof)).length,
    [currentUser, errands],
  );

  const myActiveHelperCount = useMemo(
    () => errands.filter((e) => isAssignedHelperForUser(e, currentUser) && ["matched", "in_progress"].includes(e.status)).length,
    [currentUser, errands],
  );

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

      const byScope =
        scopeFilter === "all"
          ? true
          : scopeFilter === "mine_requester"
            ? isRequesterOwnerForUser(e, currentUser)
            : isAssignedHelperForUser(e, currentUser);

      return byStatus && byKeyword && byScope;
    });
  }, [currentUser, errands, scopeFilter, statusFilter, searchKeyword]);

  const trustByUser = useMemo(() => {
    const stats = new Map<
      string,
      {
        name: string;
        done: number;
        cancelled: number;
        finalCount: number;
        reviewSum: number;
        reviewCount: number;
      }
    >();

    const ensure = (idOrName: string, name: string) => {
      const key = idOrName || name;
      if (!stats.has(key)) {
        stats.set(key, { name, done: 0, cancelled: 0, finalCount: 0, reviewSum: 0, reviewCount: 0 });
      }
      return stats.get(key)!;
    };

    for (const e of errands) {
      const requesterKey = e.requesterId || e.requester;
      const requester = ensure(requesterKey, e.requester);

      if (e.status === "done" || e.status === "cancelled") requester.finalCount += 1;
      if (e.status === "done") requester.done += 1;
      if (e.status === "cancelled") requester.cancelled += 1;

      if (e.helper) {
        const helperKey = e.helperId || e.helper;
        const helper = ensure(helperKey, e.helper);
        if (e.status === "done" || e.status === "cancelled") helper.finalCount += 1;
        if (e.status === "done") helper.done += 1;
        if (e.status === "cancelled") helper.cancelled += 1;
      }

      for (const r of e.reviews || []) {
        if (r.targetRole === "requester") {
          const target = ensure(requesterKey, e.requester);
          target.reviewSum += r.rating;
          target.reviewCount += 1;
        } else if (r.targetRole === "helper" && e.helper) {
          const helperKey = e.helperId || e.helper;
          const target = ensure(helperKey, e.helper);
          target.reviewSum += r.rating;
          target.reviewCount += 1;
        }
      }
    }

    const result = new Map<
      string,
      {
        name: string;
        temp: number;
        face: string;
        badge: string;
        completionRate: number;
        cancelRate: number;
        avgRating: number;
        reviewCount: number;
        finalCount: number;
      }
    >();

    for (const [key, s] of stats.entries()) {
      const avgRating = s.reviewCount ? s.reviewSum / s.reviewCount : 4.3;
      const completionRate = s.finalCount ? Math.round((s.done / s.finalCount) * 100) : 100;
      const cancelRate = s.finalCount ? Math.round((s.cancelled / s.finalCount) * 100) : 0;

      let temp = 36.5 + s.done * 0.8 - s.cancelled * 1.1 + (avgRating - 3) * 2.2;
      temp = Math.min(99, Math.max(15, Number(temp.toFixed(1))));

      const face = temp >= 42 ? "😄" : temp >= 37 ? "🙂" : temp >= 30 ? "😐" : "😟";
      const badge =
        s.finalCount >= 5 && completionRate >= 90 && avgRating >= 4.7
          ? "슈퍼신뢰"
          : s.finalCount >= 3 && completionRate >= 80 && avgRating >= 4.3
            ? "신뢰양호"
            : "검토필요";

      result.set(key, {
        name: s.name,
        temp,
        face,
        badge,
        completionRate,
        cancelRate,
        avgRating: Number(avgRating.toFixed(1)),
        reviewCount: s.reviewCount,
        finalCount: s.finalCount,
      });
    }

    return result;
  }, [errands]);

  const getTrust = (id?: string, name?: string) => {
    const key = id || name || "";
    if (!key) return null;
    return trustByUser.get(key) || null;
  };

  const nextActionMessage = useMemo(() => {
    if (!currentUser) {
      return "로그인 후 동네 인증을 완료하면 바로 의뢰 등록/매칭이 가능합니다.";
    }

    if ((currentUser.role === "requester" || currentUser.role === "admin") && !isNeighborhoodVerified) {
      return "먼저 동네 인증을 완료해주세요. 인증 후 바로 의뢰를 올릴 수 있어요.";
    }

    const myRequesterErrands = errands.filter((e) => isRequesterOwnerForUser(e, currentUser));
    const myHelperErrands = errands.filter((e) => isAssignedHelperForUser(e, currentUser));

    const needPayment = myRequesterErrands.find((e) => e.status === "open" && e.payment.status === "pending");
    if (needPayment) {
      return `“${needPayment.title}” 건은 결제 준비/확정이 필요합니다.`;
    }

    const needApproval = myRequesterErrands.find((e) => e.status === "in_progress" && Boolean(e.proof));
    if (needApproval) {
      return `“${needApproval.title}” 건은 완료 증빙 확인 후 승인하면 정산이 끝납니다.`;
    }

    const needProof = myHelperErrands.find((e) => e.status === "in_progress" && !e.proof);
    if (needProof) {
      return `“${needProof.title}” 건은 증빙 업로드를 완료하면 승인 대기로 넘어갑니다.`;
    }

    const matchable = errands.filter((e) => e.status === "open" && e.payment.status === "paid" && !e.helper).length;
    if (currentUser.role === "helper" && matchable > 0) {
      return `지금 매칭 가능한 의뢰가 ${matchable}건 있습니다.`;
    }

    if (openDisputeCount > 0 && currentUser.role === "admin") {
      return `처리 대기 중인 분쟁이 ${openDisputeCount}건 있습니다.`;
    }

    return "진행 중인 액션은 없습니다. 새 의뢰를 등록하거나 모집중 건을 확인해보세요.";
  }, [currentUser, errands, isNeighborhoodVerified, openDisputeCount]);

  const isRequesterOwner = (e: Errand) => isRequesterOwnerForUser(e, currentUser);

  const isAssignedHelper = (e: Errand) => isAssignedHelperForUser(e, currentUser);

  const getPaymentFlowLabel = (e: Errand) => {
    if (e.status === "cancelled") return "거래가 취소되어 결제 보관/정산이 종료되었습니다.";
    if (e.payment.status === "paid") return "결제 보관중 → 매칭 → 수행증빙 → 승인 시 정산";
    if (e.payment.status === "ready") return "결제창 준비됨 → 결제 확정 필요";
    if (e.payment.status === "failed") return "결제 실패 (사유 확인 후 재시도)";
    return "결제 준비 전";
  };

  const getEscrowSteps = (e: Errand) => {
    const steps = [
      { key: "paid", label: "결제 보관" },
      { key: "matched", label: "매칭" },
      { key: "progress", label: "수행중" },
      { key: "proof", label: "증빙" },
      { key: "settled", label: "정산완료" },
    ] as const;

    const done = {
      paid: e.payment.status === "paid",
      matched: ["matched", "in_progress", "done"].includes(e.status),
      progress: ["in_progress", "done"].includes(e.status),
      proof: Boolean(e.proof) || e.status === "done",
      settled: Boolean(e.settlement) && e.status === "done",
    };

    return steps.map((s) => ({ ...s, done: done[s.key] }));
  };

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
        setForm((prev) => ({
          ...prev,
          apartment: json.user.apartment || prev.apartment,
        }));
      }
      if (json.user?.neighborhoodVerifiedAt && json.user?.dong) {
        setVerifiedDongne(json.user.dong);
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

  useEffect(() => {
    const timer = window.setInterval(() => {
      refresh();
    }, 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (resendCooldownSec <= 0 && verifyRemainSec <= 0) return;
    const t = window.setTimeout(() => {
      setResendCooldownSec((v) => Math.max(0, v - 1));
      setVerifyRemainSec((v) => Math.max(0, v - 1));
    }, 1000);
    return () => window.clearTimeout(t);
  }, [resendCooldownSec, verifyRemainSec]);

  // 레거시 이름 로그인은 보안상 제거되었습니다.

  const logout = async () => {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    const isOAuthUser = currentUser?.provider && ["kakao", "google", "naver"].includes(currentUser.provider);
    if (isOAuthUser) {
      window.location.href = "/api/auth/signout?callbackUrl=/";
      return;
    }
    setCurrentUser(null);
    setScopeFilter("all");
    setVerifiedDongne("");
    setVerifiedRequestId("");
    setVerifyRequestId("");
    setNotice({ type: "ok", text: "로그아웃 되었습니다." });
    setBusy(false);
  };

  const createErrand = async () => {
    if (!currentUser) {
      setNotice({ type: "error", text: "로그인 후 의뢰 등록이 가능합니다." });
      return;
    }
    if (!form.title || !form.apartment) {
      setNotice({ type: "error", text: "제목/아파트를 모두 입력해주세요." });
      return;
    }
    if (!isNeighborhoodVerified) {
      setNotice({ type: "error", text: "동네 인증 완료 후 의뢰를 등록할 수 있어요." });
      return;
    }

    setBusy(true);
    const res = await fetch("/api/errands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, verificationRequestId: verifiedRequestId || undefined }),
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

  // 완료/정산은 "증빙 업로드 → 의뢰자 승인" 흐름으로 처리합니다.

  const readyPayment = async (e: Errand) => {
    const platformFee = Math.round(e.rewardKrw * 0.1);
    const helperPayout = e.rewardKrw - platformFee;

    const agreed = window.confirm(
      `총 결제금액 ${formatKrw(e.rewardKrw)}\n` +
        `- 수행자 수령 예정 ${formatKrw(helperPayout)}\n` +
        `- 플랫폼 수수료 ${formatKrw(platformFee)}\n\n` +
        `결제금은 완료 승인 전까지 안전 보관(에스크로)됩니다.\n결제 준비를 진행할까요?`,
    );
    if (!agreed) return;

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
    const paymentKey = window.prompt(
      "live 모드라면 결제 승인 후 받은 paymentKey를 입력해주세요.\n(mock 모드면 비워둬도 됩니다.)",
      "",
    );

    const res = await fetch(`/api/payments/${e.id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentKey: paymentKey || undefined }),
    });
    const json = await res.json();
    if (!res.ok) {
      setNotice({ type: "error", text: json.error || "결제 완료 처리 실패" });
      setBusy(false);
      return;
    }
    setNotice({ type: "ok", text: json.message || "결제 완료 처리되었습니다." });
    await refresh();
    setBusy(false);
  };

  const uploadProof = async (e: Errand) => {
    const note = (proofNotes[e.id] || "").trim();
    const file = proofFiles[e.id];

    if (!note && !file) {
      setNotice({ type: "error", text: "증빙 메모 또는 이미지를 입력해주세요." });
      return;
    }

    setBusy(true);

    const formData = new FormData();
    if (note) formData.set("note", note);
    if (file) formData.set("file", file);

    const res = await fetch(`/api/errands/${e.id}/proof`, {
      method: "POST",
      body: formData,
    });
    const json = await res.json();

    if (!res.ok) {
      setNotice({ type: "error", text: json.error || "증빙 업로드 실패" });
      setBusy(false);
      return;
    }

    setProofNotes((prev) => ({ ...prev, [e.id]: "" }));
    setProofFiles((prev) => ({ ...prev, [e.id]: null }));
    setNotice({ type: "ok", text: "완료 증빙이 업로드되었습니다." });
    await refresh();
    setBusy(false);
  };

  const approveCompletion = async (e: Errand) => {
    setBusy(true);
    const res = await fetch(`/api/errands/${e.id}/approve`, { method: "POST" });
    const json = await res.json();
    if (!res.ok) {
      setNotice({ type: "error", text: json.error || "완료 승인 실패" });
      setBusy(false);
      return;
    }
    setNotice({ type: "ok", text: "완료 승인 및 정산이 처리되었습니다." });
    await refresh();
    setBusy(false);
  };

  const openDisputeForm = (e: Errand) => {
    setDisputeFormOpen((prev) => ({ ...prev, [e.id]: true }));
    setDisputeDrafts((prev) => ({
      ...prev,
      [e.id]:
        prev[e.id] ||
        {
          reasonType: "quality",
          detail: "",
          evidenceNote: "",
        },
    }));
  };

  const submitDispute = async (e: Errand) => {
    const draft = disputeDrafts[e.id];
    if (!draft || draft.detail.trim().length < 5) {
      setNotice({ type: "error", text: "이의제기 상세 사유를 5자 이상 입력해주세요." });
      return;
    }

    setBusy(true);
    const res = await fetch(`/api/errands/${e.id}/dispute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reasonType: draft.reasonType,
        detail: draft.detail.trim(),
        evidenceNote: draft.evidenceNote.trim(),
        reason: `[${disputeTypeLabel[draft.reasonType]}] ${draft.detail.trim()}`,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setNotice({ type: "error", text: json.error || "이의제기 등록 실패" });
      setBusy(false);
      return;
    }
    setDisputeFormOpen((prev) => ({ ...prev, [e.id]: false }));
    setNotice({ type: "ok", text: "이의제기가 등록되었습니다. 평균 24시간 내 1차 답변을 드립니다." });
    await refresh();
    setBusy(false);
  };

  const resolveDispute = async (e: Errand, decision: "done" | "cancelled") => {
    const note = window.prompt(`분쟁 ${decision === "done" ? "완료확정" : "취소확정"} 메모를 입력해주세요.`, "");

    setBusy(true);
    const res = await fetch(`/api/errands/${e.id}/dispute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resolve", decision, note }),
    });
    const json = await res.json();
    if (!res.ok) {
      setNotice({ type: "error", text: json.error || "분쟁 해결 실패" });
      setBusy(false);
      return;
    }
    setNotice({ type: "ok", text: "분쟁이 해결되었습니다." });
    await refresh();
    setBusy(false);
  };

  const openReviewForm = (e: Errand) => {
    setReviewFormOpen((prev) => ({ ...prev, [e.id]: true }));
    setReviewDrafts((prev) => ({
      ...prev,
      [e.id]: prev[e.id] || { rating: 5, comment: "" },
    }));
  };

  const submitReview = async (e: Errand) => {
    const draft = reviewDrafts[e.id];
    if (!draft || !Number.isInteger(draft.rating) || draft.rating < 1 || draft.rating > 5) {
      setNotice({ type: "error", text: "평점은 1~5점 정수여야 합니다." });
      return;
    }

    setBusy(true);
    const res = await fetch(`/api/errands/${e.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: draft.rating, comment: draft.comment.trim() }),
    });
    const json = await res.json();
    if (!res.ok) {
      setNotice({ type: "error", text: json.error || "리뷰 등록 실패" });
      setBusy(false);
      return;
    }
    setReviewFormOpen((prev) => ({ ...prev, [e.id]: false }));
    setNotice({ type: "ok", text: "리뷰가 등록되었습니다." });
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
    if (!currentUser) {
      setNotice({ type: "error", text: "로그인 후 동네 인증이 가능합니다." });
      return;
    }
    if (!currentUser.apartment || !currentUser.dong) {
      setNotice({ type: "error", text: "회원가입 페이지에서 주소지(아파트/동)를 먼저 등록해주세요." });
      return;
    }

    setForm((prev) => ({ ...prev, apartment: currentUser.apartment || prev.apartment }));
    setBusy(true);
    const res = await fetch("/api/neighborhood/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();
    if (!res.ok) {
      setVerificationGuide(String(json.guide || ""));
      setNotice({ type: "error", text: json.error || "인증코드 발급 실패" });
      setBusy(false);
      return;
    }

    setVerifyRequestId(json.requestId);
    const expiresAt = String(json.expiresAt || "");
    setVerifyRemainSec(expiresAt ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)) : 0);
    setResendCooldownSec(60);
    setVerificationGuide(String(json.guide || ""));
    setDemoCode(json.demoCode || "");
    setNotice({
      type: "ok",
      text: json.demoCode
        ? `인증코드 발급 완료 (테스트코드: ${json.demoCode})`
        : "인증코드 발급 완료. 등록한 휴대폰 문자에서 코드를 확인해주세요.",
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
    setResendCooldownSec(0);
    setVerifyRemainSec(0);
    await fetchMe();
    setNotice({ type: "ok", text: "동네 인증 완료! 이제 의뢰 등록이 가능합니다." });
    setBusy(false);
  };

  return (
    <main className="app-shell max-w-[1120px] mx-auto px-4 sm:px-6 py-6 pb-16">
      <div className="app-bg-orb app-bg-orb-top" />
      <div className="app-bg-orb app-bg-orb-bottom" />

      <section className="hero-card">
        <div className="hero-card__header">
          <div>
            <p className="hero-badge">동네 기반 안심 심부름</p>
            <h1 className="text-3xl sm:text-[40px] font-extrabold tracking-tight text-slate-900">동네 건당 심부름</h1>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">
              결제 보관부터 증빙·승인·분쟁까지, 소비자 보호 흐름을 기본으로 설계했습니다.
            </p>
          </div>

          <div className="hero-sidecard">
            <p className="text-xs font-semibold text-slate-500">지금 할 일</p>
            <p className="text-sm text-slate-700 mt-1 leading-relaxed">{nextActionMessage}</p>
            {currentUser?.role === "admin" && (
              <a href="/admin" className="hero-admin-link">운영 대시보드 바로가기 →</a>
            )}
          </div>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <p className="hero-stat__label">총 의뢰</p>
            <p className="hero-stat__value">{errands.length}건</p>
          </div>
          <div className="hero-stat">
            <p className="hero-stat__label">완료</p>
            <p className="hero-stat__value">{doneCount}건</p>
          </div>
          <div className="hero-stat">
            <p className="hero-stat__label">정산 완료액</p>
            <p className="hero-stat__value">{formatKrw(settledAmount)}</p>
          </div>
          <div className="hero-stat">
            <p className="hero-stat__label">열린 분쟁</p>
            <p className="hero-stat__value">{openDisputeCount}건</p>
          </div>
        </div>
      </section>

      {/* 알림 */}
      {notice && (
        <div
          className={`mt-4 px-3.5 py-3 rounded-2xl border text-sm shadow-sm ${
            notice.type === "ok"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-rose-300 bg-rose-50 text-rose-800"
          }`}
        >
          {notice.text}
        </div>
      )}

      <section className="card quick-action-card mt-5">
        <h3 className="section-title">토스 스타일 빠른 진행</h3>
        <p className="text-xs text-slate-500 mt-1">지금 바로 필요한 액션만 한 번에 확인하세요.</p>
        <div className="quick-action-grid mt-3">
          <a href="#verify-section" className="quick-action-item">
            <p className="quick-action-item__label">동네 인증</p>
            <p className="quick-action-item__value">{isNeighborhoodVerified ? "완료" : "필요"}</p>
            <p className="quick-action-item__hint">의뢰 등록 전에 주소 인증을 확인해주세요.</p>
          </a>
          <a href="#list-section" className="quick-action-item">
            <p className="quick-action-item__label">내 결제 대기</p>
            <p className="quick-action-item__value">{myPendingPaymentCount}건</p>
            <p className="quick-action-item__hint">결제 확정 전에는 매칭이 시작되지 않습니다.</p>
          </a>
          <a href="#list-section" className="quick-action-item">
            <p className="quick-action-item__label">내 승인 대기</p>
            <p className="quick-action-item__value">{myApprovalWaitingCount}건</p>
            <p className="quick-action-item__hint">증빙 확인 후 승인하면 정산이 완료됩니다.</p>
          </a>
          <a href="#list-section" className="quick-action-item">
            <p className="quick-action-item__label">내 수행 진행</p>
            <p className="quick-action-item__value">{myActiveHelperCount}건</p>
            <p className="quick-action-item__hint">진행중이면 증빙 업로드까지 완료해주세요.</p>
          </a>
        </div>
      </section>

      {/* 로그인 / 권한 */}
      <section id="auth-section" className="card mt-5">
        <h3 className="section-title">로그인 / 권한</h3>
        {currentUser ? (
          <div className="mt-3">
            <p className="text-sm">
              현재 로그인: <b>{currentUser.name}</b> ({currentUser.role})
            </p>
            <button disabled={busy} onClick={logout} className="btn-secondary mt-2">로그아웃</button>
          </div>
        ) : (
          <div className="grid gap-2.5 mt-3">
            <p className="text-sm text-slate-600">
              이메일/소셜 로그인은 <Link href="/login" className="text-blue-600 underline">로그인 페이지</Link>,
              신규 가입은 <Link href="/signup" className="text-blue-600 underline">회원가입 페이지</Link>에서 진행하세요.
            </p>
            <p className="text-xs text-slate-500">
              보안을 위해 이름만 입력하는 레거시 로그인은 종료되었습니다.
            </p>
          </div>
        )}
      </section>

      {/* 동네 인증 */}
      <section id="verify-section" className="card mt-5">
        <h3 className="section-title">동네 인증</h3>
        {verifiedDongne ? (
          <div className="mt-3 text-green-800 bg-green-50 rounded-lg p-3 border border-green-200">
            <p className="font-medium">인증된 동네: <b>{verifiedDongne}</b></p>
            <p className="text-xs mt-1 text-green-700">주소 변경이나 인증 만료 시 아래에서 재발급 후 재인증할 수 있어요.</p>
          </div>
        ) : (
          <p className="mt-2 text-slate-500 text-sm">회원가입 시 등록한 주소지(아파트/동) 기준으로 인증코드를 발급해 동네를 인증하세요.</p>
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
        <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600 mb-2">
            가입 주소지: <b>{currentUser?.apartment || "(로그인 필요)"}</b> / {currentUser?.dong || "-"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              disabled={busy || !currentUser || resendCooldownSec > 0}
              onClick={issueNeighborhoodCode}
              className="btn-primary"
            >
              {busy
                ? "발급중..."
                : resendCooldownSec > 0
                  ? `재발급 대기 ${resendCooldownSec}s`
                  : verifiedDongne
                    ? "인증코드 재발급"
                    : "인증코드 발급"}
            </button>
            {demoCode && <span className="text-slate-600 text-sm">테스트코드: <b>{demoCode}</b></span>}
          </div>
          {verifyRequestId && (
            <p className="text-xs text-slate-500 mt-2">
              코드 유효시간: {verifyRemainSec > 0 ? `${Math.floor(verifyRemainSec / 60)}분 ${verifyRemainSec % 60}초` : "만료됨"}
            </p>
          )}
          <p className="text-xs text-slate-500 mt-1">
            {verificationGuide || "문자가 안 오면 스팸함 확인 후 60초 뒤 재발급해주세요."}
          </p>
        </div>

        {/* Step 3: 인증코드 입력 */}
        {verifyRequestId && (
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
      <section className="card mt-5">
        <h3 className="section-title">네이버 지도</h3>
        <p className="mt-2 text-slate-500 text-sm">선택한 주소를 지도에서 확인할 수 있어요.</p>
        <div className="mt-3">
          <NaverMap queryAddress={mapQuery} />
        </div>
      </section>

      {/* 운영 요약 & 신뢰 규칙 */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
        <div className="card">
          <h3 className="section-title">운영 요약</h3>
          <ul className="mt-3 space-y-1.5 text-sm ml-4 list-disc text-slate-700">
            <li>총 의뢰: <b>{errands.length}건</b></li>
            <li>모집중: <b>{openCount}건</b></li>
            <li>완료: <b>{doneCount}건</b></li>
            <li>열린 분쟁: <b>{openDisputeCount}건</b></li>
            <li>패널티 누적: <b>{formatKrw(totalPenalty)}</b></li>
          </ul>
        </div>
        <div className="card">
          <h3 className="section-title">신뢰 규칙(초안)</h3>
          <ul className="mt-3 space-y-1.5 text-sm ml-4 list-disc text-slate-700">
            <li>건당 보상금 사전 표시 (3,000~100,000원)</li>
            <li>매칭 후 취소 최대 2,000원 패널티</li>
            <li>진행 중 취소 최대 3,000원 패널티</li>
            <li>완료 후 자동 정산 (플랫폼 10%, 수행자 90%)</li>
          </ul>
        </div>
      </section>

      <section className="card mt-5">
        <h3 className="section-title">안전 거래 체크리스트 (타플랫폼 베스트프랙티스 반영)</h3>
        <ul className="mt-3 space-y-1.5 text-sm ml-4 list-disc text-slate-700">
          <li>결제금은 작업 완료 승인 전까지 보관(에스크로)됩니다.</li>
          <li>매너온도·리뷰·완료율을 확인한 뒤 매칭하세요.</li>
          <li>완료 전에는 꼭 증빙(사진/메모)을 확인하세요.</li>
          <li>문제 발생 시 이의제기 등록 후 평균 24시간 내 1차 안내를 받습니다.</li>
          <li>비매너/사기 의심 사용자는 즉시 신고·차단하세요.</li>
        </ul>
      </section>

      {/* 심부름 의뢰 등록 */}
      <section id="create-section" className="card mt-5">
        <h3 className="section-title">심부름 의뢰 등록</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
          <input placeholder="제목 (예: 편의점 다녀와주세요)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" maxLength={80} />
          <input
            placeholder="아파트/동"
            value={form.apartment}
            onChange={(e) => setForm({ ...form, apartment: e.target.value })}
            disabled={Boolean(currentUser?.apartment)}
            className="input-field"
          />
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
          <div className="relative sm:col-span-2">
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
        <p className="text-xs text-slate-500 mt-2">
          의뢰자는 현재 로그인 계정(<b>{currentUser?.name || "로그인 필요"}</b>)으로 자동 등록됩니다.
        </p>
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
          disabled={busy || !isNeighborhoodVerified}
          onClick={createErrand}
          className={`btn-primary w-full mt-3 ${!isNeighborhoodVerified ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {busy ? "등록중..." : isNeighborhoodVerified ? "의뢰 등록" : "동네 인증 후 의뢰 등록 가능"}
        </button>
      </section>

      {/* 의뢰 목록 */}
      <section id="list-section" className="card mt-5">
        <h3 className="section-title">의뢰 목록</h3>
        <p className="text-xs text-slate-500 mt-1">상태는 15초마다 자동 갱신됩니다.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
          <input
            placeholder="제목/아파트/의뢰자 검색"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="input-field"
          />
          {currentUser?.role === "admin" ? (
            <input
              placeholder="관리자 매칭용 수행자 이름"
              value={helperName}
              onChange={(e) => setHelperName(e.target.value)}
              className="input-field"
            />
          ) : (
            <div className="input-field bg-slate-50 text-slate-500 flex items-center">
              수행자는 본인 계정으로만 매칭할 수 있습니다.
            </div>
          )}
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

        {currentUser && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {[
              { key: "all", label: "전체 보기" },
              { key: "mine_requester", label: "내 의뢰" },
              { key: "mine_helper", label: "내 수행" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setScopeFilter(item.key as "all" | "mine_requester" | "mine_helper")}
                className={`chip-button ${scopeFilter === item.key ? "chip-button--active" : ""}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-3 mt-4">
          {filteredErrands.length === 0 && <p className="text-slate-500 text-sm py-4 text-center">조건에 맞는 의뢰가 없습니다.</p>}
          {filteredErrands.map((e) => {
            const mineAsRequester = isRequesterOwner(e);
            const mineAsHelper = isAssignedHelper(e);
            const isAdminUser = currentUser?.role === "admin";

            const canPay = e.status === "open" && (mineAsRequester || isAdminUser);
            const canMatch = e.status === "open" && e.payment.status === "paid" && (isAdminUser || currentUser?.role === "helper");
            const canStart = e.status === "matched" && (mineAsHelper || isAdminUser);
            const canUploadProof = e.status === "in_progress" && (mineAsHelper || isAdminUser);
            const canApprove = e.status === "in_progress" && Boolean(e.proof) && (mineAsRequester || isAdminUser);
            const canOpenDispute = e.status !== "cancelled" && (mineAsRequester || mineAsHelper || isAdminUser);
            const canReview = e.status === "done" && (mineAsRequester || mineAsHelper || isAdminUser);

            return (
              <div key={e.id} className="errand-card">
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
                  의뢰자: {e.requester}
                  {e.helper ? ` / 수행자: ${e.helper}` : " / 수행자: 미정"}
                </p>
                <p className="text-slate-600 mt-1 text-xs">
                  결제: <b>{paymentMethodLabel[e.payment.method]}</b> · <b>{paymentStatusLabel[e.payment.status]}</b>
                </p>

                <div className="mt-2 grid gap-2 sm:grid-cols-2 text-xs">
                  {(() => {
                    const requesterTrust = getTrust(e.requesterId, e.requester);
                    const helperTrust = e.helper ? getTrust(e.helperId, e.helper) : null;
                    return (
                      <>
                        {requesterTrust && (
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                            <p className="font-semibold">의뢰자 신뢰 {requesterTrust.face} {requesterTrust.temp}°</p>
                            <p className="text-slate-600 mt-1">
                              {requesterTrust.badge} · 완료율 {requesterTrust.completionRate}% · 리뷰 {requesterTrust.avgRating} ({requesterTrust.reviewCount})
                            </p>
                          </div>
                        )}
                        {helperTrust ? (
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                            <p className="font-semibold">수행자 신뢰 {helperTrust.face} {helperTrust.temp}°</p>
                            <p className="text-slate-600 mt-1">
                              {helperTrust.badge} · 완료율 {helperTrust.completionRate}% · 리뷰 {helperTrust.avgRating} ({helperTrust.reviewCount})
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-600">
                            수행자 미정 (매칭 전)
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                <div className="mt-2 p-2.5 rounded-lg border border-blue-100 bg-blue-50">
                  <p className="text-xs text-blue-800">결제 보관(에스크로) 진행 상태</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {getEscrowSteps(e).map((step) => (
                      <span
                        key={step.key}
                        className={`text-[11px] px-2 py-1 rounded-full border ${
                          step.done
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-white border-blue-200 text-blue-700"
                        }`}
                      >
                        {step.done ? "✓ " : "○ "}
                        {step.label}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-blue-700 mt-1">다음 단계: {getPaymentFlowLabel(e)}</p>

                {e.payment.failedReason && (
                  <p className="text-red-700 mt-1 text-xs">결제오류: {e.payment.failedReason}</p>
                )}

                {e.proof && (
                  <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
                    <p>
                      완료 증빙: {e.proof.note || "메모 없음"} · 업로드 {new Date(e.proof.uploadedAt).toLocaleString("ko-KR")}
                    </p>
                    {e.proof.imageUrl && (
                      <a href={e.proof.imageUrl} target="_blank" rel="noreferrer" className="underline text-emerald-700 text-xs">
                        증빙 이미지 열기
                      </a>
                    )}
                  </div>
                )}

                {e.settlement && (
                  <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
                    정산 완료: 수행자 <b>{formatKrw(e.settlement.helperPayoutKrw)}</b> / 수수료 <b>{formatKrw(e.settlement.platformFeeKrw)}</b>
                    {e.approvedByName ? ` / 승인자 ${e.approvedByName}` : ""}
                  </div>
                )}

                {e.cancellation && (
                  <div className="mt-2 p-2.5 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
                    취소: {e.cancellation.reason} · 패널티 <b>{formatKrw(e.cancellation.requesterPenaltyKrw)}</b>
                    {e.cancellation.helperCompensationKrw > 0
                      ? ` (수행자 보상 ${formatKrw(e.cancellation.helperCompensationKrw)})`
                      : ""}
                  </div>
                )}

                {e.dispute && (
                  <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
                    <p>
                      이의제기: {e.dispute.status === "open" ? "진행중" : "해결됨"}
                      {e.dispute.reasonType ? ` / ${disputeTypeLabel[e.dispute.reasonType as keyof typeof disputeTypeLabel]}` : ""}
                    </p>
                    <p className="text-xs mt-1">사유: {e.dispute.reason}</p>
                    {e.dispute.evidenceNote && <p className="text-xs mt-1">증빙 메모: {e.dispute.evidenceNote}</p>}
                    <p className="text-xs mt-1">등록자: {e.dispute.reporterName}</p>
                    {e.dispute.status === "open" && (
                      <p className="text-xs mt-1">처리예상: 약 {e.dispute.expectedResolutionHours || 24}시간 내 1차 안내</p>
                    )}
                    {e.dispute.status === "resolved" && (
                      <p className="text-xs mt-1">
                        해결: {e.dispute.resolutionStatus || "-"} / {e.dispute.resolutionNote || "메모 없음"}
                      </p>
                    )}
                    {isAdminUser && e.dispute.status === "open" && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        <button disabled={busy} onClick={() => resolveDispute(e, "done")} className="btn-secondary text-sm">분쟁: 완료 확정</button>
                        <button disabled={busy} onClick={() => resolveDispute(e, "cancelled")} className="btn-danger text-sm">분쟁: 취소 확정</button>
                      </div>
                    )}
                  </div>
                )}

                {e.reviews && e.reviews.length > 0 && (
                  <div className="mt-2 p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <p className="text-sm font-medium text-indigo-900">리뷰 {e.reviews.length}개</p>
                    <ul className="mt-1 text-xs text-indigo-800 space-y-1">
                      {e.reviews.map((r) => (
                        <li key={r.id}>
                          {r.reviewerName} → {r.targetRole === "helper" ? "수행자" : "의뢰자"}: {"★".repeat(r.rating)}
                          {r.comment ? ` · ${r.comment}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {canUploadProof && (
                  <div className="mt-3 p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                    <p className="text-xs text-slate-600 mb-2">수행 완료 증빙을 올린 후 의뢰자 승인으로 정산됩니다.</p>
                    <input
                      placeholder="증빙 메모 (예: 물건 전달 완료, 영수증 전달)"
                      value={proofNotes[e.id] || ""}
                      onChange={(ev) => setProofNotes((prev) => ({ ...prev, [e.id]: ev.target.value }))}
                      className="input-field text-sm"
                    />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="mt-2 text-xs"
                      onChange={(ev) => {
                        const file = ev.target.files?.[0] || null;
                        setProofFiles((prev) => ({ ...prev, [e.id]: file }));
                      }}
                    />
                    <button disabled={busy} onClick={() => uploadProof(e)} className="btn-secondary text-sm mt-2">증빙 업로드</button>
                  </div>
                )}

                {disputeFormOpen[e.id] && canOpenDispute && e.dispute?.status !== "open" && e.status !== "done" && (
                  <div className="mt-3 p-2.5 rounded-lg border border-rose-200 bg-rose-50">
                    <p className="text-xs text-rose-700 mb-2">이의제기 작성 (평균 24시간 내 1차 안내)</p>
                    <select
                      value={disputeDrafts[e.id]?.reasonType || "quality"}
                      onChange={(ev) =>
                        setDisputeDrafts((prev) => ({
                          ...prev,
                          [e.id]: {
                            reasonType: ev.target.value as "no_show" | "quality" | "fake_proof" | "amount" | "etc",
                            detail: prev[e.id]?.detail || "",
                            evidenceNote: prev[e.id]?.evidenceNote || "",
                          },
                        }))
                      }
                      className="input-field text-sm"
                    >
                      {Object.entries(disputeTypeLabel).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <textarea
                      className="input-field text-sm mt-2 w-full min-h-[72px]"
                      placeholder="상세 사유를 입력해주세요 (최소 5자)"
                      value={disputeDrafts[e.id]?.detail || ""}
                      onChange={(ev) =>
                        setDisputeDrafts((prev) => ({
                          ...prev,
                          [e.id]: {
                            reasonType: prev[e.id]?.reasonType || "quality",
                            detail: ev.target.value,
                            evidenceNote: prev[e.id]?.evidenceNote || "",
                          },
                        }))
                      }
                    />
                    <input
                      className="input-field text-sm mt-2"
                      placeholder="증빙 메모(선택): 사진/영수증/채팅 캡처 등"
                      value={disputeDrafts[e.id]?.evidenceNote || ""}
                      onChange={(ev) =>
                        setDisputeDrafts((prev) => ({
                          ...prev,
                          [e.id]: {
                            reasonType: prev[e.id]?.reasonType || "quality",
                            detail: prev[e.id]?.detail || "",
                            evidenceNote: ev.target.value,
                          },
                        }))
                      }
                    />
                    <div className="mt-2 flex gap-2">
                      <button disabled={busy} onClick={() => submitDispute(e)} className="btn-danger text-sm">이의제기 제출</button>
                      <button disabled={busy} onClick={() => setDisputeFormOpen((prev) => ({ ...prev, [e.id]: false }))} className="btn-secondary text-sm">닫기</button>
                    </div>
                  </div>
                )}

                {reviewFormOpen[e.id] && canReview && (
                  <div className="mt-3 p-2.5 rounded-lg border border-indigo-200 bg-indigo-50">
                    <p className="text-xs text-indigo-700 mb-2">거래 리뷰 작성</p>
                    <div className="grid grid-cols-[140px_1fr] gap-2">
                      <select
                        value={reviewDrafts[e.id]?.rating || 5}
                        onChange={(ev) =>
                          setReviewDrafts((prev) => ({
                            ...prev,
                            [e.id]: {
                              rating: Number(ev.target.value),
                              comment: prev[e.id]?.comment || "",
                            },
                          }))
                        }
                        className="input-field text-sm"
                      >
                        <option value={5}>5점</option>
                        <option value={4}>4점</option>
                        <option value={3}>3점</option>
                        <option value={2}>2점</option>
                        <option value={1}>1점</option>
                      </select>
                      <input
                        className="input-field text-sm"
                        placeholder="코멘트(선택)"
                        value={reviewDrafts[e.id]?.comment || ""}
                        onChange={(ev) =>
                          setReviewDrafts((prev) => ({
                            ...prev,
                            [e.id]: {
                              rating: prev[e.id]?.rating || 5,
                              comment: ev.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button disabled={busy} onClick={() => submitReview(e)} className="btn-secondary text-sm">리뷰 제출</button>
                      <button disabled={busy} onClick={() => setReviewFormOpen((prev) => ({ ...prev, [e.id]: false }))} className="btn-secondary text-sm">닫기</button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-3 flex-wrap">
                  {canPay && e.payment.status === "pending" && (
                    <button disabled={busy} onClick={() => readyPayment(e)} className="btn-secondary text-sm">결제 준비</button>
                  )}

                  {canPay && (e.payment.status === "ready" || e.payment.status === "pending") && (
                    <button disabled={busy} onClick={() => confirmPayment(e)} className="btn-secondary text-sm">결제 확정</button>
                  )}

                  {canMatch && (
                    <button
                      disabled={busy || (isAdminUser && !helperName.trim())}
                      onClick={() =>
                        updateErrand(
                          e.id,
                          isAdminUser ? { status: "matched", helper: helperName.trim() } : { status: "matched" },
                        )
                      }
                      className="btn-secondary text-sm disabled:opacity-50"
                    >
                      {isAdminUser ? "관리자 매칭" : "내가 수행하기(매칭)"}
                    </button>
                  )}

                  {canStart && (
                    <button disabled={busy} onClick={() => updateErrand(e.id, { status: "in_progress" })} className="btn-secondary text-sm">진행 시작</button>
                  )}

                  {canApprove && (
                    <button disabled={busy} onClick={() => approveCompletion(e)} className="btn-secondary text-sm">완료 승인·정산</button>
                  )}

                  {canOpenDispute && e.dispute?.status !== "open" && e.status !== "done" && (
                    <button
                      disabled={busy}
                      onClick={() => openDisputeForm(e)}
                      className="btn-danger text-sm"
                    >
                      이의제기 작성
                    </button>
                  )}

                  {canReview && (
                    <button disabled={busy} onClick={() => openReviewForm(e)} className="btn-secondary text-sm">리뷰 작성</button>
                  )}

                  {e.status !== "done" && e.status !== "cancelled" && (mineAsRequester || mineAsHelper || isAdminUser) && (
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
            );
          })}
        </div>
      </section>

      <style jsx global>{`
        .app-shell {
          position: relative;
          isolation: isolate;
          scroll-behavior: smooth;
        }

        .app-bg-orb {
          display: none;
        }

        .hero-card {
          border-radius: 26px;
          border: 1px solid #e6e8eb;
          background: #ffffff;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
          padding: 20px;
        }

        .hero-card__header {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          font-size: 12px;
          font-weight: 700;
          color: #1f6fff;
          background: #eaf3ff;
          border-radius: 999px;
          padding: 6px 11px;
          margin-bottom: 10px;
          width: fit-content;
        }

        .hero-sidecard {
          background: #f7f9fc;
          border: 1px solid #edf0f3;
          border-radius: 16px;
          padding: 12px;
        }

        .hero-admin-link {
          display: inline-flex;
          margin-top: 10px;
          color: #3182f6;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
        }

        .hero-admin-link:hover {
          text-decoration: underline;
        }

        .hero-stats {
          margin-top: 14px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .hero-stat {
          background: #f7f9fc;
          border: 1px solid #edf0f3;
          border-radius: 14px;
          padding: 11px 12px;
        }

        .hero-stat__label {
          font-size: 11px;
          color: #8b95a1;
          margin-bottom: 4px;
          font-weight: 600;
        }

        .hero-stat__value {
          font-size: 17px;
          font-weight: 800;
          color: #191f28;
        }

        .card {
          background: #ffffff;
          border: 1px solid #e9ecef;
          border-radius: 22px;
          padding: 16px;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
        }

        .quick-action-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .quick-action-item {
          display: block;
          text-decoration: none;
          color: inherit;
          border: 1px solid #edf0f3;
          background: #f7f9fc;
          border-radius: 14px;
          padding: 12px;
          transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
        }

        .quick-action-item:hover {
          border-color: #c9ddff;
          transform: translateY(-1px);
          box-shadow: 0 8px 18px rgba(49, 130, 246, 0.12);
        }

        .quick-action-item__label {
          font-size: 12px;
          color: #8b95a1;
          font-weight: 600;
        }

        .quick-action-item__value {
          margin-top: 4px;
          font-size: 18px;
          line-height: 1.2;
          font-weight: 800;
          color: #191f28;
        }

        .quick-action-item__hint {
          margin-top: 5px;
          font-size: 12px;
          color: #6b7684;
          line-height: 1.4;
        }

        .section-title {
          font-size: 17px;
          line-height: 1.4;
          font-weight: 800;
          color: #191f28;
          letter-spacing: -0.01em;
        }

        .input-field {
          border: 1px solid #e5e8eb;
          border-radius: 12px;
          padding: 10px 12px;
          background: #ffffff;
          color: #191f28;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background-color 0.15s;
          min-height: 42px;
        }

        .input-field:focus {
          border-color: #9bc2ff;
          box-shadow: 0 0 0 3px rgba(49, 130, 246, 0.14);
        }

        .input-field:disabled {
          background: #f2f4f6;
          color: #8b95a1;
        }

        .btn-primary {
          border: none;
          background: #3182f6;
          color: #fff;
          border-radius: 12px;
          padding: 10px 16px;
          cursor: pointer;
          font-weight: 700;
          font-size: 14px;
          transition: background-color 0.15s, transform 0.1s, opacity 0.15s;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1f6fff;
          transform: translateY(-1px);
        }

        .btn-primary:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .btn-secondary {
          border: none;
          background: #f2f4f6;
          color: #333d4b;
          border-radius: 12px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          transition: background-color 0.15s, transform 0.1s;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e9ecef;
          transform: translateY(-1px);
        }

        .btn-secondary:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
        }

        .btn-danger {
          border: none;
          background: #fdebec;
          color: #d92d20;
          border-radius: 12px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          transition: background-color 0.15s, transform 0.1s;
        }

        .btn-danger:hover:not(:disabled) {
          background: #fce0e2;
          transform: translateY(-1px);
        }

        .btn-danger:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
        }

        .chip-button {
          border: 1px solid #e5e8eb;
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 700;
          background: #ffffff;
          color: #6b7684;
          transition: all 0.15s ease;
        }

        .chip-button:hover {
          border-color: #9bc2ff;
          color: #1f6fff;
        }

        .chip-button--active {
          border-color: #9bc2ff;
          background: #eaf3ff;
          color: #1f6fff;
        }

        .errand-card {
          border: 1px solid #e5e8eb;
          border-radius: 18px;
          padding: 14px;
          background: #ffffff;
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.04);
          transition: box-shadow 0.15s, transform 0.15s;
        }

        .errand-card:hover {
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
          transform: translateY(-1px);
        }

        @media (min-width: 760px) {
          .hero-card {
            padding: 24px;
          }

          .hero-card__header {
            grid-template-columns: 1fr minmax(280px, 340px);
            align-items: start;
            gap: 18px;
          }

          .hero-stats {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }

          .quick-action-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .errand-card {
            padding: 16px;
          }
        }
      `}</style>
    </main>
  );
}
