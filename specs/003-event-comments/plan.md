# Implementation Plan: 결과 화면 댓글 기능

**Branch**: `003-event-comments` | **Date**: 2026-08-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-event-comments/spec.md`

## Summary

공유 링크로 결과 화면(step3, `ResultReveal`)에 접속한 모든 참여자(생성자 포함)가
로그인 없이 보내는 사람 이름과 내용을 입력해 write-once 댓글을 남길 수 있게 한다.
댓글은 신규 테이블 `gender_reveal_comments`(`gender_reveal_events.id`를 FK로 참조)에
저장되며, 신규 API `GET/POST /api/events/[id]/comments`와 신규 컴포넌트
(`CommentSection`/`CommentForm`/`CommentList`/`CommentEmptyState`)만으로 구현한다.
만료 판정은 002가 만든 `isLinkExpired()`(`src/lib/date.ts`)를 API 레이어에서 재조회해
재사용하고, `gender_reveal_events` 테이블·기존 이벤트 API·`genderRevealStore`·기존
step1/step2 로직은 전혀 변경하지 않는다(spec.md FR-009). `ResultReveal.tsx`와
`/gender-reveal/[id]/page.tsx`는 `CommentSection`을 삽입하기 위한 최소한의 prop
추가(`eventId`)만 이루어진다.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 14(App Router), Node.js ≥18.18 (002와 동일,
변경 없음)

**Primary Dependencies**: 기존 스택 재사용만 — `@supabase/supabase-js`(서버 전용 조회/삽입),
`@tanstack/react-query` + `axios`(신규 훅 `useEventComments`/`useCreateEventComment`),
`zustand`(댓글 기능에서는 사용하지 않음 — `genderRevealStore` 미변경). 신규 의존성 추가
없음.

**Storage**: Supabase(Postgres) 신규 테이블 `gender_reveal_comments` 1개
(`gender_reveal_events(id)`를 FK로 참조, `ON DELETE CASCADE`). 기존 `gender_reveal_events`
테이블은 읽기 전용으로만 조회한다(data-model.md).

**Testing**: Jest + Testing Library(신규 Route Handler·훅·컴포넌트 단위, 기존
`route.test.ts` 패턴 재사용), Storybook(신규 컴포넌트 4종 문서화)

**Target Platform**: 모바일·PC 웹 브라우저(반응형, 한국어 UI) — 002와 동일. 댓글 UI는
결과 이미지 캡처 영역(`html2canvas` 대상) 밖에 배치해 공유 이미지에 섞이지 않게 한다
(research.md #6).

**Project Type**: 웹 애플리케이션 — 기존 단일 Next.js 14 App Router 프로젝트에 API
Route Handler를 추가(별도 서비스/레포 분리 없음, 002와 동일 구조)

**Performance Goals**: 댓글 목록 조회는 결과 화면 진입 직후 노출되어야 하며(SC-001 —
30초 내 작성 완료 전제), 단일 이벤트당 소규모 댓글 수(수십 건 이내) 기준 페이지네이션
없는 전체 조회로 충분하다(spec.md Assumptions).

**Constraints**: 만료 판정 로직은 새로 만들지 않고 002의 `isLinkExpired()`를 그대로
호출한다(중복 구현 금지, research.md #2). Supabase 접근은 기존
`getSupabaseServerClient()` 팩토리 하나만 사용하며, 댓글 테이블 지원을 위해 그 파일 내
`Database` 타입만 확장한다(신규 팩토리 금지, research.md #1). `genderRevealStore`는
어떤 필드/액션도 추가·변경하지 않는다.

**Scale/Scope**: 신규 라우트 없음(기존 `/gender-reveal/[id]` 화면에 섹션만 추가), 신규
API 2개(`GET`/`POST /api/events/[id]/comments`), 신규 컴포넌트 4개, DB 테이블 1개,
마이그레이션 파일 2개.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Next.js App Router & TypeScript | PASS | 신규 Route Handler(`app/api/events/[id]/comments/route.ts`)는 App Router 관례를 그대로 따르고 전 구간 TypeScript로 작성한다. `any` 미사용(Supabase `Database` 타입 확장으로 타입 안전성 유지, research.md #1). |
| II. Component Standards | PASS | `CommentSection`/`CommentForm`/`CommentList`/`CommentEmptyState` 모두 함수형·PascalCase·파일당 1개 컴포넌트. |
| III. Styling with SCSS | **기존 드리프트 유지(신규 위반 아님)** | 002와 동일하게 저장소는 이미 Tailwind CSS로 구현되어 있다. 신규 컴포넌트도 기존 `ResultReveal`/`ShareLinkBanner`와의 시각적 일관성을 위해 Tailwind를 사용하며, 이 기능에서 SCSS로 되돌리지 않는다. |
| IV. Data & State Management | PASS | 원격 데이터(댓글 조회/등록)는 TanStack Query 훅(`useEventComments`, `useCreateEventComment`) + `axios`(`src/lib/api/client.ts` 재사용)로만 접근한다. 폼의 입력값 같은 로컬 상태는 컴포넌트 `useState`로 관리하고 Zustand에 추가하지 않는다 — `genderRevealStore`는 완전히 분리 유지(spec.md FR-009 정신 확장). |
| V. Localization & Time Handling | PASS | 신규 UI 텍스트 전부 한국어. 댓글 작성 시각 표시는 기존 `formatKstDate`(`src/lib/date.ts`)를 재사용해 KST 기준으로 포맷한다(신규 날짜 로직 추가 없음). |
| VI. Quality Gates | PASS (계획) | 신규 Route Handler·훅·Supabase 타입 확장에 Jest 테스트, 신규 컴포넌트 4종에 Storybook 스토리, ESLint 통과를 `/speckit-tasks` 단계 태스크로 포함한다. |

Constitution Check 위반(신규) 없음 → Complexity Tracking 불필요. Principle III 드리프트는
002에서 이미 기록된 기존 상태의 연속이며 이번 계획이 새로 만든 위반이 아니다.

## Project Structure

### Documentation (this feature)

```text
specs/003-event-comments/
├── plan.md               # This file (/speckit-plan command output)
├── research.md           # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   └── comments-api.md
├── checklists/
│   └── requirements.md
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
supabase/
└── migrations/
    ├── 0001_gender_reveal_events.sql              # 기존 — 변경 없음
    ├── 0002_anon_insert_select_policies.sql       # 기존 — 변경 없음
    ├── 0003_gender_reveal_comments.sql            # 신규: 테이블 + CHECK 제약 + 인덱스
    └── 0004_comments_anon_insert_select_policies.sql  # 신규: RLS enable + insert/select
                                                         #   정책만(update/delete 정책 없음 → write-once)

src/
├── app/
│   ├── gender-reveal/
│   │   ├── page.tsx                     # 기존 — 변경 없음 (eventId 없이 ResultReveal 렌더)
│   │   └── [id]/
│   │       └── page.tsx                 # 수정(최소): <ResultReveal .../>에 eventId={id} prop 한 줄 추가
│   └── api/
│       └── events/
│           ├── route.ts                 # 기존 — 변경 없음
│           └── [id]/
│               ├── route.ts             # 기존 — 변경 없음
│               ├── route.test.ts        # 기존 — 변경 없음
│               └── comments/
│                   ├── route.ts         # 신규: GET(목록 조회) + POST(등록)
│                   └── route.test.ts    # 신규
├── components/
│   └── gender-reveal/
│       ├── ResultReveal.tsx             # 수정(최소): eventId?: string prop 추가 +
│       │                                #   captureRef 바깥에 <CommentSection eventId={eventId} /> 삽입
│       ├── ResultReveal.test.tsx        # 수정(최소): eventId 유무에 따른 CommentSection 노출 케이스 추가
│       ├── ResultReveal.stories.tsx     # 수정(최소): eventId 포함 스토리 추가
│       ├── CommentSection.tsx           # 신규: 목록 조회 + 상태 분기(빈 목록/목록/에러) 오케스트레이션
│       ├── CommentSection.test.tsx
│       ├── CommentSection.stories.tsx
│       ├── CommentForm.tsx              # 신규: 이름/내용 입력 + 제출 + 인라인 검증 에러 표시
│       ├── CommentForm.test.tsx
│       ├── CommentForm.stories.tsx
│       ├── CommentList.tsx              # 신규: 댓글 배열을 최신순 그대로 렌더링
│       ├── CommentList.test.tsx
│       ├── CommentList.stories.tsx
│       ├── CommentEmptyState.tsx        # 신규: 댓글이 0개일 때 안내 문구
│       ├── CommentEmptyState.test.tsx
│       └── CommentEmptyState.stories.tsx
├── lib/
│   ├── date.ts                          # 기존 — 변경 없음 (formatKstDate/isLinkExpired 재사용만)
│   ├── api/
│   │   ├── client.ts                    # 기존 — 변경 없음 (axios 인스턴스 재사용)
│   │   ├── events.ts                    # 기존 — 변경 없음
│   │   ├── comments.ts                  # 신규: listEventComments(eventId), createEventComment(eventId, input)
│   │   └── comments.test.ts             # 신규
│   └── supabase/
│       └── server.ts                    # 수정(최소): Database.Tables에 gender_reveal_comments
│                                         #   Row/Insert/Update 타입 추가. getSupabaseServerClient()
│                                         #   함수 본문은 변경 없음(신규 팩토리 아님, research.md #1)
├── hooks/
│   ├── useCreateGenderRevealEvent.ts    # 기존 — 변경 없음
│   ├── useGenderRevealEvent.ts          # 기존 — 변경 없음
│   ├── useEventComments.ts              # 신규: useQuery(GET /api/events/[id]/comments)
│   └── useCreateEventComment.ts         # 신규: useMutation(POST /api/events/[id]/comments) +
│                                         #   성공 시 useEventComments 쿼리 캐시 갱신
├── stores/
│   └── genderRevealStore.ts             # 기존 — 절대 변경 없음 (spec.md FR-009)
└── types/
    └── genderReveal.ts                  # 수정(최소, 추가 전용): GenderRevealCommentRecord,
                                          #   ListCommentsResult, CreateCommentResult 타입만 추가
```

**Structure Decision**: 002와 동일한 단일 Next.js 14 App Router 프로젝트 구조를 그대로
유지한다. 신규 라우트는 만들지 않고 기존 `/gender-reveal/[id]` 화면에 컴포넌트 하나만
추가로 마운트하며, API는 기존 `/api/events/[id]` 하위에 `comments` 하위 리소스로만
추가한다(`/api/events`, `/api/events/[id]` 라우트 파일 자체는 건드리지 않음). "수정"으로
표시된 4개 파일(`[id]/page.tsx`, `ResultReveal.tsx`(+test/stories), `server.ts`,
`genderReveal.ts`)은 모두 기존 로직을 바꾸지 않는 순수 추가(prop 한 줄, 타입 추가)이며,
`gender_reveal_events` 테이블·`/api/events`·`/api/events/[id]`·`genderRevealStore`·
step1(`StepOneForm`)/step2(`BalloonStage`) 컴포넌트는 이 표에 등장하지 않는 한 전혀
변경되지 않는다(spec.md FR-009, FR-010).

## Complexity Tracking

Constitution Check 위반 없음 — 이 절은 해당 사항 없음.
