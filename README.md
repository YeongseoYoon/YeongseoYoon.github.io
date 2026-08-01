# 끝없는 수족관 (Endless Aquarium)

사람들이 직접 그린 물고기·해초·장식물을 검토 후 공개 바다에 **방류**하고, 다른 사람이 남긴 생물과 짧은 메시지를 탐험하며 발견하는 **공동 창작형 웹 수족관**. ([PRD](#) 기반 MVP)

- **플랫폼**: [앱인토스(Apps in Toss)](https://developers-apps-in-toss.toss.im/) **WebView** 앱 — 가입 없이 토스 계정으로 이용, 운영 콘솔은 지정된 계정만 접근
- **스택**: React 18 · Vite · TypeScript · Tailwind CSS · React Router
- **아키텍처**: Feature-Sliced Design (FSD) + SOLID + 토스 프론트엔드 펀더멘털(가독성·예측 가능성·응집도·결합도)

---

## 빠른 시작

```bash
npm install
npm run dev        # http://localhost:5173
```

| 스크립트 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 (Vite) |
| `npm run build` | 타입체크 후 프로덕션 번들 |
| `npm run lint` | 타입 검사만 (`tsc --noEmit`) |
| `npm test` | 테스트 (Vitest, 73개) |
| `npm run test:watch` | 테스트 감시 모드 |

로컬(앱인토스 밖)에서는 자동으로 **기기 식별 + 목업 데이터**로 동작해, 토스 없이도 전체 흐름을 체험할 수 있습니다. 하단 내비로 화면을 이동하세요.

---

## 반응형

**모바일 퍼스트 + 전 화면 대응**. 고정 폰 프레임(390×844)을 쓰지 않고 뷰포트를 그대로 채웁니다.

- `Screen` 셸 두 종류: `full`(탐험 지도 — 넓을수록 좋으니 전체 화면), `content`(그리기·내 수조 — 넓은 화면에서 최대 폭 제한 + 가운데 정렬)
- 그리기 캔버스는 36:32 비율을 유지하며 폭에 맞춰 늘어남 (최대 520px)
- 지도는 컨테이너 크기를 `ResizeObserver` + `visualViewport`로 추적 — 브라우저 배율을 바꿔도 바닥이 유지됨
- 운영 콘솔은 좁은 화면에서 세로로 쌓이고, 넓어지면 큐+상세 2단
- 바텀시트·모달은 넓은 화면에서 폭 제한, 하단은 `env(safe-area-inset-bottom)` 반영

## 아키텍처 노트 (성능·저장)

### 오픈월드 카메라
바다는 **가로로 무한**하다. 예전에는 "월드는 유한한 사각형이고 항상 화면을 덮어야 한다"는 제약을 뒀는데,
브라우저 배율·창 크기가 바뀔 때마다 이 제약이 깨져 바닥이 사라지거나 빈 물이 보였다. 지금은:

- 바닥(모래)은 월드가 아니라 **화면 공간 레이어**로 그린다 → 어떤 크기·배율에서도 항상 보인다.
- 세로는 카메라 고정(바닥선이 늘 화면 하단), 가로만 드래그·줌. 생물은 바닥 위 `SWIM_BAND` 안에 배치된다.
- **최소 줌 = 생물이 차지한 영역이 화면을 채우는 배율**(화면 크기에 따라 동적). 고정값으로 두면 큰 화면에서
  생물이 한구석에만 몰려 보이므로, 화면이 커질수록 하한도 올려 **빈 물로 줌아웃하는 것 자체를 막는다**.
  생물이 늘어 월드가 넓어지면 하한은 자연히 내려가 더 넓게 볼 수 있다.

### 좌표 고정 (`entities/creature/model/worldCoords.ts`)
방류 시 **슬롯 번호 → 월드 좌표**를 결정론적으로 계산해 영구 저장한다.
슬롯은 재사용하지 않으므로 누가 몇 마리를 더 풀어도 **기존 생물은 절대 움직이지 않는다**.
헤엄치는 위치는 앵커 주변을 도는 **클라이언트 연출**이라 저장하지 않고 사용자 간 동기화도 필요 없다.

### 렌더 성능
- **뷰포트 컬링**: 화면 밖 생물은 DOM에서 언마운트되고 RAF 대상에서도 빠진다. 컬링 경계는 격자로 스냅해 리렌더를 줄인다.
- **캔버스 래스터화**: 사용자 그림을 SVG `<rect>` 최대 1,152개로 그리던 것을 캔버스로 한 번 구워 `<img>` **1노드**로 렌더한다(코드별 캐시).
- **LOD**: 넓게 보면 그림자·메시지를 끈다.
- 위치는 JSX가 아니라 RAF가 `transform`으로 직접 쓴다 → 팬/줌 리렌더가 헤엄을 되돌리지 않는다.

### 저장 (`shared/lib/spriteCodec.ts`, `shared/api/localStore.ts`)
- 스프라이트는 **팔레트 + RLE 문자열**로 직렬화한다. 36×32 그림이 실측 **51자** (JSON 배열 대비 수백 배 절감).
  서버에는 이 문자열 하나만 저장하면 된다(TEXT 컬럼 1개, 인덱싱 불필요).
- 로컬 저장은 **IndexedDB**(모바일/WebView 대응, 용량 크고 비동기). 실패 시 localStorage로 자동 폴백.

## 화면 (PRD 7)

| 경로 | 화면 | 설명 |
| --- | --- | --- |
| `/` | 수족관 탐험 | **지도형 바다** — 드래그 팬 + 줌(버튼/휠/핀치). 생물이 많아질수록 월드가 넓어지고, **좁게 보면** 생물이 커지며 한마디가 보이고 **넓게 보면** 작아지며 메시지는 숨음. 생물 클릭 → 상세 → 신고. `/?focus=<id>`로 특정 생물 위치로 이동·강조 |
| `/draw` | 생물 그리기 | 36×32 픽셀 캔버스, 12색 프리셋 **+ 컬러피커**, 브러시/스포이드/지우개, 따라 그리기 **밑그림**, 한마디(30자), "방류하기" |
| `/my-tank` | 내 수조 | 내 생물 미리보기, **기기/계정당** 일별 방류 한도, 한마디 수정·**삭제**·바다로 이동, 임시저장 이어 그리기, 숨김/반려 시 **원본 불러와 다시 그리기** |
| `/admin` | 운영 콘솔 | **운영 권한이 있는 신원만** 접근. **신고 큐 중심**(사후 검토) + 검토 대기, 숨김/반려(+사유 기록), 구역 관리 |

**검토 모델**: 방류하면 **바로 공개**되고, 다른 사용자의 **신고가 쌓이면** 운영자가 검토(숨김/반려)합니다(사후 검토, PRD 7.4). 상태 머신(PRD 8.1): `draft → published → hidden → deleted`, 신고 검토 결과 `→ rejected`. 누적 신고 임계 초과 시 자동 임시 숨김.

---

## 폴더 구조 (FSD)

레이어는 아래에서 위로만 의존합니다: `shared → entities → features → widgets → pages → app`.

```
src/
├── app/           # 앱 진입, 라우터, 전역 레이아웃
├── pages/         # 화면 컴포지션 (explore · draw · my-tank · admin)
├── widgets/       # 큰 조립 블록 (aquarium-map · creature-detail-sheet · my-tank · admin-review)
├── features/      # 유스케이스 (release-creature · edit-creature · report-creature · moderate-creature)
├── entities/      # 도메인 모델 (creature · zone · user · report · moderation-log · session)
│   └── <e>/{model,ui,api}   # 각 엔티티: 타입·상태머신·리포지토리 인터페이스 + mock 구현
└── shared/        # 재사용 인프라 (ui 킷 · lib 순수 유틸 · api mock 저장소 · config)
```

**설계 원칙 (SOLID · 토스 FF)**
- **SRP**: 그리기 상태(`useDrawing`)와 캔버스 렌더(`PixelCanvas`) 분리, 좌표 계산(`slotToPoint`)·스프라이트 코덱은 순수 함수.
- **OCP**: 상태 전이(`status.ts`)·밀도 스케일·버튼 변형을 데이터 맵으로 선언 — 확장 시 사용처 불변.
- **DIP**: 화면/피처는 각 엔티티가 노출한 **리포지토리 추상**에만 의존. 데이터 소스가 mock인지 실서버인지 모릅니다.

---

## 데이터 계층 (mock → 실서버 교체)

> 서버 스키마·인증·실시간 설계는 [`docs/BACKEND.md`](./docs/BACKEND.md) 참고.
> 테스트 케이스 목록은 [`docs/TEST_CASES.md`](./docs/TEST_CASES.md).

- 모든 도메인 접근은 각 엔티티의 `api`(예 `creatureApi`)를 통합니다. 인터페이스는 `model/repository.ts`에 정의.
- 현재 구현은 `shared/api/mockDb.ts`의 **IndexedDB 기반 저장소**(인위적 지연 포함, localStorage 폴백)입니다.
- **실서버 전환**: 각 `entities/*/api/*Api.ts`의 구현만 `fetch` 호출로 바꾸면 됩니다. UI/피처 코드는 그대로.

---

## 앱인토스(Apps in Toss) 전환

이 저장소는 앱인토스 **WebView** 규격(Vite+React+TS)에 맞춰져 있습니다.

- `@apps-in-toss/web-framework` 의존성 + [`granite.config.ts`](./granite.config.ts) 포함.
- 신원은 `entities/session/model/auth.ts`에서 처리:
  - 토스 환경: `getAnonymousKey()` 해시를 신원으로 사용 → **가입/백엔드 없이** 사용자 식별·방류 한도·운영 권한 판별.
  - 로컬: `localStorage` 기기 id로 폴백.

### 배포 전 직접 해야 하는 일 (토스 계정 필요 — 대신 처리 불가)

1. **[앱인토스 콘솔](https://apps-in-toss.toss.im/)에서 앱 등록** → 발급받은 `appName`/아이콘을 `granite.config.ts`에 반영.
2. **운영자 지정(나만 콘솔 보기)**: 토스 앱에서 `/admin`에 접속하면 화면에 "내 키"가 표시됩니다. 그 값을 `.env`의 `VITE_ADMIN_KEYS`에 넣고 다시 배포하세요. (여러 명이면 쉼표로 구분)
3. **샌드박스 테스트**: `granite.config.ts`의 `web.host`를 기기 IP로 바꾸고, 토스 샌드박스 앱에서 `intoss://endless-aquarium` 딥링크로 실행.
4. (선택) **전체 로그인/프로필**이 필요하면 `appLogin()` + 서버 토큰 교환(`/api-partner/v1/apps-in-toss/user/oauth2/generate-token`, mTLS 파트너 인증서)을 붙입니다. 토큰 교환은 보안상 반드시 서버에서 처리하세요.

> ⚠️ 현재 운영 권한 판별은 클라이언트에서 이뤄집니다(데모/샌드박스용). 실제 보안이 필요하면 익명 키를 **서버에서 검증**하세요.

---

## 디자인

`tailwind.config.ts`에 디자인 핸드오프의 토큰(브랜드 teal `#21AFBF`, semantic 색, `swimBob`/`weedSway`/`jellyFloat` 애니메이션)을 이식했습니다. 픽셀 스프라이트는 `public/assets/*.png`. 첫 공개 수조 정서는 **귀여운 열대어**.
