# LITTTL. FARM. 배포 및 롤백 안내

이 문서는 `LITTTL. FARM.`의 웹 화면(Firebase Hosting), 데이터 규칙(Firestore Rules), Node.js 서버(`server.js`)의 배포와 복구 절차를 정리한 기술 문서입니다.
GitHub에서 코드를 내려받아 처음 실행해 보는 초보자용 단계별 가이드는 [ADMIN_GUIDE.md](./ADMIN_GUIDE.md)의 **2부(개발자가 따로 있는 경우)**를 먼저 확인해 주세요.

## 구성

- Firebase 프로젝트: `litttl-farm`
- Firestore 데이터베이스: `ai-studio-litttl-70fd022f-0950-436d-b112-bd924ccec57d` (`firestore.rules` 및 `back/firestore.rules`)
- 정적 웹 산출물: `front/` (HTML은 `no-store`, JS/CSS는 `no-cache, must-revalidate`로 서빙)
- API 서버: `server.js` (날씨 프록시 `/api/weather`, AI 답장 `/api/diary-reply`, 동적 설정 `/js/config.js`)

## 초기 설정

```bash
npm install
npx firebase login
npx firebase use --add
```

Firebase Console에서 Authentication Google 로그인을 켜고, `승인된 도메인`에 운영 도메인을 등록합니다. AI 답장 기능을 쓰는 서버에는 `GEMINI_API_KEY` 환경변수를 설정하며, 방문 통계(GA4)는 `firebase-applet-config.json` / `front/js/config.js`의 `measurementId`(`G-W1YW38ZSGB`) 또는 `FIREBASE_MEASUREMENT_ID` 환경변수로 연결됩니다.

## 배포 전 검증

```bash
npm run lint
npm test
npm run build
npm run check:deploy
```

GitHub 저장소의 `main` 브랜치에 푸시하거나 PR을 올리면 `.github/workflows/ci.yml`이 위 검증을 자동으로 실행합니다. Firebase Hosting 자동 배포 워크플로(`.github/workflows/firebase-hosting-merge.yml`, `.github/workflows/firebase-hosting-pull-request.yml`)를 사용하려면 저장소 Secrets에 `FIREBASE_SERVICE_ACCOUNT_LITTTL_FARM`을 설정합니다.

## 배포 실행

미리보기 채널 배포:

```bash
npm run deploy:preview
```

운영 배포(Hosting + Firestore 규칙):

```bash
npm run deploy
```

Node.js 서버 실행:

```bash
GEMINI_API_KEY=... npm start
```

## 롤백 절차

배포 후 문제가 확인되면 아래 방법으로 직전 안정 상태로 되돌립니다.

1. **웹 화면(Hosting)**: Firebase Console의 Hosting 릴리스 기록에서 직전 버전으로 Roll back 하거나 아래 명령을 실행합니다.
   ```bash
   npx firebase hosting:clone litttl-farm:live@<이전_버전_ID> litttl-farm:live
   ```
2. **보안 규칙(Firestore Rules)**: 정상 커밋 시점의 규칙 파일을 복원해 루트(`firestore.rules`)와 `back/firestore.rules`를 동일하게 맞춘 뒤 배포합니다.
   ```bash
   git checkout <이전_커밋> -- firestore.rules back/firestore.rules
   npx firebase deploy --only firestore:rules
   ```
3. **Node.js 서버**: 장애 커밋을 `git revert`로 되돌린 뒤 `npm run lint && npm test` 통과를 확인하고 서버를 다시 시작합니다.

장애 안내 및 고객 응대는 [ADMIN_GUIDE.md](./ADMIN_GUIDE.md)의 기준을 따릅니다.
