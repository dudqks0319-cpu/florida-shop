# 동네 심부름 개선 진행상태 (2026-02-18)

## 완료된 개선

### 1) 인증/권한 강화
- 레거시 이름 기반 로그인 차단 (`/api/auth/login`)
- 관리자 회원가입 직접 생성 차단 (`ALLOW_ADMIN_SIGNUP=true`일 때만 허용)
- 핵심 API 소유권 검증을 `name` 우선에서 `userId` 우선으로 강화
  - 의뢰 등록/수정
  - 결제 준비/확정
  - 동네 인증 검증

### 2) 결제 흐름 안정화
- `paymentReady`, `paymentConfirm` 분리
- `PAYMENT_MODE=live`에서 토스 확정 시 `paymentKey` 필수
- live 모드에서 미지원 결제수단(카카오/네이버)은 명확한 오류 반환
- 결제 확정 실패 시 상태/사유 저장

### 3) 거래 완료 신뢰 흐름(소비자 핵심)
- 완료 증빙 업로드 API 추가: `POST /api/errands/:id/proof`
- 의뢰자 완료 승인 API 추가: `POST /api/errands/:id/approve`
- 이의제기/분쟁 해결 API 추가: `POST /api/errands/:id/dispute`
- 리뷰 API 추가: `POST /api/errands/:id/review`

### 4) 소비자 UX 개선
- 메인 카드에서 다음 단계 안내 문구 표시(결제→매칭→증빙→승인)
- 역할 기반 버튼 노출
  - 의뢰자: 결제/승인/이의제기/리뷰
  - 수행자: 매칭/진행/증빙/이의제기/리뷰
  - 관리자: 매칭 보조/분쟁 해결
- 증빙/분쟁/리뷰 상태를 카드에서 즉시 확인 가능
- 회원가입에서 역할(requester/helper) 선택 지원

## 남은 항목 (진행 필요)

### A) DB 전환 (외부 정보 필요)
- 현재 Prisma generate/migrate가 `DATABASE_URL` 미설정으로 실행 불가
- 필요한 것: 실제 PostgreSQL 연결 문자열
- 준비되면 즉시 진행:
  1. `npm run prisma:generate`
  2. `npm run prisma:migrate -- --name init`
  3. 파일 DB(data/errands.json) -> DB 이관 스크립트 실행

### B) 결제 실연동 확대
- 현재 live 확정은 토스/카드 중심
- 카카오/네이버는 순차 연동 예정(ready/confirm API 실제 호출)

### C) 품질 마감
- Florida 쪽 `<img>` 경고를 `next/image`로 치환(성능 경고 제거)

## 테스트 결과
- `npm run test`: 통과
- `npm run build`: 통과
- `npm run lint`: 에러 없음(경고 9건, 기존 이미지 경고)
