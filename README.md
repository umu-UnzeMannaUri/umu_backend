# calendar-backend (NestJS)

일정 공유 / 비는시간 찾기 앱의 백엔드. PostgreSQL + Prisma + JWT 기반 인증.

## 구조

```
src/
  auth/         OAuth(구글/카카오/네이버) 로그인 → JWT 발급
  users/        내 정보, 비는시간 탐색 min/max 시간 설정
  groups/       그룹 생성/참여, 그룹 캘린더(멤버 비공개 일정은 "비공개 일정"으로 마스킹)
  schedules/    개인 일정 CRUD (isPrivate 토글)
  free-time/    핵심 알고리즘: 여러 명의 일정을 합쳐 비는 시간 계산
  appointments/ 약속 생성(참여자 전원 캘린더에 자동 반영), 알림은 클라이언트가 예약
  weather/      기상청 API 연동 + 날씨 기반 놀거리 추천
  feedback/     피드백 등록/조회
prisma/schema.prisma  전체 데이터 모델
```

## 로컬 실행

```bash
npm install
cp .env.example .env   # DATABASE_URL, JWT_SECRET, KMA_API_KEY 채우기
npx prisma migrate dev --name init
npm run start:dev
```

기본적으로 `http://localhost:3000/api` 아래에 모든 라우트가 걸립니다.

## 인증 흐름

이 서버는 OAuth 자체를 처리하지 않습니다. iOS 앱에서 구글/카카오/네이버 SDK로
로그인한 뒤 발급받은 **provider access token**을 아래로 보내면, 서버가 각 provider의
사용자 정보 API로 토큰을 검증하고 우리 서비스의 JWT를 발급합니다.

```
POST /api/auth/login
{ "provider": "KAKAO", "accessToken": "..." }

→ { "accessToken": "<우리 JWT>", "user": { ... } }
```

이후 모든 요청에 `Authorization: Bearer <JWT>` 헤더를 붙이면 됩니다.

## 비는 시간 계산 API

```
GET /api/free-time?userIds=uid1,uid2&from=2026-08-20&to=2026-08-24
    &mode=duration&durationMinutes=120&minHour=9&maxHour=22
```

- `mode=duration`: n시간(분) 이상 비는 슬롯 목록 반환
- `mode=fullday`: 하루 전체(min~maxHour)가 완전히 비는 날짜 목록 반환
- `minHour`/`maxHour` 생략 시 참여자 각자의 저장된 설정값 중 교집합을 사용 (기본 8~20시)

## 배포 — Render

1. 이 레포를 GitHub에 push
2. Render 대시보드 → **New → PostgreSQL** 로 DB 인스턴스 생성 (Internal Database URL 복사)
3. Render 대시보드 → **New → Web Service** → 방금 push한 레포 연결
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npx prisma migrate deploy && npm run start:prod`
   - Environment: Node
4. Environment Variables 등록
   - `DATABASE_URL` = 2번에서 만든 Postgres Internal URL
   - `JWT_SECRET` = `openssl rand -hex 32` 로 생성한 랜덤 문자열
   - `KMA_API_KEY` = 공공데이터포털에서 발급받은 기상청 서비스키
5. Deploy 후 발급되는 `https://xxxx.onrender.com` 을
   - 카카오 개발자센터 / 네이버 개발자센터의 **Redirect URI**로는 필요 없음 (OAuth 자체는 앱에서 네이티브 SDK로 처리하므로)
   - 대신 iOS 앱의 `baseURL` 상수에 그대로 등록

Free 플랜은 일정 시간 미사용 시 슬립 모드로 들어가 첫 요청이 느릴 수 있습니다.

## 참고

- 이 샌드박스 환경은 `binaries.prisma.sh` 접근이 막혀 있어 로컬에서 `prisma generate`의
  쿼리 엔진 바이너리 다운로드가 실패했지만, TypeScript 타입 체크(`tsc --noEmit`)는 전체
  통과했습니다. 실제 개발 PC나 Render 빌드 환경은 일반 인터넷 접근이 가능하므로
  `npm install && npx prisma generate && npm run build`가 정상 동작합니다.
