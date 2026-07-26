# Implementation Plan: 공유 링크 기반 젠더리빌 플로우(v2)

**Branch**: `002-shareable-link-flow` | **Date**: 2026-07-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-shareable-link-flow/spec.md`

## Summary

생성자(유저1)가 기존 step1(태명·출산예정일·받는사람·성별)을 입력하고 '링크 생성'을 클릭하면,
서버(Supabase Postgres)에 이벤트 레코드가 저장되고 그 레코드의 `id`를 경로로 사용하는 공유 링크
(`/gender-reveal/[id]`)가 발급된다. 생성자는 발급 즉시 자신도 그 링크의 step2(풍선 인터랙션)로
진입해 참여자와 동일한 경험을 이어가고, 화면 상단에는 링크를 복사할 수 있는 배너가 함께 노출된다.
참여자(유저2)는 이 링크로 접속하면 step1 화면 없이 곧바로 step2부터 시작하며, 서버에 저장된 값이
그대로 반영된다. 링크는 생성 시각(KST) 기준 7일간 유효하며, 만료된 링크는 전용 안내 화면을,
존재하지 않는 링크는 Next.js 404를 반환한다. 여러 사용자가 같은 링크로 접속해도 콘텐츠(입력값)는
항상 동일하지만, 풍선 터치 진행 상태는 각자의 브라우저에서 독립적으로 관리된다(spec.md
Assumptions). 저장된 이벤트 데이터는 생성 후 불변이며 수정/재발급 API는 제공하지 않는다.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 14 (App Router), Node.js ≥18.18

**Primary Dependencies**: 기존 — React(Next.js 내장), Zustand(클라이언트 상태), date-fns(KST 포맷),
Tailwind CSS(기존 드리프트, research.md #1 참고). 신규 추가 — `@supabase/supabase-js`(서버 전용
Postgres 클라이언트), `axios` + `@tanstack/react-query`(프로젝트 헌법 Principle IV가 이미 요구하나
이 기능 이전에는 원격 데이터가 없어 미설치 상태였음 — 이번 기능부터 실제로 필요해져 설치한다).

**Storage**: Supabase(Postgres) 테이블 `gender_reveal_events` 1개. 서버 전용 클라이언트로만
접근하며 브라우저 번들에는 DB 자격 증명을 포함하지 않는다(data-model.md 참고).

**Testing**: Jest + Testing Library(컴포넌트/유틸/Route Handler 단위), Storybook(신규 컴포넌트
문서화)

**Target Platform**: 모바일·PC 웹 브라우저(반응형, 한국어 UI), 생성자·참여자 모두 동일 브라우저
환경 가정, iOS Safari 공유 시트 제약은 기존 `ResultReveal.tsx` 처리 유지

**Project Type**: 웹 애플리케이션 — 단일 Next.js 프로젝트 안에 App Router 페이지 + Route Handler
API를 함께 둔다(별도 백엔드 서비스/레포 분리 없음)

**Performance Goals**: 링크 발급 10초 이내(SC-001), 참여자 접속 후 step2 노출 3초 이내(SC-002) —
둘 다 Supabase 단일 행 insert/select 기준으로 충분히 달성 가능한 목표

**Constraints**: Supabase 자격 증명(URL, anon key, 필요 시 service role key)은 서버 환경 변수로만
관리하고 Route Handler 내부에서만 사용한다(사용자 지시). 링크 유효기간(7일)과 만료 판정은 KST
기준으로 계산한다(헌법 Principle V). 저장된 이벤트 콘텐츠는 생성 후 불변(수정 API 없음, spec.md
Assumptions).

**Scale/Scope**: 개인 이벤트 성격의 소규모 트래픽(링크 하나당 소수의 접속자). 신규 라우트 1개
(`/gender-reveal/[id]`), 신규 API 2개(`POST /api/events`, `GET /api/events/[id]`), 신규
컴포넌트 2개(공유 링크 배너, 만료 안내 화면), DB 테이블 1개.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Next.js App Router & TypeScript | PASS | 신규 라우트(`app/gender-reveal/[id]/page.tsx`)와 신규 Route Handler(`app/api/events/route.ts`, `app/api/events/[id]/route.ts`) 모두 App Router + TypeScript로만 구현. Pages Router 미사용. |
| II. Component Standards | PASS | 신규 컴포넌트(`ShareLinkBanner`, `ExpiredLinkNotice`)도 함수형·PascalCase·파일당 1개 컴포넌트 규칙을 따른다. |
| III. Styling with SCSS | **기존 드리프트 유지 (신규 위반 아님)** | 저장소는 이미 SCSS Modules 대신 Tailwind CSS로 구현되어 있다(001 계획에서도 동일하게 확인됨). "기존 UI/컴포넌트 최대한 재사용, 디자인 변경 없음" 요구를 따르기 위해 신규 컴포넌트도 기존과 일관되게 Tailwind를 사용한다. 이 드리프트를 이번 기능에서 되돌리지 않으며, SCSS 전환은 별도 헌법 개정/정리 작업으로 분리한다. |
| IV. Data & State Management | PASS (신규 충족) | 이번 기능부터 실제 원격 데이터(Supabase)가 생겨 헌법이 요구하는 TanStack Query + axios를 도입한다. 원격 데이터는 TanStack Query 훅(`useCreateGenderRevealEvent`, `useGenderRevealEvent`)으로, 클라이언트 전용 상태(`step`, `touchCount` 등)는 기존과 동일하게 Zustand로 관리해 두 계층을 분리 유지한다. |
| V. Localization & Time Handling | PASS | 모든 신규 UI 텍스트 한국어. 링크 만료 계산(`created_at + 7일`)과 표시는 `date-fns` 기반 KST 헬퍼를 확장해 처리(research.md #4). |
| VI. Quality Gates | PASS (계획) | 신규 Route Handler·Supabase 클라이언트 팩토리·훅에 Jest 테스트, 신규 공유 컴포넌트에 Storybook 스토리, ESLint 통과를 `/speckit-tasks` 단계 태스크로 포함한다. |

Constitution Check 위반(신규) 없음 → Complexity Tracking 불필요. Principle III 드리프트는 기존
상태의 연속이며 이번 계획이 새로 만든 위반이 아니므로 표에서 투명하게 기록만 한다.

## Project Structure

### Documentation (this feature)

```text
specs/002-shareable-link-flow/
├── plan.md               # This file (/speckit-plan command output)
├── research.md            # Phase 0 output (/speckit-plan command)
├── data-model.md          # Phase 1 output (/speckit-plan command)
├── quickstart.md          # Phase 1 output (/speckit-plan command)
├── contracts/             # Phase 1 output (/speckit-plan command)
│   └── events-api.md
├── checklists/
│   └── requirements.md
└── tasks.md               # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── gender-reveal/
│   │   ├── page.tsx                 # 생성자 전용 진입점(기존 유지) — 제출 핸들러를
│   │   │                            #   useCreateGenderRevealEvent 뮤테이션으로 교체
│   │   └── [id]/
│   │       └── page.tsx             # 신규: 공유 링크 접속 지점. useGenderRevealEvent로 조회 후
│   │                                #   404 / 만료 안내 / step2~3 중 하나를 렌더링
│   └── api/
│       └── events/
│           ├── route.ts             # 신규: POST — 이벤트 저장, 공유 링크(id) 발급
│           └── [id]/
│               └── route.ts         # 신규: GET — 조회, 만료 여부 판정
├── components/
│   └── gender-reveal/
│       ├── StepOneForm.tsx          # 기존 재사용 — 제출 시 로컬 setInput 대신 API 호출
│       ├── BalloonStage.tsx         # 기존 재사용, 변경 없음
│       ├── ResultReveal.tsx         # 기존 재사용 — '새로 만들기' 동작을 prop으로 주입 가능하게 조정
│       │                            #   (참여자 경로에서는 root로 이동, 생성자 경로에서는 기존 resetAll)
│       ├── ShareLinkBanner.tsx      # 신규: 생성자에게 발급된 공유 링크 노출 + 복사 UI
│       ├── ShareLinkBanner.test.tsx
│       ├── ShareLinkBanner.stories.tsx
│       ├── ExpiredLinkNotice.tsx    # 신규: "만료된 링크" 안내 화면
│       ├── ExpiredLinkNotice.test.tsx
│       └── ExpiredLinkNotice.stories.tsx
├── lib/
│   ├── date.ts                      # 기존 재사용 + 만료 시각 계산(`addDays` 기반) 헬퍼 추가
│   ├── date.test.ts
│   └── supabase/
│       └── server.ts                # 신규: 서버 전용 Supabase 클라이언트 팩토리(Route Handler 전용)
├── hooks/
│   ├── useCreateGenderRevealEvent.ts # 신규: TanStack Query mutation (POST /api/events)
│   └── useGenderRevealEvent.ts       # 신규: TanStack Query query (GET /api/events/[id])
├── stores/
│   └── genderRevealStore.ts          # 기존 재사용 + 서버 응답으로 하이드레이션하는 액션 추가
│   └── genderRevealStore.test.ts
└── types/
    └── genderReveal.ts                # 기존 재사용 + GenderRevealEventRecord/API 응답 타입 추가
```

**Structure Decision**: 별도 백엔드 서비스 없이 단일 Next.js 14 App Router 프로젝트 안에서 API를
Route Handler로 함께 둔다(옵션 1의 단일 프로젝트 구조를 Next.js 관례에 맞게 조정). 생성자 화면
(`/gender-reveal`)과 공유 링크 화면(`/gender-reveal/[id]`)을 별도 라우트로 분리해, 참여자
경로에서는 `StepOneForm`이 아예 번들/렌더 트리에 포함되지 않도록 한다(spec.md FR-006 "step1은
노출되지 않음"). 두 라우트 모두 기존 `StepOneForm` / `BalloonStage` / `ResultReveal` 컴포넌트를
재사용하고, `genderRevealStore`에 서버 응답 하이드레이션 액션만 추가해 상태 관리 패턴을 유지한다.

## Key Design Decisions (Phase 1 이전 확정 필요 사항)

이 절은 `/speckit-clarify`에서 미결로 남았던 항목들을 사용자가 제공한 구체적 기술 스택(Supabase
테이블 스키마, 라우팅, API 설계)에 근거해 계획 단계에서 확정한 결정이다. 근거는 research.md에
상세히 기록한다.

1. **링크 식별자 = 이벤트 레코드의 `id`(UUID, `gen_random_uuid()`)**: 별도의 짧은 코드/슬러그
   생성 로직을 추가하지 않고, Postgres가 생성하는 UUID v4를 그대로 공유 URL 경로(`/gender-reveal/
   [id]`)로 사용한다. `share_link` 컬럼은 조회 편의를 위해 같은 값(또는 완전한 공유 URL 문자열)을
   저장하되, 별도의 예측 가능성 낮은 토큰을 새로 설계하지 않는다. UUID v4는 122비트의 무작위성을
   가져 링크를 모르는 제3자가 추측으로 접근하기 사실상 불가능하므로, 이전 클라이언트 세션에서
   중단됐던 "링크 예측 불가능성" 질문을 충분한 기본값으로 해소한다(research.md #2).
2. **'링크 생성' 중복 클릭 시 매번 새 레코드를 insert한다**: 별도의 dedup 조회 없이 매 제출마다
   새 UUID/레코드를 생성한다. 콘텐츠가 어차피 불변이라 여러 링크가 생겨도 참여자 경험에는 차이가
   없고, 클라이언트에서는 제출 버튼을 요청 진행 중 비활성화해 실수로 인한 중복 제출만 억제한다
   (research.md #3).
3. **참여자 경로에서도 '다시 시작하기'는 유지한다**: `ResultReveal`의 '뒤로가기'(풍선 터치 카운트만
   0으로 초기화)는 순수 로컬 상태 변경이라 참여자 경로에서도 그대로 둔다. 다만 '젠더리빌 새로
   만들기'(기존 `resetAll` → step1로 이동)는 참여자 경로에는 step1이 없으므로, 공유 링크
   (`/gender-reveal/[id]`)에서는 `router.push('/gender-reveal')`로 이동하도록 분기한다
   (research.md #5).
4. **참여자·생성자 모두 `/gender-reveal/[id]` 접속 시 항상 서버에서 재조회한다**: 생성자가 로컬
   Zustand 상태를 이미 가지고 있어도 신뢰하지 않고, `useGenderRevealEvent`로 매번 서버 값을
   가져와 하이드레이션한다. 이렇게 하면 "동일 링크는 항상 동일 콘텐츠"(FR-012)와 새로고침 시
   일관성이 하나의 코드 경로로 보장된다(research.md #6).
