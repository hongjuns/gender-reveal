# Implementation Plan: 여러 풍선 생성 및 관리 링크

**Branch**: `feature/v3` | **Date**: 2026-11-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-multi-balloon-management/spec.md`

## Summary

만든 사람이 태명·예정일·성별을 한 번 입력하고 받는 사람을 최대 10명까지 추가해, 받는 사람별 풍선을
한 번에 만든다. 풍선들은 `gender_reveal_events`의 신규 `code` 칼럼(추측 불가능한 관리 코드)으로 묶이고,
만든 사람은 관리 링크(`/gender-reveal/manage/[code]`)로 받는 사람별 공유 링크 복사, 삭제(댓글 포함),
풍선별 1회 7일 연장을 한다. 일괄 생성은 단일 insert로 원자성을 보장하고, 삭제·연장은 `id`+`code`
조건부 쿼리로 처리하며, 받는 사람용 API는 조회 칼럼을 명시해 관리 코드가 절대 응답에 섞이지 않게 한다.
받는 사람의 풍선 터뜨리기·결과·댓글 흐름과 `genderRevealStore`는 변경하지 않는다.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 14.2 (App Router), Node.js ≥18.18 — 기존과 동일

**Primary Dependencies**: 기존 스택만 사용 — `@supabase/supabase-js`(서버 전용), `@tanstack/react-query`
+ `axios`(`src/lib/api/client.ts`), `date-fns`. 신규 의존성 없음.

**Storage**: Supabase(Postgres) `gender_reveal_events`에 `code` 칼럼 추가(연장 여부는 `link_expires_at`으로 판단)
(마이그레이션 0005, 0006 — feature/v3에 작성됨, data-model.md에서 검토 완료). 댓글 테이블 변경 없음.

**Testing**: Jest + Testing Library(Route Handler·훅·컴포넌트·date 유틸), Storybook(신규 컴포넌트)

**Target Platform**: 모바일 우선 반응형 웹(Figma 390px 기준), 한국어 UI

**Project Type**: 단일 Next.js App Router 웹 애플리케이션(Route Handler 포함)

**Performance Goals**: 관리 화면은 묶음당 최대 10행이라 페이지네이션 없이 전체 조회. 생성은 단일 왕복.

**Constraints**: 관리 코드 비노출(FR-009), 삭제·연장은 id+code 동시 일치(FR-010), 일괄 생성 원자성
(FR-006), 1회 연장 원자성(FR-022). 만료 판정은 기존 `isLinkExpired()` 재사용.

**Scale/Scope**: 신규 페이지 1개(관리), 변경 API 1개(`POST /api/events`) + 노출 방지 보강 2개, 신규 API 3개,
신규 컴포넌트 약 6개, 변경 컴포넌트 1개(`StepOneForm`), 삭제 컴포넌트 1개(`LinkGeneratedModal`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Next.js App Router & TypeScript | PASS | 신규 페이지·Route Handler 모두 App Router 관례, 전 구간 TS. `any` 없음 |
| II. Component Standards | PASS | 함수형, PascalCase, 파일당 1 컴포넌트 |
| III. Styling with SCSS | 기존 드리프트 유지(신규 위반 아님) | 002·003과 동일하게 저장소 전체가 Tailwind. 시각적 일관성을 위해 Tailwind 유지 |
| IV. Data & State Management | PASS | 원격 데이터는 TanStack Query 훅 + axios 공유 클라이언트. 생성 폼 상태는 `StepOneForm` 로컬 state. Zustand 변경 없음 |
| V. Localization & Time Handling | PASS | UI 한국어. 만료일 표시는 `formatKstDate`, 연장 계산은 `date-fns` 기반 `calculateExtendedExpiresAt` |
| VI. Quality Gates | PASS (계획) | 신규·변경 Route Handler/훅/컴포넌트/유틸 Jest 테스트, 신규 컴포넌트 스토리, ESLint를 tasks에 포함 |

**Post-design re-check (Phase 1 이후)**: 변동 없음 — PASS. 신규 위반 없음 → Complexity Tracking 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/004-multi-balloon-management/
├── plan.md              # This file
├── research.md          # Phase 0 — 설계 결정 11건
├── data-model.md        # Phase 1 — 칼럼·상태 전이·마이그레이션 검토
├── quickstart.md        # Phase 1 — 자동/수동 검증 시나리오
├── contracts/
│   ├── events-api.md    # POST /api/events 일괄 생성, 받는 사람용 API 노출 방지
│   └── manage-api.md    # GET/DELETE/POST(extend) /api/manage/[code]/…
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks 에서 생성
```

### Source Code (repository root)

```text
supabase/migrations/
├── 0005_event_code_and_extension.sql            # (작성됨) code
└── 0006_events_anon_update_delete_policies.sql  # (작성됨) anon update/delete RLS

src/
├── app/
│   ├── api/
│   │   ├── events/
│   │   │   ├── route.ts                    # 변경: 일괄 생성(recipientNames[]), code 반환
│   │   │   └── [id]/
│   │   │       ├── route.ts                # 변경: select 칼럼 명시(code 비노출)
│   │   │       └── comments/route.ts       # 변경: select 칼럼 명시
│   │   └── manage/[code]/
│   │       ├── route.ts                    # 신규: GET 묶음 조회
│   │       └── events/[id]/
│   │           ├── route.ts                # 신규: DELETE
│   │           └── extend/route.ts         # 신규: POST 연장
│   └── gender-reveal/
│       ├── page.tsx                        # 변경 없음(StepOneForm 렌더)
│       ├── [id]/page.tsx                   # 변경 없음
│       └── manage/[code]/
│           ├── layout.tsx                  # 신규: noindex, referrer no-referrer 메타
│           └── page.tsx                    # 신규: 관리 화면
├── components/gender-reveal/
│   ├── StepOneForm.tsx                     # 변경: Step1(258-2, 패스키·사람 아이콘 제외) + 하위 단계(common→recipients→creating) 관리, 생성 후 관리 화면 이동
│   ├── RecipientListForm.tsx               # 신규: Step2, Figma 258-29
│   ├── BalloonCreatingView.tsx             # 신규: Step3, Figma 258-81 (최소 2초 로딩)
│   ├── BalloonManager.tsx                  # 신규: Step5, Figma 258-106 본문(헤더·일러스트·목록·빈 상태)
│   ├── ManagedBalloonRow.tsx               # 신규: 받는 사람 행(링크 복사/삭제/만료일/연장)
│   ├── ManageLinkModal.tsx                 # 신규: Step4, Figma 278-112 (X 없음, 복사 성공 시 숨김)
│   ├── DeleteBalloonConfirmModal.tsx       # 신규: 삭제 확인
│   └── LinkGeneratedModal.tsx (+story/test) # 삭제: ManageLinkModal로 대체
├── hooks/
│   ├── useCreateGenderRevealEvent.ts       # 변경: 일괄 생성 입력/응답 타입
│   ├── useManagedBalloons.ts               # 신규
│   ├── useDeleteBalloon.ts                 # 신규
│   └── useExtendBalloon.ts                 # 신규
├── lib/
│   ├── api/events.ts                       # 변경: 일괄 생성 타입
│   ├── api/manage.ts                       # 신규: 관리 API 클라이언트
│   ├── date.ts                             # 변경: calculateExtendedExpiresAt 추가
│   ├── recipients.ts                       # 신규: MAX_RECIPIENTS=10, 받는 사람 목록 검증(서버·클라이언트 공용)
│   └── supabase/server.ts                  # 변경(완료): code 타입
└── types/genderReveal.ts                   # 변경: ManagedBalloon, ManagedBalloonGroup, 결과 유니언
```

각 신규/변경 파일에는 같은 디렉터리에 `*.test.ts(x)`, 신규 컴포넌트에는 `*.stories.tsx`를 둔다(기존 관례).

**Structure Decision**: 기존 단일 Next.js 프로젝트 구조를 그대로 확장한다. 관리 기능은 `manage` 세그먼트
아래(화면 `/gender-reveal/manage/[code]`, API `/api/manage/[code]/…`)로 모아 받는 사람용 경로와 분리한다
(research #3).

## Implementation Notes

- **순서**: (1) 마이그레이션 적용 + 타입 → (2) `POST /api/events` 일괄 생성 + 받는 사람용 API 노출 방지 →
  (3) 생성 UI(StepOneForm/RecipientListForm) → (4) 관리 조회 API + 관리 화면 + 관리 링크 모달 →
  (5) 삭제 → (6) 연장. (2)~(4)가 MVP(US1~US3).
- **디자인 반영**: 구현 시 Step1~5(Figma 258-2 / 258-29 / 258-81 / 278-112 / 258-106)의
  `get_design_context`로 간격·폰트를 맞춘다. 디자인 대비 변경: Step1 패스키·사람 아이콘 제외, Step4 X 버튼
  제거 + 복사 성공 시 숨김. 연장 버튼·만료일은 디자인이 없어 기존 보조 텍스트 톤으로 배치(spec Assumptions).
- **기존 테스트**: `main` 기준 이미 실패 중인 테스트 8개(5파일)는 이번 범위와 별개다. `StepOneForm`
  테스트는 이번 변경으로 갱신한다.

## Complexity Tracking

해당 없음(신규 헌법 위반 없음).
