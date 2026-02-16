"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./admin.module.css";

type Summary = {
  total: number;
  open: number;
  inProgress: number;
  done: number;
  cancelled: number;
  completionRate: number;
  cancelRate: number;
  totalReward: number;
  totalFee: number;
  totalPayout: number;
  penaltyTotal: number;
  uniqueRequesters: number;
  uniqueHelpers: number;
};

type Errand = {
  id: string;
  title: string;
  requester: string;
  helper?: string;
  rewardKrw: number;
  status: "open" | "matched" | "in_progress" | "done" | "cancelled";
  createdAt: string;
};

const statusLabel: Record<Errand["status"], string> = {
  open: "모집중",
  matched: "매칭완료",
  in_progress: "진행중",
  done: "완료",
  cancelled: "취소",
};

export default function AdminPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recent, setRecent] = useState<Errand[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/admin/overview");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "관리자 데이터를 불러오지 못했습니다.");
        return;
      }
      setSummary(json.summary);
      setRecent(json.recent || []);
    };

    load();
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={styles.hero}>
          <div>
            <h1 className={styles.title}>운영 대시보드</h1>
            <p className={styles.sub}>심부름 거래 현황, 정산 지표, 리스크를 한 화면에서 관리합니다.</p>
          </div>
          <Link href="/" className={styles.link}>서비스 화면으로 이동</Link>
        </section>

        {error && <div className={`${styles.card} ${styles.warn}`}>⚠ {error}</div>}

        {!error && summary && (
          <>
            <section className={styles.grid}>
              <div className={styles.card}><p className={styles.label}>총 의뢰</p><p className={styles.value}>{summary.total}건</p></div>
              <div className={styles.card}><p className={styles.label}>완료율</p><p className={styles.value}>{summary.completionRate}%</p></div>
              <div className={styles.card}><p className={styles.label}>취소율</p><p className={styles.value}>{summary.cancelRate}%</p></div>
              <div className={styles.card}><p className={styles.label}>누적 수수료</p><p className={styles.value}>{summary.totalFee.toLocaleString()}원</p></div>
            </section>

            <section className={styles.row}>
              <div className={styles.card}>
                <h2 className={styles.panelTitle}>운영 상태</h2>
                <ul className={styles.list}>
                  <li>모집중: <b>{summary.open}</b>건</li>
                  <li>진행중: <b>{summary.inProgress}</b>건</li>
                  <li>완료: <b>{summary.done}</b>건</li>
                  <li>취소: <b>{summary.cancelled}</b>건</li>
                  <li>활성 의뢰자 수: <b>{summary.uniqueRequesters}</b>명</li>
                  <li>활성 수행자 수: <b>{summary.uniqueHelpers}</b>명</li>
                </ul>
              </div>
              <div className={styles.card}>
                <h2 className={styles.panelTitle}>정산/리스크</h2>
                <ul className={styles.list}>
                  <li>총 거래액: <b>{summary.totalReward.toLocaleString()}원</b></li>
                  <li>수행자 지급 누적: <b>{summary.totalPayout.toLocaleString()}원</b></li>
                  <li>패널티 누적: <b>{summary.penaltyTotal.toLocaleString()}원</b></li>
                </ul>
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.panelTitle}>최근 의뢰 12건</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>제목</th>
                      <th>의뢰자</th>
                      <th>수행자</th>
                      <th>금액</th>
                      <th>상태</th>
                      <th>등록시각</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={styles.empty}>아직 의뢰 데이터가 없습니다.</td>
                      </tr>
                    ) : (
                      recent.map((e) => (
                        <tr key={e.id}>
                          <td>{e.title}</td>
                          <td>{e.requester}</td>
                          <td>{e.helper || "-"}</td>
                          <td>{e.rewardKrw.toLocaleString()}원</td>
                          <td>
                            <span className={styles.badge}>{statusLabel[e.status]}</span>
                          </td>
                          <td>{new Date(e.createdAt).toLocaleString("ko-KR")}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
