# Research: 공유 링크 기반 젠더리빌 플로우(v2)

Technical Context의 기술 스택은 사용자가 `/speckit-plan` 입력에서 이미 구체적으로 지정했다
(Supabase, Next.js 동적 라우트, Route Handler API). 아래는 그 지정을 실제 설계로 옮기기 위해
검토가 필요했던 항목들의 결정 사항이다.

## 1. Tailwind vs SCSS Modules 드리프트 처리

- **Decision**: 신규 컴포넌트(`ShareLinkBanner`, `ExpiredLinkNotice`)도 기존 컴포넌트와 동일하게
  Tailwind 유틸리티 클래스로 작성한다.
- **Rationale**: 저장소는 이미 헌법 Principle III(SCSS Modules)와 다르게 Tailwind로 구현되어
  있다(001 계획에서 확인된 드리프트, `research.md` #9 참고). "기존 UI/컴포넌트 최대한 재사용,
  디자인 변경 없음"이라는 이번 기능의 명시적 제약을 지키려면 새 컴포넌트도 같은 스타일링 방식을
  써야 시각적·코드 스타일 일관성이 깨지지 않는다.
- **Alternatives considered**: 신규 컴포넌트만 SCSS Modules로 작성 — 같은 화면 안에 두 가지
  스타일링 시스템이 공존하게 되어 오히려 일관성을 해치고, 헌법 위반 해소도 부분적이라 실익이
  없어 기각. 이번 기회에 전체를 SCSS로 되돌리는 리팩터링 — 이 기능(공유 링크)과 무관한 대규모
  변경이라 범위 초과로 기각(별도 정리 작업 필요).

## 2. 공유 링크 식별자 설계

- **Decision**: 별도의 슬러그 생성 로직을 두지 않고, `gender_reveal_events.id`(Postgres
  `gen_random_uuid()`)를 그대로 공유 URL 경로 파라미터(`/gender-reveal/[id]`)로 사용한다.
  `share_link` 컬럼에는 `id`와 동일한 값(문자열)을 저장해 조회 편의성을 확보하되, 조회는 `id`
  기준(PK)으로 수행한다.
- **Rationale**: UUID v4는 122비트의 암호학적 무작위성을 가지므로 링크를 모르는 사람이 존재하는
  링크를 추측으로 접근할 확률은 사실상 0에 가깝다 — spec 작성 중 미해결로 남았던 "링크 예측
  불가능성" 질문에 대한 합리적 기본값이다. 별도의 짧은 코드(nanoid 등)를 추가로 설계하면 고유성
  보장·충돌 처리·엔트로피 검증 등 부가 복잡도만 늘어난다.
- **Alternatives considered**: 순차 증가 정수 ID — 예측 가능해 제3자가 다른 사람의 이벤트 데이터
  (태명, 출산예정일 등 개인정보)를 순회 조회할 수 있어 기각. 별도 nanoid 슬러그 컬럼(UUID와 분리) —
  기능적으로 UUID보다 나은 점이 없고 스키마·조회 로직만 복잡해져 기각.

## 3. '링크 생성' 중복 제출 처리

- **Decision**: `POST /api/events`는 멱등성 검사 없이 호출마다 새 레코드를 insert한다. 클라이언트
  (`StepOneForm`)는 뮤테이션이 진행 중인 동안 제출 버튼을 비활성화해 더블 클릭/중복 네트워크 요청만
  방지한다.
- **Rationale**: spec.md Assumptions에 따라 저장된 콘텐츠는 불변이며 "다른 내용을 공유하려면 새로
  생성"이 기본 정책이다. 같은 입력값으로 여러 레코드가 생겨도 각 링크가 보여주는 콘텐츠는 동일해
  참여자 경험에 차이가 없다 — 서버 측 dedup(예: 입력값 해시로 기존 레코드 재사용)은 이번 범위의
  요구사항을 넘어서는 부가 복잡도다.
- **Alternatives considered**: 입력값 해시 기반 dedup — 동일 태명/날짜/받는사람/성별 조합이 여러
  이벤트에서 우연히 겹칠 수 있어(예: 같은 태명을 쓰는 다른 가족) 오히려 잘못된 링크 재사용을
  유발할 위험이 있어 기각.

## 4. 링크 만료(7일) 계산 및 KST 처리

- **Decision**: `link_expires_at`은 서버(Route Handler)에서 `date-fns`의 `addDays(now, 7)`로
  계산해 저장하고, 만료 판정도 서버(`GET /api/events/[id]`)에서 `isAfter(new Date(), expiresAt)`로
  수행해 `expired: boolean` 필드로 응답한다. 기존 `src/lib/date.ts`의 KST 포맷 헬퍼 옆에 만료 계산
  헬퍼(`addDaysKst` 또는 동일 파일 내 함수)를 추가해 재사용한다.
- **Rationale**: 헌법 Principle V가 날짜 계산/표시를 KST 기준으로 요구한다. 만료 판정을 서버에서
  수행하면 클라이언트 시계 조작이나 타임존 차이로 인한 판정 불일치를 방지할 수 있고, 참여자 화면은
  서버가 내려준 `expired` 플래그만 신뢰하면 되어 로직이 단순해진다.
- **Alternatives considered**: 클라이언트에서 `created_at + 7일`을 직접 계산 — 사용자 기기의
  시스템 시간이나 타임존 설정에 따라 오판정이 발생할 수 있어 기각.

## 5. `ResultReveal`의 "새로 만들기" 동작 분기

- **Decision**: `ResultReveal`에 `onCreateNew?: () => void` prop을 추가한다. 생성자 라우트
  (`/gender-reveal`)에서는 prop을 넘기지 않아 기존 `resetAll()`(step1로 복귀) 동작을 유지하고,
  공유 링크 라우트(`/gender-reveal/[id]`)에서는 `() => router.push('/gender-reveal')`을 넘겨
  참여자가 "새로 만들기"를 누르면 자신도 생성자로서 새 이벤트를 시작할 수 있는 루트로 이동시킨다.
  '뒤로가기'(`restart`, 풍선 카운트만 초기화)는 두 경로 모두 순수 로컬 동작이라 그대로 둔다.
- **Rationale**: 공유 링크 라우트에는 애초에 `StepOneForm`이 렌더 트리에 없으므로(spec.md FR-006),
  기존처럼 `resetAll()`이 `step`을 `'input'`으로 바꿔도 그 라우트에서는 아무 화면도 그릴 수 없는
  빈 화면 버그가 된다. prop 기반 분기가 `ResultReveal` 내부 조건 분기(현재 라우트를 컴포넌트가
  스스로 안다고 가정)보다 계약이 명확하고 테스트하기 쉽다.
- **Alternatives considered**: 공유 링크 라우트에도 `StepOneForm`을 렌더링 가능하게 두고 `resetAll`
  그대로 사용 — spec.md FR-006("step1은 노출되지 않음")을 정면으로 위반해 기각.

## 6. 생성자/참여자 공용 데이터 하이드레이션 전략

- **Decision**: `/gender-reveal/[id]` 페이지는 생성자·참여자를 구분하지 않고 항상
  `useGenderRevealEvent(id)`(TanStack Query)로 `GET /api/events/[id]`를 호출해 응답으로
  `genderRevealStore`를 하이드레이션한 뒤 `BalloonStage`/`ResultReveal`을 렌더링한다. 생성자가
  방금 `POST /api/events`로 받은 로컬 응답이 있어도 별도로 신뢰하지 않는다(단, 최초 진입 시 로딩
  스피너 대신 스켈레톤을 보여주기 위해 mutation 응답을 쿼리 캐시의 초기값(`initialData`)으로
  넘겨줄 수는 있다).
- **Rationale**: "동일한 공유 링크로 접속하는 모든 사용자에게 동일한 콘텐츠"(FR-012)와 "새로고침
  해도 동일 내용 유지" 엣지 케이스를 하나의 코드 경로(항상 서버 재조회)로 만족시킬 수 있다. 생성자
  전용 분기를 따로 두면 생성자와 참여자가 서로 다른 코드 경로를 타게 되어 두 경로 간 불일치 버그
  위험이 커진다.
- **Alternatives considered**: 생성자는 `POST` 응답을 그대로 로컬 상태에 반영하고 재조회하지 않음 —
  구현은 더 간단하지만 생성자가 새로고침했을 때 별도 처리(재조회 로직)를 다시 만들어야 해 오히려
  코드 경로가 두 배로 늘어나 기각.

## 7. Supabase 클라이언트 접근 범위

- **Decision**: `@supabase/supabase-js` 클라이언트는 `src/lib/supabase/server.ts` 한 곳에서만
  생성하고, 이 모듈은 Route Handler(`app/api/events/route.ts`, `app/api/events/[id]/route.ts`)
  에서만 import한다. 브라우저에서 실행되는 컴포넌트/훅은 Supabase를 직접 호출하지 않고, 항상
  자체 API(`/api/events*`)를 axios로 호출한다.
- **Rationale**: 사용자가 명시한 제약("Supabase client는 서버 사이드에서만 사용, service role
  key는 서버 환경변수로만 관리")을 그대로 코드 구조에 반영한다. 클라이언트 → 자체 API → Supabase
  경로로 고정하면 DB 자격 증명이 브라우저 번들에 노출될 경로 자체가 없다.
- **Alternatives considered**: `@supabase/ssr` 등으로 브라우저에서 anon key를 사용해 직접 Supabase
  를 호출 — anon key만으로는 이 테이블에 RLS 정책을 별도로 설계해야 하는 부가 작업이 필요하고,
  사용자가 이미 "서버 사이드에서만 사용"을 명시했으므로 기각.

## 8. 테스트/Storybook 범위

- **Decision**: 신규 Route Handler 2개, Supabase 클라이언트 팩토리, 두 TanStack Query 훅,
  `genderRevealStore`의 하이드레이션 액션, `lib/date.ts`의 만료 계산 헬퍼, `ShareLinkBanner`,
  `ExpiredLinkNotice`, 그리고 `ResultReveal`의 `onCreateNew` 분기에 대해 Jest 테스트를 작성한다.
  `ShareLinkBanner`, `ExpiredLinkNotice`는 Storybook 스토리도 추가한다.
- **Rationale**: 헌법 Principle VI가 신규/변경된 컴포넌트·유틸에 대한 Jest 테스트와, 공유
  컴포넌트에 대한 Storybook 스토리를 요구한다. 이번 기능은 API/DB 경계가 새로 생기므로 Route
  Handler 단위 테스트(성공/404/만료 3가지 케이스)를 명시적으로 포함해야 회귀를 막을 수 있다.
- **Alternatives considered**: Playwright E2E로 전체 생성→공유→참여 흐름 검증 — 프로젝트 헌법에
  명시된 테스트 도구는 Jest뿐이라 이번 범위에서는 제외(향후 필요 시 별도 헌법 개정 논의).
