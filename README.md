# 국립세종수목원 식물도감 (Plant Passport)

별도 앱 설치나 회원가입 없이, 모바일 웹 브라우저에서 즉시 실행되는 **국립세종수목원 식물 수집 게이미피케이션 웹 서비스**입니다. 관람객이 지도를 보고 식물을 찾아가 푯말의 QR코드를 스캔하면 도감이 채워지고 뱃지를 획득합니다.

## 주요 기능

- **무설치 · 즉시 실행**: URL 접속만으로 모든 기능이 모바일 웹에서 동작
- **QR URL 자동 수집**: `?collect=plant_001` 형식으로 접속하면 로딩 즉시 도감에 등록 + 축하 팝업 + 폭죽 효과
- **무로그인 저장**: `localStorage`에 수집 진행률과 뱃지를 자동 보존
- **랜덤 목표 미션**: 사용자마다 전체 식물 중 랜덤 5종을 목표로 배정 (재방문 시 유지)
- **단계형 인터랙티브 지도**: 현재 찾아야 할 식물 1개의 핀만 표시, 클리어하면 다음 목표로 진행
- **포켓몬 도감 스타일**: 미수집은 실루엣, 수집 완료는 풀컬러 카드 + NEW 뱃지
- **업적 뱃지 & 완료 인증 카드**: 미션 완료 시 SNS 공유용 인증 카드 생성
- **웹 내 QR 스캐너**: `html5-qrcode` 기반 카메라 스캔 모달

## 기술 스택

- 순수 HTML / CSS / JavaScript (빌드 도구 불필요)
- Storage: 브라우저 `localStorage`
- Effects & Icons: [lucide](https://lucide.dev), [canvas-confetti](https://github.com/catdad/canvas-confetti)
- QR: [html5-qrcode](https://github.com/mebjas/html5-qrcode), `URLSearchParams` 라우팅

## 파일 구조

```
plant-passport/
├── index.html          # 앱 화면 구조 (탭, 모달)
├── style.css           # 보태니컬 테마 스타일
├── app.js              # 앱 로직 (수집/지도/도감/뱃지/스캐너)
├── data.js             # 식물 30종 · 구역 · 뱃지 데이터
└── assets/
    └── sejong-map.png  # 국립세종수목원 안내도 (직접 추가 필요)
```

## 로컬 실행

```bash
cd plant-passport
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000` 접속.
QR 흐름 테스트는 `http://localhost:8000/?collect=plant_003` 처럼 파라미터를 붙이면 됩니다.

> QR 카메라 스캔은 브라우저 정책상 HTTPS 또는 localhost 환경에서만 동작합니다.

## 개발자 콘솔 헬퍼

```js
SejongDex.quest()        // 내게 배정된 목표 5종 id
SejongDex.collect("plant_003")  // 특정 식물 수집 시뮬레이션
SejongDex.reroll()       // 목표 5종만 새로 뽑기
SejongDex.reset()        // 완전 초기화 + 새 목표 재배정
SejongDex.collectAll()   // 목표 전부 수집 (완료 화면 확인)
```
