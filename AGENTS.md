# AGENTS.md — 동네 심부름 프로젝트 작업 규칙

## 프로젝트 개요
- 이름: 동네 심부름 (`dongnae-errand`)
- 스택: Next.js 16 (App Router) + TypeScript + Prisma + PostgreSQL(준비) + Tailwind CSS(설치됨)
- 목적: 같은 아파트/동네 주민끼리 15~30분 생활 심부름을 매칭해주는 서비스

## 코드 스타일
- TypeScript strict 모드 유지
- 모든 API Route는 에러 처리 필수 (`try-catch` + 적절한 HTTP 상태코드)
- 한국어 주석 우선 (비개발자도 이해 가능한 문장)
- UI는 재사용 가능한 컴포넌트 분리 우선 (`src/components`)

## 데이터베이스
- Prisma ORM 사용
- 스키마 변경 시:
  1) `npx prisma migrate dev --name <change-name>`
  2) `npx prisma generate`
- 직접 SQL 하드코딩 금지 (Prisma Client 우선)

## 보안
- API 키/시크릿 하드코딩 금지 (환경변수만 사용)
- `NEXT_PUBLIC_`는 브라우저 노출이 필요한 값에만 허용
- 보호 API는 세션 검증 필수
- 사용자 입력값은 서버에서 재검증 (클라이언트 검증 신뢰 금지)

## 테스트
- 결제/정산/상태전이 변경 시 테스트 추가 필수
- 최소 실행:
  - `npm run test`
  - `npm run lint`
  - `npm run build`

## 작업 완료 기준
- `npm run lint` 경고/에러 없음
- `npm run build` 성공
- `npm run dev` 후 주요 화면 동작 확인

## Git
- 커밋은 기능 단위로 분리
- 메시지는 변경 내용이 한눈에 보이게 작성
- 작업 전 현재 상태 커밋 권장 (롤백 대비)
