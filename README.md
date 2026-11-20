# LITTTL. FARM.

제주 서귀포시 보성리 벼락밭 감귤나무와 함께 사계절을 기록하고 가족과 마음을 나누는 웹 서비스입니다.

## 안내 문서 목록

이용자용 안내
- [사용자 안내서 (USER_GUIDE.md)](./USER_GUIDE.md) — 로그인부터 나무 연결, 돌보기, 우리 이야기 작성, 구름 띄우기와 이웃 나무 구경까지 실제 화면 순서대로 자세히 안내합니다.

관리자·운영 안내
- [관리자 안내 및 인수인계서 (ADMIN_GUIDE.md)](./ADMIN_GUIDE.md) — 정식 관리자 계정으로 권한을 옮겨 받는 절차와 나무 코드 발급, 구름·방명록·일기 관리 및 계정·나무 정리 방법을 단계별로 안내합니다.
- [배포 및 롤백 안내 (DEPLOYMENT.md)](./DEPLOYMENT.md) — 웹 화면과 서버 배포, 자동 검증, 문제 발생 시 이전 상태로 되돌리는 기술 절차입니다.
- [백엔드 구성 (back/README.md)](./back/README.md) — 데이터 접근 규칙과 제주 기상 정보 프록시 설정을 정리했습니다.
- [오픈 점검표 (SERVICE_LAUNCH_CHECKLIST.md)](./SERVICE_LAUNCH_CHECKLIST.md) — 공개 전후로 확인하는 기능, 보안, 법무, 배포 항목입니다.
- [변경 기록 (CHANGELOG.md)](./CHANGELOG.md) — 버전별 주요 변경 사항을 기록합니다.

## 로컬에서 실행하기

개발 환경에서 실행할 때는 Node.js 18 이상이 필요하며, 아래 명령으로 실행합니다.

```bash
npm install
npm run dev
```

실행 후 브라우저에서 `http://localhost:3000`으로 접속합니다.
