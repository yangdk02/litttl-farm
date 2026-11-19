# LITTTL. FARM 백엔드

이 폴더에는 보안 규칙과 날씨 프록시 설정을 둡니다.

## 구성

- `firestore.rules`: 회원, 나무, 구름, 일기 데이터 접근 규칙
- `firebase.json`: Firebase CLI가 보안 규칙을 찾기 위한 설정
- `worker.js`: MET Norway 실시간 기상 자료를 중계하는 `/api/weather` 프록시
- `wrangler.toml.example`: Cloudflare Worker 배포 설정 예시

실제 회원 데이터는 소스 파일에 저장하지 않고 Firebase Authentication과 Firestore에 저장합니다. 날씨 응답은 Worker와 브라우저 어디에도 저장하지 않습니다.

## Firebase 연결

1. Firebase Authentication에서 Google 로그인을 활성화합니다.
2. Firestore Database를 생성합니다.
3. 이 폴더에서 `firebase deploy --only firestore:rules`를 실행합니다.
4. Firebase 웹 앱의 공개 설정값을 `front/js/config.js`의 `CONFIG.firebase`에 입력합니다.

## 날씨 프록시 연결

1. `wrangler.toml.example`을 `wrangler.toml`로 복사합니다.
2. `wrangler deploy`로 Worker를 배포합니다.
3. 프런트와 같은 도메인의 `/api/weather`로 연결하거나 `front/js/config.js`의 `CONFIG.weather.endpoint`를 확인합니다.

기본 관측 좌표는 제주 서귀포시 보성리 벼락밭(`33.249, 126.278`, MET Norway)입니다.
