This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## 실사용 설계 문서

- Codex 배치 생성 도구(우리동네심부름 템플릿): `scripts/codex_batch_processor.py`
- 사용 가이드: `scripts/README_codex_batch_ko.md`


- 실사용 전환 설계안: `REAL_WORLD_DESIGN.md`
- 제품 실행 계획(MVP): `PRODUCT_PLAN.md`
- API 발급/보안 저장 가이드: `API_SETUP_GUIDE.md`
- API 키 실제 입력 순서 체크리스트: `API_KEY_INPUT_CHECKLIST.md`
- 최신 개선 진행현황: `IMPLEMENTATION_STATUS_2026-02-18.md`
- FLORIDA 홈 보완 진단/결과: `FLORIDA_HOMEPAGE_COMPLETION_2026-02-18.md`

## 결제 연동(한국 결제수단)

- 결제수단 선택 지원: `카카오페이`, `네이버페이`, `토스페이`, `카드`
- 결제 플로우: 결제준비(`ready`) → 결제완료(`confirm`) → 매칭 가능
- 현재 기본값은 `mock` 모드이며, `PAYMENT_MODE=live` 전환 시 실결제 게이트웨이 연동용 구조로 동작하도록 설계됨

관련 API:
- `POST /api/payments/:id/ready`
- `POST /api/payments/:id/confirm`

## PostgreSQL + 로그인/권한 분리

- Prisma 스키마: `prisma/schema.prisma`
- 환경변수: `.env.local`에 `DATABASE_URL` 설정
- 초기 생성(예시):

```bash
npx prisma generate
npx prisma migrate dev --name init
```

- 로그인 역할: `requester`, `helper`, `admin`
- 서버 권한 검증: 의뢰 등록/매칭/진행/완료/취소 API에서 역할/사용자 검증 수행

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
