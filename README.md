<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# LITTTL. FARM (리틀팜 귤나무 키우기)

제주 서귀포 벼락밭 감귤나무 키우기 및 가족 공유 서비스입니다.

---

## 📚 문서 안내 (Documentation Index)

프로젝트와 관련된 모든 마크다운 문서 목록입니다. 사용자와 관리자(운영자) 관점으로 분류되어 있습니다.

### 👤 사용자(Visitor & Member) 관점
- **[메인 소개 (README.md)](./README.md)**: 서비스 개요, 주요 기능 및 로컬 실행 방법 안내.

### 🛠️ 관리자 및 개발자(Administrator & Developer) 관점
- **[운영 매뉴얼 (OPERATIONS.md)](./OPERATIONS.md)**: 분석 이벤트 설계, 관리자 데이터 조회·삭제, 장애 대응 연락망·공지, 신고·삭제 처리 절차.
- **[배포 및 롤백 가이드 (DEPLOYMENT.md)](./DEPLOYMENT.md)**: Google 로그인·서버 검증, Firebase Hosting 미리보기·운영 배포 및 장애 롤백 절차.
- **[변경 기록 (CHANGELOG.md)](./CHANGELOG.md)**: 버전별 릴리스 노트 및 주요 변경 이력.
- **[서비스 오픈 체크리스트 (SERVICE_LAUNCH_CHECKLIST.md)](./SERVICE_LAUNCH_CHECKLIST.md)**: 회원, 데이터, 보안, 외부 API, 법무, Git 등 9개 분야 점검 항목 기록.
- **[백엔드 설정 (back/README.md)](./back/README.md)**: Firestore 보안 규칙 및 MET Norway 날씨 프록시 서버 설정 안내.

---

## 🚀 배포 절차 및 자동 배포가 안 되는 이유

### ⚠️ 자동 배포가 안 되는 이유
로컬 환경이나 미리보기 컨테이너에서 `npm run deploy`를 실행했을 때 배포가 되지 않거나 멈추는 가장 흔한 이유는 **Firebase CLI 로그인 인증(`firebase login`)**이 완료되지 않았기 때문입니다. Firebase 배포 명령어는 터미널에서 개발자 계정 인증이 선행되어야 정상적으로 호스팅과 규칙을 반영할 수 있습니다.

### 📋 올바른 배포 절차 (터미널)
1. **의존성 설치**:
   ```bash
   npm install
   ```
2. **Firebase CLI 로그인 (최초 1회)**:
   ```bash
   npx firebase login
   ```
3. **프로덕션 빌드 및 배포 전 검증**:
   ```bash
   npm run build
   npm run check:deploy
   ```
4. **미리보기 채널 배포 (테스트용 URL)**:
   ```bash
   npm run deploy:preview
   ```
5. **운영 배포 (Hosting + Firestore Rules)**:
   ```bash
   npm run deploy
   ```

---

## 💻 로컬 실행 방법 (Run Locally)

**Prerequisites:** Node.js (>= 18)

1. 의존성 설치:
   ```bash
   npm install
   ```
2. 앱 실행 (포트 3000):
   ```bash
   npm run dev
   ```
