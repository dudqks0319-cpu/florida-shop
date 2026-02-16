# 동네 심부름 프로젝트 실사용 설계안 (v1)

## 0) 목표

현재 MVP를 **실제 사용자(아파트/동네 주민)**가 쓸 수 있는 서비스로 전환합니다.
핵심은 3가지입니다.

1. 신뢰: 동네/본인 인증 + 분쟁 처리
2. 안전: 결제 에스크로 + 상태 전이 통제
3. 운영: 관리자 정책 집행 + 리스크 모니터링

---

## 1) 실사용 기준 범위 (MVP → Pilot)

### 포함 (필수)
- 휴대폰 본인확인 (KYC-lite)
- 동네 인증(주소 + 위치 + 거주 증빙 선택)
- 의뢰 등록/매칭/진행/완료/취소 상태머신 고정
- 결제 에스크로(의뢰 선결제, 완료 후 정산)
- 채팅 + 푸시 알림
- 분쟁 접수/증빙 업로드
- 관리자 콘솔(제재, 환불, 정책 집행)

### 제외 (2차)
- 실시간 경로 추적
- 보험 상품 연동
- 고급 추천 알고리즘

---

## 2) 사용자 흐름 (핵심)

1. 회원가입 → 본인확인
2. 동네 인증 완료
3. 의뢰 등록(보상금 + 상세 + 완료 조건)
4. 수행자 지원/매칭
5. 채팅으로 세부 조율
6. 진행 시작
7. 완료 확인(의뢰자 승인 혹은 자동 승인)
8. 정산(수행자 지급, 플랫폼 수수료 차감)
9. 리뷰/신뢰점수 반영

취소 시:
- 상태별 패널티 규칙 자동 적용
- 분쟁 신청 가능

---

## 3) 시스템 아키텍처

## 3-1. 권장 스택
- Frontend: Next.js (현재 유지)
- Backend API: Next.js Route Handler 또는 NestJS 분리
- DB: PostgreSQL (Supabase 또는 RDS)
- 캐시/큐: Redis (BullMQ)
- 파일 저장: S3 호환 스토리지
- 알림: FCM + 카카오 알림톡(선택)
- 결제: 토스페이먼츠(에스크로/정산)

## 3-2. 도메인 서비스 분리
- Auth/Identity 서비스
- Errand 서비스(의뢰 상태머신)
- Payment/Settlement 서비스
- Trust & Policy 서비스(패널티/제재)
- Admin 서비스(운영도구)

---

## 4) 데이터 모델 (실사용 최소)

### users
- id, name, phone, verified_at, trust_score, status(active/suspended)

### neighborhoods
- id, si, gu, dong, apartment_name, geo_hash

### neighborhood_verifications
- id, user_id, neighborhood_id, method(code/location/document), status, verified_at

### errands
- id, requester_id, neighborhood_id, title, detail, category, reward_krw, status
- status: open/matched/in_progress/done/cancelled/disputed

### errand_matches
- id, errand_id, helper_id, matched_at, started_at, completed_at

### settlements
- id, errand_id, total_krw, fee_krw, helper_payout_krw, status(held/paid/refunded), paid_at

### disputes
- id, errand_id, reporter_id, reason, evidence_urls, decision, decided_by, decided_at

### penalties
- id, user_id, errand_id, type(no_show/cancel_late/fraud), amount_krw, applied_at

### reviews
- id, errand_id, reviewer_id, reviewee_id, rating, comment

---

## 5) 상태 전이 규칙 (강제)

- open → matched
- matched → in_progress | cancelled
- in_progress → done | cancelled | disputed
- disputed → done | cancelled

금지:
- done 이후 상태 변경(관리자 강제조치만 허용)

검증:
- 서버에서만 상태 전이 허용 (클라이언트 임의 변경 금지)
- 각 전이에 actor 권한 검증(의뢰자/수행자/관리자)

---

## 6) 결제/정산 설계

1. 의뢰 등록 시 의뢰자가 선결제(에스크로)
2. 완료 시 자동 정산
   - 예: 총액 10,000원
   - 플랫폼 수수료 10% = 1,000원
   - 수행자 지급 9,000원
3. 취소/분쟁 시 규칙 기반 재배분
4. 환불 SLA 정의(예: 3영업일)

필수 로그:
- 결제 요청/성공/실패
- 정산 요청/성공/실패
- 환불/취소 사유

---

## 7) 신뢰/안전 정책

- 신규 계정 일일 의뢰/수행 건수 제한
- 반복 취소/노쇼 계정 자동 제한
- 고위험 키워드(심부름 범위 외 요청) 필터링
- 민감 업무 금지 목록 운영(법률/의료/현금인출 대행 등)
- 신고 누적 임계치 도달 시 자동 숨김 + 관리자 검토

---

## 8) 운영 콘솔 (관리자)

필수 기능:
- 사용자 제재(정지/해제)
- 분쟁 판정/정산 재처리
- 패널티 수동 조정(감사 로그 필수)
- 신고 목록 triage
- KPI 대시보드

운영 KPI:
- 완료율
- 취소율
- 분쟁률
- 재사용률(7일/30일)
- 평균 매칭 시간

---

## 9) 보안/개인정보

- 개인정보 최소수집
- PII 암호화 저장(전화번호/주소 일부)
- 접근권한 분리(RBAC)
- 관리자 액션 전수 감사로그
- 이미지 업로드 악성파일 검사
- 비밀키는 env + 비밀관리 시스템 사용

---

## 10) 출시 로드맵 (8주)

### 1~2주: 기반
- PostgreSQL 전환
- 상태머신/권한검사 서버 고정
- 기본 인증/동네인증 API 정비

### 3~4주: 거래 핵심
- 결제 에스크로/정산 연동
- 채팅/알림 최소 기능
- 분쟁 접수/증빙 업로드

### 5~6주: 운영
- 관리자 콘솔
- 제재/패널티 자동 규칙
- 모니터링/알람

### 7~8주: 파일럿
- 울산 특정 단지 1~2곳 론치
- 운영 매뉴얼 기반 현장 대응
- KPI 리뷰 후 정책/UX 수정

---

## 11) 지금 코드 기준 즉시 개선 TODO (우선순위)

P0 (즉시)
- 파일 기반 저장(`data/`) → PostgreSQL 마이그레이션
- 인증코드 데모 응답 제거(운영에서 코드 노출 금지)
- 의뢰/매칭 API에 역할권한 검사 강화

P1
- 결제 에스크로 연동
- 채팅 + 알림
- 분쟁/신고 플로우

P2
- 리뷰/신뢰점수 모델
- 추천/랭킹 고도화

---

## 12) 비즈니스 리스크 및 대응

- 리스크: 사기성 의뢰/허위 완료
  - 대응: 에스크로 + 증빙 + 분쟁 SLA
- 리스크: 노쇼 누적
  - 대응: 단계별 패널티 + 점수 하락 + 일시정지
- 리스크: 운영 인력 부족
  - 대응: 정책 자동화 + 우선순위 큐

---

## 13) 성공 기준 (Pilot)

- 완료율 80% 이상
- 분쟁률 5% 이하
- 취소율 15% 이하
- 의뢰자 재사용률(30일) 35% 이상
- 평균 매칭시간 10분 이내
