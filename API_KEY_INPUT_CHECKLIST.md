# API 키 입력 순서 체크리스트 (비개발자용)

> 목표: 발급받은 키를 실수 없이 넣고 앱이 정상 동작하도록 하는 순서표

## A. 먼저 준비할 것

- [ ] 프로젝트 폴더 열기: `dongnae-errand`
- [ ] `.env.local` 파일 만들기 (없으면 새로 생성)
- [ ] 키/비밀번호는 메모장에 잠깐 저장 후 바로 `.env.local`에 입력

---

## B. 진짜 입력 순서 (이 순서대로)

## 1) DB 연결부터

- [ ] Supabase(또는 Neon)에서 DB 연결 문자열 복사
- [ ] `.env.local`에 아래 줄 추가

```bash
DATABASE_URL=postgresql://...
```

- [ ] 터미널 실행

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

성공 기준:
- [ ] 에러 없이 완료

---

## 2) 주소/지도 키 입력

- [ ] 도로명주소 API 키 발급
- [ ] 네이버 지도 클라이언트 ID 발급
- [ ] `.env.local`에 추가

```bash
GOV_JUSO_API_KEY=...
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=...
```

성공 기준:
- [ ] 주소 검색이 된다
- [ ] 지도 화면이 뜬다

---

## 3) SMS 인증 키 입력

- [ ] SOLAPI에서 API KEY/SECRET 발급
- [ ] 발신번호 등록
- [ ] `.env.local`에 추가

```bash
SMS_API_KEY=...
SMS_API_SECRET=...
SMS_FROM_NUMBER=...
```

성공 기준:
- [ ] 인증코드 발송 요청 시 에러가 안 난다

---

## 4) 결제 키 입력

- [ ] 토스페이먼츠 테스트 키 발급
- [ ] `.env.local`에 추가

```bash
TOSS_SECRET_KEY=...
TOSS_CLIENT_KEY=...
```

성공 기준:
- [ ] 결제 테스트 호출 시 인증 에러 없음

---

## 5) 푸시 알림 키 입력(선택)

- [ ] Firebase 프로젝트 생성
- [ ] 서비스 계정 키 생성
- [ ] `.env.local`에 추가

```bash
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

성공 기준:
- [ ] 알림 테스트 호출 시 실패하지 않음

---

## 6) 업로드 스토리지 키 입력(선택)

- [ ] AWS S3 또는 Cloudflare R2 키 준비
- [ ] `.env.local`에 추가

```bash
S3_BUCKET=...
S3_REGION=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

성공 기준:
- [ ] 파일 업로드 테스트 성공

---

## C. 데모 모드/운영 모드 설정

- 개발 중(데모코드 화면에 보여도 됨)

```bash
ALLOW_DEMO_CODE=true
```

- 실제 운영(보안)

```bash
ALLOW_DEMO_CODE=false
```

---

## D. 최종 확인 (필수)

- [ ] `npm run dev` 실행
- [ ] 브라우저 접속: `http://localhost:3000`
- [ ] 로그인 가능
- [ ] 동네 인증 가능
- [ ] 의뢰 등록 가능
- [ ] 목록/필터/상태변경 동작

---

## E. 키 노출 방지 체크

- [ ] `.env.local`을 GitHub에 올리지 않았다
- [ ] 키를 카톡/텔레그램 채팅에 그대로 붙이지 않았다
- [ ] 운영 키와 테스트 키를 분리했다
- [ ] 유출 의심 시 즉시 재발급 가능하다

---

## F. 문제 생기면 먼저 볼 것

- [ ] 오타(변수 이름) 확인
- [ ] 키 앞뒤 공백 제거
- [ ] 서버 재시작 (`npm run dev` 다시)
- [ ] 발급 사이트에서 키 활성 상태 확인

필요하면 제가 이 체크리스트 보면서 실제로 한 줄씩 같이 점검해드릴게요.
