# LITTTL. FARM. 배포 및 롤백 순서

Firebase Hosting, Cloud Firestore(`ai-studio-litttl-70fd022f-0950-436d-b112-bd924ccec57d`), Firebase Authentication과 Node.js Express 서버(`server.js`: AI 답장 `/api/diary-reply`, 날씨 프록시 `/api/weather`)를 사용합니다.

## 현재 연결 상태 (2026-11-18)

- Firebase 프로젝트: `litttl-farm`
- 기본 Hosting 주소: `https://litttl-farm.web.app`
- Authentication: **Google 로그인** 사용 (콘솔에서 운영 도메인을 승인된 도메인에 추가 필요)
- Firestore: Database ID `ai-studio-litttl-70fd022f-0950-436d-b112-bd924ccec57d`, 규칙 `back/firestore.rules`
- 프런트엔드 산출물: `front/` (`index.html`, `styles.css`, `js/config.js`, `js/filter.js`, `js/backend.js`, `js/app.js`)

---

## 1. 최초 한 번만 할 일

1. `npm install`
2. `npx firebase login`
3. Firebase Console → Authentication → Sign-in method에서 **Google** 제공업체를 활성화하고, **Settings > Authorized domains**에 운영 도메인(예: `litttl-farm.web.app`, 커스텀 도메인)을 등록합니다.
4. (GA4 연동 시) Google Analytics에서 웹 데이터 스트림을 생성해 `G-...` 측정 ID를 발급받고, `firebase-applet-config.json`의 `measurementId` 또는 서버 환경변수 `FIREBASE_MEASUREMENT_ID`에 설정합니다.
5. AI 답장 기능 사용 시 서버 환경변수 `GEMINI_API_KEY`를 설정합니다.
6. `npx firebase use --add`로 이 폴더와 Firebase 프로젝트(`litttl-farm`)를 연결합니다.

---

## 2. 배포 전 로컬 검증

```bash
npm run lint
npm test
npm run build
npm run check:deploy
```

- `npm run lint`: 서버 및 프런트엔드 스크립트 구문 검사
- `npm test`: 인증, 한 계정 한 나무, 일기 작성·수정·삭제, 구름 24시간 제한, 하트, 회원 탈퇴, 분석 동의 차단 및 서버 보안 헤더 자동 테스트
- `npm run check:deploy`: Firebase 필수 설정 키 누락 여부 확인

---

## 3. 임시 미리보기 배포 (Hosting)

```bash
npm run deploy:preview
```

출력된 임시 URL에서 모바일(iOS Safari / Android Chrome)·데스크톱 화면과 Google 로그인, 나무 연결, 일기 기능을 확인합니다.

---

## 4. 운영 배포

### A. Git & CI 기준
- `.github/workflows/ci.yml`이 `main` 푸시·PR마다 자동으로 `lint → test → build → check:deploy`를 실행합니다.
- 권장 GitHub 설정: `Settings > Branches > Branch protection rules`에서 `main` 브랜치에 대해 PR 필수 및 `CI / verify` 상태 체크 통과 후 머지하도록 보호 규칙을 활성화합니다.

### B. Firebase Hosting + Firestore Rules 배포
```bash
npm run deploy
```

### C. Node.js 서버(`server.js`) 실행 (AI 답장·날씨 프록시 포함)
```bash
GEMINI_API_KEY=... npm start
```

---

## 5. 장애 시 롤백 절차 (Rollback)

운영 배포 후 치명적인 오류가 확인되면 즉시 아래 절차로 이전 안정 버전으로 복구합니다.

1. **Firebase Hosting 롤백 (웹 화면)**:
   - Firebase Console → Hosting → Release history에서 직전 정상 릴리스 선택 후 **Roll back** 클릭.
   - 또는 CLI로 직전 버전을 복제 배포:
     ```bash
     npx firebase hosting:clone litttl-farm:live@<이전_버전_ID> litttl-farm:live
     ```
2. **Firestore 보안 규칙 롤백 (`back/firestore.rules`)**:
   - 직전 정상 커밋으로 규칙 파일 복원 후 규칙만 단독 배포:
     ```bash
     git checkout <이전_정상_커밋> -- back/firestore.rules
     npx firebase deploy --only firestore:rules
     ```
3. **Node.js 서버(`server.js`) 롤백**:
   - 장애 커밋을 `git revert <커밋_해시>`로 되돌린 뒤 `npm run lint && npm test` 통과를 확인하고 서버 프로세스를 재시작(`npm start`)합니다.
4. **장애 공지**:
   - 복구 전후 현황은 [OPERATIONS.md](./OPERATIONS.md)의 장애 대응 연락망과 공지 절차에 따라 안내합니다.
