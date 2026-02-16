# 동네 심부름 실서비스용 API 발급/설정 가이드

> 비개발자 기준으로, "무엇이 필요한지 + 어디서 발급받는지 + 키를 안전하게 보관하는 방법"만 쉽게 정리했습니다.

## 0) 지금 앱에서 아직 필요한 핵심 외부 연동

실제로 서비스 운영하려면 아래 6가지가 필요합니다.

1. **데이터 저장(DB)**
2. **결제/정산**
3. **문자 인증(SMS)**
4. **지도/주소**
5. **알림(Push)**
6. **증빙 파일 업로드(사진/영수증)**

---

## 1) 데이터 저장(DB) - 필수

### 추천 서비스
- **Supabase(PostgreSQL)**: https://supabase.com
- 대안: **Neon(PostgreSQL)**: https://neon.tech

### 왜 필요한가?
- 지금은 임시/로컬 저장이 섞여 있어, 서버 재시작/배포 시 데이터 관리가 어려움
- 실제 서비스는 반드시 외부 DB 필요

### 발급/설정 순서
1. 사이트 가입
2. 새 프로젝트 생성
3. DB 연결 문자열(Connection String) 복사
4. 앱 환경변수에 저장

### 넣을 값
- `DATABASE_URL`

---

## 2) 결제/정산 - 필수

### 추천 서비스
- **토스페이먼츠**: https://www.tosspayments.com
- 개발문서: https://docs.tosspayments.com

### 왜 필요한가?
- 심부름 앱은 "의뢰자 결제 → 완료 후 정산"이 핵심
- 분쟁/취소 시 환불 처리도 필요

### 발급/설정 순서
1. 토스페이먼츠 가입 및 상점 등록
2. 테스트 키 발급
3. 테스트 결제 검증
4. 운영 심사 후 라이브 키 발급

### 넣을 값(예시)
- `TOSS_SECRET_KEY`
- `TOSS_CLIENT_KEY` (클라이언트 공개키)

> 주의: `SECRET_KEY`는 절대 프론트(브라우저) 코드에 넣으면 안 됩니다.

---

## 3) 문자 인증(SMS) - 필수

### 추천 서비스
- **SOLAPI(구 CoolSMS)**: https://solapi.com

### 왜 필요한가?
- 실제 사용자 본인확인/알림에 필요
- 현재 데모코드 방식은 운영용으로 부적합

### 발급/설정 순서
1. 가입/본인인증
2. API Key / API Secret 발급
3. 발신번호 등록
4. 테스트 발송

### 넣을 값(예시)
- `SMS_API_KEY`
- `SMS_API_SECRET`
- `SMS_FROM_NUMBER`

---

## 4) 지도/주소 - 필수

### (A) 주소 검색
- **도로명주소 API(정부)**: https://business.juso.go.kr/addrlink/openApi/searchApi.do
- 현재 프로젝트에서도 사용 중

넣을 값:
- `GOV_JUSO_API_KEY`

### (B) 지도 표시
- **네이버 클라우드 플랫폼 Maps**: https://www.ncloud.com/product/applicationService/maps
- 콘솔: https://console.ncloud.com

넣을 값:
- `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`

> 지도 표시용 공개값은 `NEXT_PUBLIC_`로 시작 가능

---

## 5) 푸시 알림 - 권장(거의 필수)

### 추천 서비스
- **Firebase Cloud Messaging(FCM)**: https://console.firebase.google.com

### 왜 필요한가?
- 매칭/취소/완료 시 즉시 알림이 핵심 UX

### 넣을 값(예시)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

---

## 6) 증빙 파일 업로드(분쟁 사진/영수증) - 권장

### 추천 서비스
- **AWS S3**: https://aws.amazon.com/s3/
- 대안: **Cloudflare R2**: https://www.cloudflare.com/developer-platform/r2/

### 넣을 값(예시)
- `S3_BUCKET`
- `S3_REGION`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`

---

## 7) API 키 노출 방지 (매우 중요)

## 절대 하면 안 되는 것
- 키를 코드에 직접 작성해서 GitHub에 올리기
- 키를 `NEXT_PUBLIC_`로 노출해야 하는지 구분 없이 사용하기
- `.env` 파일 커밋하기

## 안전한 저장 방법 (권장 순서)

### 1) 로컬 개발
- `.env.local` 파일에 저장
- `.gitignore`에 `.env*` 포함 확인 (이미 되어 있음)

예시:
```bash
DATABASE_URL=...
TOSS_SECRET_KEY=...
SMS_API_SECRET=...
```

### 2) 서버 배포 환경
- Vercel/Render/Railway 등 "Environment Variables" 화면에 직접 입력
- 코드 저장소에는 절대 키 저장 금지

### 3) CI/CD (GitHub Actions)
- GitHub Repository → Settings → Secrets and variables → Actions
- 민감값을 `Secrets`에 저장 후 워크플로우에서 참조

---

## 8) 공개해도 되는 키 vs 비공개 키

## 공개 가능(브라우저 노출 가능)
- 지도 렌더링용 공개 키
- 예: `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`

## 비공개(서버에서만 사용)
- 결제 Secret
- SMS Secret
- DB 연결 문자열
- Firebase private key
- S3 secret

---

## 9) 운영 전 체크리스트

- [ ] 테스트 키와 운영 키 분리
- [ ] 키 권한 최소화(필요 권한만)
- [ ] 키 유출 대비 재발급 절차 확인
- [ ] 관리자 계정 2단계 인증 활성화
- [ ] 로그에 키/전화번호/개인정보 마스킹 적용

---

## 10) 이 프로젝트에 바로 넣을 환경변수 이름(권장)

```bash
# DB
DATABASE_URL=

# 주소/지도
GOV_JUSO_API_KEY=
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=

# 결제
TOSS_SECRET_KEY=
TOSS_CLIENT_KEY=

# SMS
SMS_API_KEY=
SMS_API_SECRET=
SMS_FROM_NUMBER=

# 알림(FCM)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# 파일 업로드
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=

# 데모코드 노출(운영 시 false)
ALLOW_DEMO_CODE=false
```

---

## 11) 다음 추천 작업 순서

1. Supabase 연결(`DATABASE_URL`) → Prisma 마이그레이션
2. 토스페이먼츠 테스트 결제 연동
3. SOLAPI 인증코드 발송 연동
4. FCM 매칭/완료 푸시
5. S3 증빙 업로드 연동

필요하면 위 1~5를 제가 순서대로 실제 코드에 바로 붙여드리겠습니다.
