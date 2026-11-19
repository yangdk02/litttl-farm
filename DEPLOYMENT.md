# LITTTL. FARM 배포 순서

Firebase Hosting, Firebase Authentication, Cloud Firestore를 한 프로젝트에서 사용합니다.

## 현재 연결 상태 (2026-11-17)

- Firebase 프로젝트: `litttl-farm`
- 기본 Hosting 주소: `https://litttl-farm.web.app`
- 미리보기 주소: `https://litttl-farm--preview-8e5xbme1.web.app` (2026-11-24 만료)
- Authentication: 이메일/비밀번호 사용 설정 완료
- Firestore: Standard, 서울 `asia-northeast3`, 규칙 배포 완료
- 요금제: 무료 Spark (유료 백업 사용 안 함)

## 1. 최초 한 번만 할 일

1. `npm install`
2. `npx firebase login`
3. Firebase Console에서 새 프로젝트를 만듭니다.
4. Authentication에서 **이메일/비밀번호** 로그인을 활성화합니다.
5. Firestore Database를 생성합니다. 운영 지역은 한국 사용자 기준 가까운 리전을 선택합니다.
6. 프로젝트에 웹 앱을 등록하고 SDK 설정값을 확인합니다.
7. `.env.firebase.example`을 `.env.firebase`로 복사한 뒤 네 값을 입력합니다.
8. `npx firebase use --add`로 이 폴더와 Firebase 프로젝트를 연결합니다.

## 2. 로컬 확인

```powershell
npm run build
npm run check:deploy
npm run preview:local
```

브라우저에서 `http://127.0.0.1:5000`을 열어 회원가입, 로그인, 나무 연결을 확인합니다.

## 3. 임시 미리보기 배포

```powershell
npm run deploy:preview
```

명령이 출력한 임시 URL에서 모바일·데스크톱 화면과 회원 기능을 확인합니다.

## 4. 운영 배포

```powershell
npm run deploy
```

배포가 끝나면 `https://프로젝트ID.web.app` 주소로 공개됩니다.

## 5. 이후 수정 배포

원본은 `mockup/litttl-farm.html`입니다. 원본을 수정한 뒤 다음 명령만 실행합니다.

```powershell
npm run deploy:preview
npm run deploy
```

운영 배포 전에 개인정보처리방침, 이용약관, 회원 탈퇴 및 데이터 삭제 절차를 실제 운영 주체 정보에 맞춰 확정해야 합니다.
