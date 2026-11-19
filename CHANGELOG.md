# Changelog

모든 주요 변경 사항은 이 파일에 기록합니다. 버전 표기는 [Semantic Versioning](https://semver.org/lang/KO/)을 따릅니다.

## [Unreleased]

### Added
- 개인정보 동의 전 분석 쿠키·이벤트 차단 배너(`#consentBanner`), 푸터/설정 메뉴의 **분석 쿠키 설정** 모달, 필수 이벤트 6종(`sign_up`, `login`, `tree_connect`, `diary_save`, `cloud_post`, `heart_send`) 계측 구현
- 관리자 데이터 조회·삭제, 장애 대응 연락망·폴백·공지, 고객 신고·삭제 절차를 담은 [OPERATIONS.md](./OPERATIONS.md) 작성
- GitHub Actions 자동 검증 워크플로(`.github/workflows/ci.yml`: lint, test, build, deploy check) 추가
- [DEPLOYMENT.md](./DEPLOYMENT.md) 내 운영 배포·롤백 절차 및 브랜치 보호 기준 문서화

### Changed
- `server.js` 정적 캐시 정책 및 분석 동의 후 스크립트·연결용 CSP 보완, `/js/config.js` `measurementId` 주입 지원
- `.gitignore` 보완 (Firebase 키, 내보내기, 환경 파일, 임시 백업 텍스트 제외)

## [0.1.0] - 2026-11-18

### Added
- 제주 서귀포 벼락밭 감귤나무 키우기 웹 서비스(`front/`, `server.js`, `back/firestore.rules`) 구축
- Google 로그인(Firebase Authentication), 한 계정 한 나무 규칙, 가족 초대 코드·벼락밭 연결·이주 흐름
- `우리 이야기` 일기 작성·수정·삭제·TXT 백업 및 Gemini API 기반 `[나무가]` 감성 답장(일반 회원 24시간 대기 카운트다운, 관리자 즉시 표시, AI 학습 미사용 고지)
- `MET Norway` 실시간 날씨 프록시(`/api/weather`, 5분 캐시·1시간 stale 폴백) 및 IP별 속도 제한
- 구름 24시간 제한·자동 만료 정리, 1일 1회 하트 응원, 관리자 구름/응원/일기 삭제 기능
- 접근성 개선(WCAG 2.2 AA 명도 대비, 본문 바로가기, 시트 포커스 복귀, `aria-live` 상태 알림) 및 오프라인 자동 복구 배너
- `node:test` 기반 핵심 기능 자동 테스트(`tests/app.test.mjs`, 8개 스위트)
