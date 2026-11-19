# LITTTL. FARM. 백엔드 구성

이 폴더에는 `LITTTL. FARM.`의 Firestore 보안 규칙과 Cloudflare Worker용 날씨 프록시 예시가 들어 있습니다.

## 주요 파일

- `firestore.rules`: 회원, 나무, 구름, 일기, 응원 데이터 접근 규칙입니다.
- `firebase.json`: `back/` 폴더 기준으로 규칙을 단독 배포할 때 사용하는 설정입니다.
- `worker.js`: MET Norway 기상 자료(`/api/weather`)를 중계하는 Worker 스크립트입니다.
- `wrangler.toml.example`: Cloudflare Worker 배포 설정 예시입니다.

실제 서비스 데이터는 소스 코드에 저장하지 않고 Firebase Authentication과 Cloud Firestore에 보관하며, 기상 API 응답은 별도 DB에 저장하지 않습니다.

## 규칙 배포

프로젝트 루트에서 `npm run deploy`를 실행하거나, 이 폴더에서 아래 명령으로 보안 규칙만 배포합니다.

```bash
firebase deploy --only firestore:rules
```

## 기상 프록시

기본 Node.js 서버(`server.js`)가 `/api/weather` 경로로 서귀포시 보성리 벼락밭(`33.249, 126.278`, MET Norway) 날씨를 중계합니다. 정적 호스팅만 따로 운영할 경우 `worker.js`와 `wrangler.toml.example`을 참고해 별도 Worker로 배포할 수 있습니다.
