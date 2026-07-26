---

description: "Task list template for feature implementation"
---

# Tasks: 공유 링크 기반 젠더리빌 플로우(v2)

**Input**: Design documents from `/specs/002-shareable-link-flow/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/events-api.md, quickstart.md (모두 존재)

**Tests**: 헌법(`Principle VI`)이 신규/변경 컴포넌트·유틸에 대한 Jest 테스트, 공유 컴포넌트에 대한 Storybook 스토리를 필수 Quality Gate로 요구하므로, 각 작업에 테스트·스토리 작업을 포함한다. TDD(테스트 선작성)는 명시적으로 요청되지 않았으므로 구현과 테스트를 같은 스토리 안에서 함께 진행한다.

**Organization**: 작업은 spec.md의 사용자 스토리별로 그룹화된다. User Story 1과 2는 모두 P1이며 같은 화면(`/gender-reveal/[id]`)을 공유하는 생성자→참여자 파이프라인의 양 끝단이라 구현 순서상 강하게 결합되어 있다(자세한 내용은 Dependencies 참고). User Story 3(P2)은 그 위에 만료/404 처리를 추가한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 완료되지 않은 작업에 대한 의존 없음)
- **[Story]**: 해당 작업이 속한 사용자 스토리 (US1, US2, US3)
- 각 작업에 정확한 파일 경로 포함

## Path Conventions

plan.md의 Project Structure를 따른다: `src/app/gender-reveal/`, `src/app/api/events/`, `src/components/gender-reveal/`, `src/hooks/`, `src/lib/`, `src/stores/`, `src/types/`, `supabase/migrations/` (repo root 기준).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: v2에 필요한 신규 의존성·환경 변수 문서·DB 스키마 준비

- [X] T001 [P] 런타임 의존성 설치: `@supabase/supabase-js`, `axios`, `@tanstack/react-query` (`package.json` 반영, plan.md Technical Context)
- [X] T002 [P] `.env.example`에 `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` 플레이스홀더를 문서화(실값은 `.env.local`에만 존재하며 커밋하지 않음, quickstart.md Prerequisites)
- [X] T003 [P] `supabase/migrations/0001_gender_reveal_events.sql` 작성: `gender_reveal_events` 테이블(`id uuid pk default gen_random_uuid()`, `baby_nickname text not null`, `due_date date not null`, `recipient_name text not null`, `gender text not null`, `share_link text unique not null`, `link_expires_at timestamptz not null`, `created_at timestamptz not null default now()`)을 data-model.md 스키마대로 생성

**Checkpoint**: 신규 의존성이 설치되고, Supabase 프로젝트에 적용할 마이그레이션 SQL과 환경 변수 문서가 준비된 상태

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 세 사용자 스토리가 공통으로 의존하는 타입·서버 클라이언트·axios 클라이언트·쿼리 프로바이더·날짜 헬퍼·스토어 액션

**⚠️ CRITICAL**: 이 Phase가 끝나기 전에는 어떤 사용자 스토리 작업도 시작할 수 없음

- [X] T004 [P] `src/types/genderReveal.ts`에 `GenderRevealEventRecord`, `GetEventResult` 타입 추가 (data-model.md)
- [X] T005 [P] `src/lib/supabase/server.ts`에 서버 전용 Supabase 클라이언트 팩토리 구현: 환경 변수(`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`)로 클라이언트를 생성하고 Route Handler에서만 import되도록 다른 곳에서 재노출하지 않음 (research.md #7)
- [X] T006 [P] `src/lib/api/client.ts`에 공용 axios 인스턴스 생성(`baseURL: '/api'`) — 이후 모든 프론트엔드 HTTP 호출은 이 인스턴스를 통해서만 수행(Constitution Principle IV)
- [X] T007 `src/app/providers.tsx`에 `QueryClientProvider` 래퍼 클라이언트 컴포넌트를 만들고 `src/app/layout.tsx`의 `children`을 이 컴포넌트로 감싸도록 연결(Constitution Principle IV)
- [X] T008 [P] `src/lib/date.ts`에 링크 만료 시각 계산 헬퍼(`date-fns`의 `addDays` 사용, KST 처리 방식은 기존 포맷 헬퍼와 동일하게 유지) 추가 (research.md #4)
- [X] T009 `src/lib/date.ts`의 신규 헬퍼에 대한 Jest 테스트를 `src/lib/date.test.ts`에 추가 (T008 이후)
- [X] T010 `src/stores/genderRevealStore.ts`에 `hydrateFromEvent(event: GenderRevealEventRecord): void` 액션 추가: `dueDate` 문자열을 `Date`로 변환해 `input`을 채우고 `step`을 `'interaction'`으로, `touchCount`/`isBursting`을 초기값으로 설정 (data-model.md, T004 타입 사용)
- [X] T011 [P] `hydrateFromEvent`에 대한 Jest 테스트를 `src/stores/genderRevealStore.test.ts`에 추가

**Checkpoint**: 공용 인프라(타입/DB 클라이언트/axios/쿼리 프로바이더/날짜 헬퍼/스토어 액션)가 완비되어 이후 사용자 스토리를 독립적으로 구현 가능

---

## Phase 3: User Story 1 - 링크 생성 및 공유 (Priority: P1) 🎯 MVP 시작점

**Goal**: 생성자가 step1(태명·출산예정일·받는사람·성별)을 입력하고 '링크 생성'을 클릭하면 고유한 공유 링크가 발급되어 화면에 표시·복사 가능해진다.

**Independent Test**: step1의 4개 필드를 모두 채우고 '링크 생성'을 클릭했을 때 고유한 링크(URL)가 발급되어 화면에 표시(및 복사 가능)되는지 확인. 필드 중 하나라도 비어 있으면 링크가 발급되지 않고 안내 메시지가 노출되는지 확인.

### Tests for User Story 1

- [X] T012 [P] [US1] `src/app/api/events/route.test.ts`에 Jest 테스트 작성: 4개 필드가 모두 유효하면 201 + `{id, shareLink, linkExpiresAt}` 반환, 하나라도 누락/공백이면 400 + `{error:'INVALID_INPUT'}` 반환 (Supabase 클라이언트 모킹, contracts/events-api.md)
- [X] T013 [P] [US1] `src/components/gender-reveal/StepOneForm.test.tsx` 갱신: 제출 시 `useCreateGenderRevealEvent` 훅이 호출되고 성공 시 `/gender-reveal/[id]?created=1`로 라우팅됨을 확인, 필수값 누락 시에는 여전히 API 호출 없이 기존 에러 메시지만 노출되는지 확인 (라우터/훅 모킹)
- [X] T014 [P] [US1] `src/components/gender-reveal/ShareLinkBanner.test.tsx` 작성: 공유 링크 텍스트 노출, 복사 버튼 클릭 시 클립보드 API 호출 및 성공/실패 피드백 노출 확인

### Implementation for User Story 1

- [X] T015 [US1] `src/app/api/events/route.ts`에 `POST` Route Handler 구현(contracts/events-api.md): 입력 검증 실패 시 400, 성공 시 T008 헬퍼로 `link_expires_at` 계산 후 Supabase(T005 클라이언트)에 insert하고 201 + `{id, shareLink, linkExpiresAt}` 반환 — `share_link`는 발급된 `id`와 동일 값으로 저장(research.md #2)
- [X] T016 [US1] `src/lib/api/events.ts`에 axios(T006 클라이언트) 기반 `createGenderRevealEvent(input)` 함수 구현
- [X] T017 [US1] `src/hooks/useCreateGenderRevealEvent.ts`에 TanStack Query mutation 훅 구현(T016 사용)
- [X] T018 [US1] `src/components/gender-reveal/StepOneForm.tsx` 제출 핸들러를 T017 훅으로 교체: 뮤테이션 진행 중 제출 버튼 비활성화, 성공 시 `router.push('/gender-reveal/' + id + '?created=1')`, 실패(400) 시 기존 '정보를 모두 입력해주세요' 에러 메시지 노출 패턴 재사용
- [X] T019 [P] [US1] `src/components/gender-reveal/ShareLinkBanner.tsx` 구현: 전달받은 공유 URL 표시 + 복사 버튼(Clipboard API), 복사 성공/실패 피드백 메시지, 기존 화이트/픽셀 톤앤매너와 일관된 Tailwind 스타일(research.md #1)
- [X] T020 [P] [US1] `src/components/gender-reveal/ShareLinkBanner.stories.tsx` 작성: 기본 상태, 복사 성공 상태를 각각 스토리로 문서화(Constitution Principle VI)

**Checkpoint**: User Story 1의 Acceptance #1~#3(링크 발급/표시/복사, 필수값 검증)이 독립적으로 완전히 검증 가능. Acceptance #4(생성자도 곧바로 step2에 진입)의 종단 검증은 `/gender-reveal/[id]` 라우트가 완성되는 Phase 4(User Story 2) 이후에 가능하다 — 아래 Dependencies 참고.

---

## Phase 4: User Story 2 - 공유 링크를 통한 참여자 접속 (Priority: P1)

**Goal**: 참여자가 공유 링크로 접속하면 step1 화면 없이 곧바로 step2(풍선 인터랙션)부터 시작하고, 생성자가 입력한 값이 그대로 반영되어 step2~3에 표시된다.

**Independent Test**: 유효한 공유 링크로 접속했을 때 step1 입력 화면이 노출되지 않고 step2 화면부터 시작되며, 생성자가 입력했던 태명 등이 반영된 문구가 표시되는지 확인. 동일한 링크로 여러 사람이 접속해도 동일한 콘텐츠를 보되, 각자의 풍선 터치 진행 상태는 독립적인지 확인.

### Tests for User Story 2

- [X] T021 [P] [US2] `src/app/api/events/[id]/route.test.ts`에 Jest 테스트 작성: 존재하는 유효한 `id` 조회 시 200 + 저장된 값 반환, 존재하지 않는(형식은 맞지만 미발급 포함) `id` 조회 시 404 + `{error:'NOT_FOUND'}` 반환 (만료 케이스는 Phase 5에서 추가)
- [X] T022 [P] [US2] `src/app/gender-reveal/[id]/page.test.tsx` 작성: 서버 데이터로 `hydrateFromEvent`가 호출되어 step2 문구에 태명이 반영되는지, `StepOneForm`이 렌더 트리에 전혀 포함되지 않는지, 존재하지 않는 `id`일 때 Next.js `notFound()`가 호출되는지 확인
- [X] T023 [P] [US2] `src/components/gender-reveal/ResultReveal.test.tsx` 갱신: `onCreateNew` prop이 주어지면 '새로 만들기' 클릭 시 `resetAll` 대신 해당 콜백이 호출되고, prop이 없으면(생성자 라우트) 기존 `resetAll` 동작이 유지되는지 확인(research.md #5)

### Implementation for User Story 2

- [X] T024 [US2] `src/app/api/events/[id]/route.ts`에 `GET` Route Handler 구현(contracts/events-api.md): `id`로 Supabase(T005 클라이언트) 조회, 없으면 404, 있으면 200 + 이벤트 데이터 반환(만료 판정은 T034에서 추가)
- [X] T025 [US2] `src/lib/api/events.ts`에 axios(T006 클라이언트) 기반 `getGenderRevealEvent(id)` 함수 추가
- [X] T026 [US2] `src/hooks/useGenderRevealEvent.ts`에 TanStack Query 훅 구현: T025 사용, 응답 상태 코드를 `GetEventResult`(T004) 판별 유니온으로 매핑(404→`not_found`, 200→`ok`; 410→`expired`는 Phase 5에서 매핑 추가)
- [X] T027 [US2] `src/app/gender-reveal/[id]/page.tsx` 신규 라우트 구현: 로딩 중에는 기존 `StepSkeleton` 패턴 재사용, `ok`면 `hydrateFromEvent` 호출 후 `step` 값에 따라 `BalloonStage`/`ResultReveal` 렌더링, `not_found`면 Next.js `notFound()` 호출(만료 분기는 T037에서 추가)
- [X] T028 [US2] `page.tsx`에 `created` 쿼리 파라미터 확인 로직 추가: 값이 있을 때만 `ShareLinkBanner`를 상단에 함께 렌더링(FR-005, FR-008)
- [X] T029 [US2] `src/components/gender-reveal/ResultReveal.tsx`에 `onCreateNew?: () => void` prop 추가(research.md #5): prop이 있으면 '새로 만들기' 클릭 시 `resetAll()` 대신 호출하고, `page.tsx`(T027)에서는 `() => router.push('/gender-reveal')`을 전달
- [X] T030 [US2] 생성자 종단 플로우 통합 테스트 추가(적절한 통합 테스트 파일, 예: `src/app/gender-reveal/[id]/page.test.tsx` 확장): `StepOneForm` 제출 → `/gender-reveal/[id]?created=1` 진입 → `ShareLinkBanner`와 `BalloonStage`가 동시에 노출되는지 확인(User Story 1 Acceptance #4, US1↔US2 결합 지점)

**Checkpoint**: User Story 1과 2가 결합되어 생성자→참여자 전체 흐름(링크 발급 → 공유 → 참여자 접속 → 풍선 터치 → 결과 확인)이 종단 간 검증 가능

---

## Phase 5: User Story 3 - 만료/존재하지 않는 링크 처리 (Priority: P2)

**Goal**: 생성일로부터 7일이 지난 링크는 "만료된 링크" 안내 화면을, 존재하지 않는 링크는 404를 표시한다.

**Independent Test**: 생성 후 7일이 지난 링크로 접속 시 "만료된 링크" 안내가, 존재한 적 없는 임의의 링크 값으로 접속 시 404 에러 화면이 노출되는지 확인. 정확히 7일 이내(예: 6일 23시간 경과)의 링크는 정상적으로 step2부터 시작되는지 확인.

### Tests for User Story 3

- [X] T031 [P] [US3] `src/app/api/events/[id]/route.test.ts`에 만료 케이스 테스트 추가: `link_expires_at`이 과거인 레코드 조회 시 410 + `{error:'LINK_EXPIRED'}` 반환, 7일 이내 레코드는 계속 200 반환
- [X] T032 [P] [US3] `useGenderRevealEvent`(T026)가 410 응답을 `{status:'expired'}`로 매핑하는지 테스트 추가
- [X] T033 [P] [US3] `src/components/gender-reveal/ExpiredLinkNotice.test.tsx` 작성: 안내 문구 렌더링 확인

### Implementation for User Story 3

- [X] T034 [US3] `src/app/api/events/[id]/route.ts`(T024)에 만료 판정 로직 추가: T008 헬퍼로 계산된 `link_expires_at`과 현재 시각을 비교해 지났으면 410 + `{error:'LINK_EXPIRED'}` 반환 (research.md #4)
- [X] T035 [P] [US3] `src/components/gender-reveal/ExpiredLinkNotice.tsx` 구현: "만료된 링크" 안내 화면, 기존 화이트 배경/픽셀 톤앤매너 재사용
- [X] T036 [P] [US3] `src/components/gender-reveal/ExpiredLinkNotice.stories.tsx` 작성(Constitution Principle VI)
- [X] T037 [US3] `src/app/gender-reveal/[id]/page.tsx`(T027)에 `expired` 분기 추가: `ExpiredLinkNotice` 렌더링

**Checkpoint**: 세 사용자 스토리 모두 독립적으로 동작 — 정상/만료/미존재 링크가 각각 올바르게 분기되어 전체 spec.md 요구사항 충족

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 여러 사용자 스토리에 걸친 마무리 검증

- [X] T038 [P] `npm run lint` 통과 확인 및 잔여 ESLint 경고 정리(Constitution Principle VI)
- [X] T039 [P] 브라우저 번들에 Supabase 자격 증명(anon/service role key)이 노출되지 않는지 확인 — `src/lib/supabase/server.ts`가 클라이언트 컴포넌트/훅에서 import되지 않음을 확인(research.md #7)
- [X] T040 quickstart.md의 생성자/참여자/만료/404/새로 만들기 시나리오를 개발 서버에서 순서대로 수동 검증
- [X] T041 [P] `supabase/migrations/0001_gender_reveal_events.sql`을 Supabase 프로젝트에 적용하는 절차를 quickstart.md Prerequisites에 보강

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료에 의존 — 모든 사용자 스토리를 블록함
- **User Story 1 (Phase 3)**: Foundational 완료에 의존. 자체 Acceptance #1~#3은 독립적으로 완결되나, Acceptance #4(생성자의 step2 진입)는 User Story 2의 `/gender-reveal/[id]` 라우트가 있어야 종단 검증됨(T030)
- **User Story 2 (Phase 4)**: Foundational 완료에 의존. `/gender-reveal/[id]` 라우트와 `GET` 엔드포인트는 User Story 1이 생성한 링크로 진입하는 것을 전제로 하지만, 코드 구현 자체는 임의의 `id`만 있으면 독립적으로 개발·테스트 가능(T021, T022)
- **User Story 3 (Phase 5)**: Foundational과 User Story 2의 `GET` 엔드포인트(T024)·`[id]/page.tsx`(T027) 완료에 의존 — 같은 파일에 만료 분기를 추가하는 구조이기 때문
- **Polish (Phase 6)**: 모든 사용자 스토리 완료에 의존

### User Story Dependencies

- **User Story 1 (P1)**과 **User Story 2 (P1)**는 같은 화면(`/gender-reveal/[id]`)을 공유하는 하나의 파이프라인(생성 → 소비)의 양 끝단이라 완전히 독립적이지는 않다. 두 스토리의 핵심 구현(Route Handler, 컴포넌트, 훅)은 서로 다른 파일이라 병렬로 진행할 수 있지만, User Story 1의 마지막 통합 테스트(T030)는 User Story 2의 라우트가 존재해야 통과한다.
- **User Story 3 (P2)**는 User Story 2가 만든 `GET /api/events/[id]`와 `[id]/page.tsx`를 확장하므로 반드시 그 이후에 진행한다.

### Within Each User Story

- Route Handler/훅 구현 → 컴포넌트 연동 순서를 따른다
- 테스트는 구현과 같은 스토리 안에서 함께 완료한다(파일별로 [P] 병렬 가능)
- 스토리 완료 후 다음 우선순위로 이동

### Parallel Opportunities

- Setup의 모든 [P] 작업(T001~T003)은 병렬 실행 가능
- Foundational의 [P] 작업(T004, T005, T006, T007, T008, T011)은 서로 다른 파일이라 병렬 실행 가능(단, T009는 T008 이후, T010은 T004 이후)
- Foundational 완료 후 User Story 1과 2는 서로 다른 파일 집합(API route/컴포넌트가 겹치지 않음)이라 각각 다른 담당자가 병렬로 진행 가능 — 단, T030(US1↔US2 통합 테스트)만 두 스토리 모두 완료된 뒤 실행
- 각 스토리 내 테스트 작업(예: T012, T013, T014)은 서로 다른 파일이라 병렬 실행 가능

---

## Parallel Example: User Story 1

```bash
# User Story 1의 테스트 작업을 함께 실행:
Task: "src/app/api/events/route.test.ts에 POST 엔드포인트 테스트 작성"
Task: "src/components/gender-reveal/StepOneForm.test.tsx 갱신"
Task: "src/components/gender-reveal/ShareLinkBanner.test.tsx 작성"

# User Story 1의 독립 파일 구현 작업을 함께 실행:
Task: "src/components/gender-reveal/ShareLinkBanner.tsx 구현"
Task: "src/components/gender-reveal/ShareLinkBanner.stories.tsx 작성"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — 모든 스토리를 블록)
3. Complete Phase 3: User Story 1
4. Complete Phase 4: User Story 2 (User Story 1의 Acceptance #4를 완결시키기 위해 MVP에는 두 스토리를 함께 포함)
5. **STOP and VALIDATE**: quickstart.md 1~2번 섹션(생성자/참여자 플로우) 수동 검증
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 + 2 together → 생성→공유→참여자 접속 전체 흐름 검증 → Deploy/Demo (MVP!)
3. Add User Story 3 → 만료/404 처리 검증 → Deploy/Demo
4. 각 단계가 이전 단계를 깨지 않고 가치를 더함

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Foundational 완료 후:
   - Developer A: User Story 1 (POST 엔드포인트, StepOneForm, ShareLinkBanner)
   - Developer B: User Story 2 (GET 엔드포인트, `[id]/page.tsx`, ResultReveal 분기)
3. 두 스토리가 만나는 지점(T030 통합 테스트)에서 합류해 검증
4. User Story 3은 User Story 2 완료 후 별도 담당자가 이어서 진행

---

## Notes

- [P] tasks = 다른 파일, 완료되지 않은 작업에 대한 의존 없음
- [Story] 라벨은 작업을 특정 사용자 스토리에 매핑해 추적성을 보장
- User Story 1과 2는 강하게 결합되어 있으므로(같은 화면 공유) MVP 범위를 둘 다 포함해 정의했다
- 구현 전 quickstart.md의 해당 시나리오를 다시 확인해 회귀가 없는지 검증
- 각 작업 또는 논리적 그룹 완료 후 커밋
- 체크포인트마다 멈춰서 스토리를 독립적으로 검증
- 피할 것: 모호한 작업, 동일 파일 충돌, 스토리 간 불필요한 의존성으로 인한 독립성 훼손
