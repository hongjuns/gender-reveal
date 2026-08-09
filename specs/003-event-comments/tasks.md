---

description: "Task list template for feature implementation"
---

# Tasks: 결과 화면 댓글 기능

**Input**: Design documents from `/specs/003-event-comments/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/comments-api.md, quickstart.md (모두 존재)

**UI 구조 변경 안내**: plan.md 본문의 `CommentSection`(인라인 섹션) 설계는 Figma 확인 결과
팝업(모달) 기반 구조로 대체되었다. `CommentSection`은 `CommentModal`(컨테이너) +
`CommentWriteView`(작성 뷰, 기존 `CommentForm` 대체) + `CommentCarousel`(목록 뷰, 기존
`CommentList` 대체) + `CommentEmptyState`로 나뉜다. API/DB 설계(data-model.md,
contracts/comments-api.md)는 변경되지 않는다 — 아래 작업은 이 변경된 컴포넌트 구조를
기준으로 한다.

**Figma 참조**:
- CommentWriteView: `node-id=131-91` — https://www.figma.com/design/2jBmXrSjpcIpfrsy93ySPj/%EC%A0%A0%EB%8D%94%EB%A6%AC%EB%B9%8C---come-on-baby?node-id=131-91
- CommentCarousel: `node-id=131-78` — https://www.figma.com/design/2jBmXrSjpcIpfrsy93ySPj/%EC%A0%A0%EB%8D%94%EB%A6%AC%EB%B9%8C---come-on-baby?node-id=131-78
- `CommentModal`(팝업 프레임)·`CommentEmptyState`는 전용 노드가 없으므로 위 두 노드에서
  공통으로 보이는 팝업 테두리/X 버튼 위치/최대 너비를 기준으로 구현한다.

**Tests**: 헌법(`Principle VI`)이 신규 컴포넌트·유틸에 대한 Jest 테스트, 신규 컴포넌트에
대한 Storybook 스토리를 필수 Quality Gate로 요구하며, 사용자 지시에 따라 각 컴포넌트마다
테스트·스토리를 별도 작업으로 명시한다. TDD(테스트 선작성)가 명시적으로 요청되지는
않았으나, 002 컨벤션을 따라 각 스토리 안에서 "Tests" 섹션을 "Implementation" 섹션보다
먼저 배치한다.

**Organization**: 작업은 spec.md의 사용자 스토리(P1/P2/P3)별로 그룹화된다. User Story
1(댓글 작성)과 User Story 2(댓글 목록 조회)는 같은 `CommentModal` 컨테이너와 같은 API
라우트 파일(`route.ts`)을 공유하는 하나의 왕복 흐름(작성 ↔ 조회)의 양 끝단이라 002의
US1/US2처럼 구현상 결합되어 있다 — 자세한 내용은 Dependencies 참고.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 완료되지 않은 작업에 대한 의존 없음)
- **[Story]**: 해당 작업이 속한 사용자 스토리 (US1, US2, US3)
- 각 작업에 정확한 파일 경로 포함

## Path Conventions

plan.md의 Project Structure를 따른다: `supabase/migrations/`, `src/app/api/events/[id]/comments/`,
`src/components/gender-reveal/`, `src/hooks/`, `src/lib/api/`, `src/lib/supabase/`,
`src/types/` (repo root 기준). `gender_reveal_events` 테이블·마이그레이션(0001,
0002)·`/api/events`·`/api/events/[id]`·`genderRevealStore.ts`·`StepOneForm.tsx`·
`BalloonStage.tsx`는 이 작업 목록의 어떤 작업에서도 수정 대상이 아니다(spec.md FR-009).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 신규 DB 스키마 준비 및 프론트 구현 방식 확정

- [X] T001 [P] `supabase/migrations/0003_gender_reveal_comments.sql` 작성: `gender_reveal_comments` 테이블(`id uuid pk default gen_random_uuid()`, `event_id uuid not null references gender_reveal_events(id) on delete cascade`, `sender_name varchar(20) not null`, `content varchar(100) not null`, `sender_name`/`content` 공백 금지 CHECK 제약, `created_at timestamptz not null default now()`) + `event_id` 조회용 인덱스 생성(data-model.md 스키마 그대로)
- [X] T002 [P] `supabase/migrations/0004_comments_anon_insert_select_policies.sql` 작성: `gender_reveal_comments`에 RLS `enable` + `anon` insert/select 정책만 추가 — update/delete 정책은 만들지 않아 write-once를 DB 레벨에서 강제(data-model.md)
- [X] T003 [P] `package.json` 확인: 이미 설치된 캐러셀/슬라이더 라이브러리가 있는지 점검하고, 없으면 `CommentCarousel`을 신규 라이브러리 설치 없이 `useState(currentIndex)` + Tailwind transition으로 구현하기로 확정(사용자 지시, T029에서 이 결정을 그대로 따른다)

**Checkpoint**: DB 마이그레이션 SQL과 캐러셀 구현 방식이 준비된 상태

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: User Story 1·2·3이 공통으로 의존하는 타입·Supabase 타입 확장·API 클라이언트 함수·모달 컨테이너·진입 트리거(하트 아이콘)

**⚠️ CRITICAL**: 이 Phase가 끝나기 전에는 어떤 사용자 스토리 작업도 시작할 수 없음

- [X] T004 [P] `src/types/genderReveal.ts`에 `GenderRevealCommentRecord`, `ListCommentsResult`, `CreateCommentResult` 타입 추가(기존 타입은 변경하지 않고 추가만, data-model.md)
- [X] T005 [P] `src/lib/supabase/server.ts`의 `Database.public.Tables`에 `gender_reveal_comments` 항목(`Row`/`Insert`/`Update`)과 `GenderRevealCommentRow` 인터페이스 추가 — `getSupabaseServerClient()` 함수 본문은 수정하지 않음(신규 팩토리 아님, research.md #1)
- [X] T006 [P] `src/lib/api/comments.ts`에 axios(`src/lib/api/client.ts` 재사용) 기반 `listEventComments(eventId): Promise<ListCommentsResult>`, `createEventComment(eventId, input): Promise<CreateCommentResult>` 구현 — `404`/`410`/`400`을 `validateStatus`로 허용해 판별 유니온으로 매핑(contracts/comments-api.md)
- [X] T007 [P] `src/components/gender-reveal/CommentModal.tsx` 구현: `isOpen: boolean`, `view: 'write' | 'list'`, `onClose: () => void`를 props로 받는 팝업 컨테이너. Figma `node-id=131-91`/`131-78`에서 공통으로 보이는 팝업 프레임(테두리, X 버튼 위치, 최대 너비)을 기준으로 스타일링하고, `view`에 따라 `writeSlot`/`listSlot`(children으로 전달) 중 하나만 렌더링
- [X] T008 [P] `src/lib/api/comments.test.ts` 작성: `listEventComments`/`createEventComment`가 각 응답 코드(200/201/400/404/410)를 contracts/comments-api.md의 유니온으로 올바르게 매핑하는지 확인(axios 모킹, T006 완료 후 검증 가능하도록 계약 문서 기준으로 작성)
- [X] T009 [P] `src/components/gender-reveal/CommentModal.test.tsx` 작성: `isOpen=false`면 아무것도 렌더링하지 않는지, X 버튼 클릭 시 `onClose`가 호출되는지, `view` prop에 따라 올바른 슬롯만 렌더링되는지 확인
- [X] T010 [P] `src/components/gender-reveal/CommentModal.stories.tsx` 작성(Constitution Principle VI)
- [X] T011 `src/components/gender-reveal/ResultReveal.tsx`에 `eventId?: string` prop 추가 + 하트 아이콘 버튼 삽입(html2canvas 캡처 대상인 `captureRef` **바깥**에 배치, research.md #6): `eventId`가 있을 때만 하트 아이콘이 노출되고, 클릭 시 로컬 `useState`로 `CommentModal`(T007)을 `isOpen=true, view='write'`로 여는 상태를 연결. `eventId`가 없으면(레거시 `/gender-reveal` 경로) 하트 아이콘도 `CommentModal`도 렌더링되지 않는다(spec.md FR-005 자연 충족)
- [X] T012 [P] `src/components/gender-reveal/ResultReveal.test.tsx` 갱신: `eventId`가 주어지면 하트 아이콘이 렌더링되고 클릭 시 모달이 `view='write'`로 열리는지, `eventId`가 없으면 하트 아이콘이 DOM에 없는지 확인(기존 테스트 케이스는 그대로 유지)
- [X] T013 [P] `src/components/gender-reveal/ResultReveal.stories.tsx`에 `eventId`가 있는 스토리(모달 오픈 상호작용 포함)를 추가
- [X] T014 [P] `src/app/gender-reveal/[id]/page.tsx`의 `<ResultReveal .../>` 호출에 `eventId={id}` prop 한 줄만 추가(그 외 로직 변경 없음)

**Checkpoint**: 공용 타입·API 클라이언트 함수·모달 컨테이너·진입 트리거(하트 아이콘)가 준비되어, 이후 작성(US1)/조회(US2) 뷰를 독립적으로 채울 수 있음

---

## Phase 3: User Story 1 - 결과 화면에서 축하 댓글 남기기 (Priority: P1) 🎯 MVP

**Goal**: 참여자가 하트 아이콘을 클릭해 열린 `CommentModal`의 기본(write) 뷰에서 이름과 내용을 입력해 댓글을 등록할 수 있다.

**Independent Test**: 하트 아이콘 클릭 → 작성 뷰에서 이름/내용을 입력하고 "완료하기" 클릭 → `POST /api/events/[id]/comments`가 `201`을 반환하고 폼이 초기화되는지 확인(목록 뷰가 아직 없어도 API 응답과 폼 리셋만으로 독립 검증 가능). 이름 또는 내용이 비어 있으면 제출이 막히는지 확인.

### Tests for User Story 1

- [X] T015 [P] [US1] `src/app/api/events/[id]/comments/route.test.ts` 작성(POST 케이스): 존재하지 않는 `id` → `404`, 만료된 `id` → `410`, `senderName`/`content` 공백 또는 각각 20자/100자 초과 → `400`, 모두 유효 → `201` + 저장된 댓글 반환. 검증 순서(존재 → 만료 → 입력값)가 지켜지는지도 확인(contracts/comments-api.md)
- [X] T016 [P] [US1] `src/hooks/useCreateEventComment.test.ts` 작성: `mutate` 성공 시 `onSuccess`가 호출되고, `invalid`/`expired`/`not_found` 결과가 그대로 호출자에게 전달되는지 확인(T006 모킹)
- [X] T017 [P] [US1] `src/components/gender-reveal/CommentWriteView.test.tsx` 작성: `content` textarea에 100자 초과 입력 시 더 입력되지 않고 카운터가 "100/100자"로 고정되는지, 프리셋 칩 클릭 시 문구가 삽입되는지(삽입 시 100자를 넘기면 삽입되지 않고 안내 문구가 뜨는지), `senderName`/`content` 중 하나라도 비어 있으면 "완료하기"가 비활성화되거나 제출이 막히는지 확인

### Implementation for User Story 1

- [X] T018 [P] [US1] `src/app/api/events/[id]/comments/route.ts`에 `POST` 핸들러 구현(contracts/comments-api.md): (1) `gender_reveal_events`에서 `id` 조회 → 없으면 `404`, (2) `isLinkExpired`(`src/lib/date.ts` 재사용, research.md #2)로 만료 체크 → `410`, (3) `senderName`/`content`를 trim 후 공백·길이(20/100자) 검증 → `400`, (4) `gender_reveal_comments`에 insert → `201`
- [X] T019 [P] [US1] src/hooks/useCreateEventComment.ts에 TanStack Query mutation 훅 구현
  (T006의 createEventComment 사용). onSuccess 시 useEventComments(eventId) 쿼리 캐시에
  새 댓글을 맨 앞(created_at DESC 기준 최신)에 즉시 반영(setQueryData 또는
  invalidateQueries)한다(data-model.md State transitions 참고).
- [X] T020 [US1] Figma MCP로 `node-id=131-91`을 조회해 레이아웃(간격, 색상, 타이포, 버튼 배치)을 확인한 뒤 `src/components/gender-reveal/CommentWriteView.tsx` 구현: `content` textarea(100자 제한 + "N/100자" 실시간 카운터) → `senderName` text input(순서: 내용 → 보내는 사람) → 프리셋 태그 칩 3개("#건강하게 자라렴♥", "#행복하길 바라", "#세상에 와줘서 고마워", 클릭 시 100자 제한 내에서만 textarea에 삽입) → "완료하기" 버튼(T019 훅으로 제출) → "댓글보기" 버튼(우선 완료하기 버튼 인접 영역에 배치, 클릭 시 부모로부터 받은 `onViewChange('list')` 콜백 호출)
- [X] T021 [P] [US1] `CommentModal`(T007)의 `writeSlot`에 `CommentWriteView`(T020)를 연결하고, `ResultReveal`(T011)에서 모달을 열 때 초기 `view`를 `'write'`로 설정
- [X] T022 [P] [US1] `src/components/gender-reveal/CommentWriteView.stories.tsx` 작성: 빈 상태, 글자수 임계치 근접 상태, 검증 에러 상태를 각각 스토리로 문서화(Constitution Principle VI)

**Checkpoint**: 하트 아이콘 → 작성 뷰 → 댓글 등록까지 독립적으로 수행 가능. 등록된 댓글이 화면에 "보이는" 최종 확인은 Phase 4(User Story 2)의 목록 뷰 완성 후 종단 검증된다(002의 US1/US2 결합 패턴과 동일).

---

## Phase 4: User Story 2 - 모든 참여자가 동일한 댓글 목록 보기 (Priority: P2)

**Goal**: `CommentModal`의 목록(list) 뷰에서 해당 공유 링크에 달린 모든 댓글을 최신순 캐러셀로 볼 수 있다.

**Independent Test**: 이미 댓글이 여러 개 달린 공유 링크를 새 창에서 열어 하트 아이콘 → "댓글보기" 클릭 → 댓글이 최신순 슬라이드로 보이고 dot 클릭/스와이프로 이동 가능한지 확인. 댓글이 0개인 이벤트에서는 `CommentEmptyState`가 보이는지 확인.

### Tests for User Story 2

- [X] T023 [P] [US2] `src/app/api/events/[id]/comments/route.test.ts`에 GET 케이스 추가: 존재하지 않는 `id` → `404`, 만료된 `id` → `410`, 유효한 `id` → `200` + `created_at DESC`로 정렬된 댓글 배열
- [X] T024 [P] [US2] `src/hooks/useEventComments.test.ts` 작성: `200`/`404`/`410` 응답이 각각 올바른 `ListCommentsResult` 유니온으로 매핑되는지 확인(T006 모킹)
- [X] T025 [P] [US2] `src/components/gender-reveal/CommentCarousel.test.tsx` 작성: 댓글이 1개 이상일 때 현재 슬라이드의 `content` + "From. {senderName}"이 보이는지, dot 클릭으로 `currentIndex`가 이동하는지, "덕담 남기기" 클릭 시 `onViewChange('write')` 콜백이 호출되는지 확인
- [X] T026 [P] [US2] `src/components/gender-reveal/CommentEmptyState.test.tsx` 작성: 안내 문구가 렌더링되는지 확인

### Implementation for User Story 2

- [X] T027 [US2] `src/app/api/events/[id]/comments/route.ts`(T018)에 `GET` 핸들러 추가(contracts/comments-api.md, T018과 같은 파일이라 T018 이후에 진행): `id` 조회 → `404`/`410`, 유효하면 `gender_reveal_comments`를 `event_id`로 필터링해 `created_at DESC` 정렬 후 `200` 반환
- [X] T028 [P] [US2] `src/hooks/useEventComments.ts`에 TanStack Query 훅 구현(T006의 `listEventComments` 사용)
- [X] T029 [US2] Figma MCP로 `node-id=131-78`을 조회해 레이아웃(고정 일러스트/타이틀 위치, 슬라이드 카드 스타일, dot 페이지네이션 스타일)을 확인한 뒤 `src/components/gender-reveal/CommentCarousel.tsx` 구현: 고정 일러스트(하트 손 모양 이미지) + 정적 타이틀("OO아 세상에 온 걸 환영한다!" — 태명은 기존 `input`에서 가져옴) 아래 댓글을 `useState(currentIndex)`로 1개씩 슬라이드 표시(`content` + "From. {senderName}"), 댓글 개수만큼 dot 페이지네이션(클릭 시 이동), 스와이프(터치 이벤트)로 `currentIndex` 변경, 하단에 "덕담 남기기" 버튼(클릭 시 `onViewChange('write')` 콜백 호출). 신규 캐러셀 라이브러리를 추가하지 않고 Tailwind transition만 사용(T003 결정 반영, T028 훅 사용)
- [X] T030 [P] [US2] `src/components/gender-reveal/CommentEmptyState.tsx` 구현: 댓글이 0개일 때 `CommentCarousel` 자리에 표시되는 안내 문구(팝업 프레임 톤앤매너 기준)
- [X] T031 [US2] `CommentModal`(T007)의 `listSlot`에 T028 훅 결과를 연결: 댓글이 있으면 `CommentCarousel`(T029), 없으면 `CommentEmptyState`(T030)를 렌더링(T029, T030 완료 후 진행)
- [X] T032 [P] [US2] `src/components/gender-reveal/CommentCarousel.stories.tsx` 작성: 댓글 1개, 여러 개, 내용 최대 길이 근접 케이스를 각각 스토리로 문서화
- [X] T033 [P] [US2] `src/components/gender-reveal/CommentEmptyState.stories.tsx` 작성(Constitution Principle VI)

**Checkpoint**: 하트 아이콘 → 작성/목록 뷰 전환 → 댓글 등록 → 목록에서 확인까지 전체 왕복 흐름이 종단 간 검증 가능(User Story 1의 "즉시 반영" Acceptance가 이 시점에 최종 확인됨)

---

## Phase 5: User Story 3 - 만료되거나 존재하지 않는 링크에서는 댓글 기능 자체를 숨김 (Priority: P3)

**Goal**: 만료되었거나 존재하지 않는 공유 링크에서는 하트 아이콘/`CommentModal` 자체가 노출되지 않고, 열람 중 만료된 레이스 케이스에서는 댓글 제출이 거부된다.

**Independent Test**: 만료/미존재 링크로 접속 시 기존 안내 화면만 보이고 하트 아이콘이 없는지 확인. 유효한 링크를 열어둔 채 서버에서 해당 이벤트를 만료시킨 뒤 작성 뷰에서 댓글을 제출하면 등록이 거부되고 만료 안내로 전환되는지 확인.

### Tests for User Story 3

- [X] T034 [P] [US3] `src/components/gender-reveal/ResultReveal.test.tsx`(T012)에 회귀 테스트 케이스 추가: `eventId`가 `undefined`이면 하트 아이콘·`CommentModal` 관련 요소가 DOM에 전혀 없음을 확인(spec.md FR-005)
- [X] T035 [P] [US3] `src/components/gender-reveal/CommentWriteView.test.tsx`(T017)에 케이스 추가: 제출 결과가 `not_found`/`expired`일 때 입력 폼 대신 만료/삭제 안내 문구가 표시되고 입력 필드가 비활성화되는지 확인

### Implementation for User Story 3

- [X] T036 [US3] `src/components/gender-reveal/CommentWriteView.tsx`(T020)에 제출 실패 분기 추가: `useCreateEventComment`(T019) 결과가 `status: 'not_found'` 또는 `'expired'`이면 폼을 만료/삭제 안내 문구로 교체하고 입력을 비활성화한다(spec.md FR-007, Edge Cases — 열람 중 만료된 레이스 케이스)

**Checkpoint**: 세 사용자 스토리 모두 독립적으로 동작 — 정상/만료/미존재 링크에서 댓글 기능이 spec.md 요구사항대로 분기한다. "하트 아이콘 자체가 만료/미존재 화면에 없음"은 002의 기존 라우팅(만료/404 시 `ResultReveal` 자체가 렌더링되지 않음)과 T011의 `eventId` 조건부 렌더링만으로 이미 충족되므로 이 Phase에 별도 신규 라우팅 코드는 없다.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 여러 사용자 스토리에 걸친 마무리 검증

- [X] T037 [P] `npm run lint` 통과 확인 및 잔여 ESLint 경고 정리(Constitution Principle VI)
- [X] T038 [P] `git diff`로 `gender_reveal_events` 테이블 마이그레이션(0001, 0002)·`/api/events/route.ts`·`/api/events/[id]/route.ts`·`genderRevealStore.ts`·`StepOneForm.tsx`·`BalloonStage.tsx`가 이번 변경으로 실제 수정되지 않았는지 확인(spec.md FR-009)
- [X] T039 quickstart.md의 User Story 1~3 수동 검증 시나리오 + "기존 기능 회귀 없음 확인" 섹션을 개발 서버에서 순서대로 수행
- [X] T040 [P] `supabase/migrations/0003`, `0004`를 Supabase 프로젝트에 적용하는 절차를 quickstart.md Prerequisites 기준으로 재확인(SQL Editor 또는 `supabase db push`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료에 의존(마이그레이션이 적용되어 있어야 실제 DB 호출 테스트가 의미 있음) — 모든 사용자 스토리를 블록함
- **User Story 1 (Phase 3)**: Foundational 완료에 의존. 자체 Acceptance(작성/검증 실패 안내)는 독립적으로 완결되나, "댓글이 화면에 보인다"는 최종 확인은 User Story 2의 목록 뷰가 있어야 종단 검증됨
- **User Story 2 (Phase 4)**: Foundational 완료에 의존. `GET` 핸들러(T027)는 `POST` 핸들러(T018)와 같은 파일(`route.ts`)에 이어서 작성하므로 코드 작성 순서상 T018 이후에 진행하지만, 훅/컴포넌트(T028~T033)는 US1과 무관하게 독립적으로 개발 가능
- **User Story 3 (Phase 5)**: Foundational과 User Story 1의 `CommentWriteView`(T020)·`useCreateEventComment`(T019) 완료에 의존 — 같은 파일에 실패 분기를 추가하는 구조이기 때문
- **Polish (Phase 6)**: 모든 사용자 스토리 완료에 의존

### User Story Dependencies

- **User Story 1 (P1)**과 **User Story 2 (P2)**는 같은 `CommentModal` 컨테이너와 같은 API 라우트 파일을 공유하는 하나의 왕복 흐름(작성 ↔ 조회)의 양 끝단이라 완전히 독립적이지는 않다 — 002의 US1/US2 결합과 동일한 성격. `route.ts`에 `POST`(T018)를 먼저 작성하고 `GET`(T027)을 이어서 추가해야 하지만, 컴포넌트/훅 계층은 서로 다른 파일이라 병렬 진행이 가능하다.
- **User Story 3 (P3)**는 User Story 1이 만든 `CommentWriteView`/`useCreateEventComment`를 확장하므로 반드시 그 이후에 진행한다.

### Within Each User Story

- 테스트는 구현과 같은 스토리 안에서 함께 완료한다(파일별로 [P] 병렬 가능)
- API 클라이언트/훅 구현 → 컴포넌트 연동 순서를 따른다
- 스토리 완료 후 다음 우선순위로 이동

### Parallel Opportunities

- Setup의 모든 [P] 작업(T001~T003)은 병렬 실행 가능
- Foundational의 [P] 작업은 완료된 선행 작업의 깊이가 같으면 함께 병렬 실행 가능: (T004, T005, T006, T007) → (T008, T009, T010) → (T011 완료 후) (T012, T013, T014)
- Foundational 완료 후 User Story 1(T015~T022)과 User Story 2의 훅/컴포넌트 작업(T028, T030, T032, T033 등)은 서로 다른 파일이라 병렬 진행 가능 — 단, `route.ts`를 다루는 T018과 T027만 순서를 지킨다
- 각 스토리 내 테스트 작업(예: T015, T016, T017)은 서로 다른 파일이라 병렬 실행 가능

---

## Parallel Example: User Story 1

```bash
# User Story 1의 테스트 작업을 함께 실행:
Task: "src/app/api/events/[id]/comments/route.test.ts에 POST 케이스 작성"
Task: "src/hooks/useCreateEventComment.test.ts 작성"
Task: "src/components/gender-reveal/CommentWriteView.test.tsx 작성"

# User Story 1의 독립 파일 구현 작업을 함께 실행:
Task: "src/app/api/events/[id]/comments/route.ts에 POST 핸들러 구현"
Task: "src/hooks/useCreateEventComment.ts 구현"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — 모든 스토리를 블록)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: `POST` 응답과 폼 초기화만으로 User Story 1의 핵심 Acceptance(작성/검증) 독립 검증
5. spec.md 우선순위상 MVP는 User Story 1까지지만, "댓글이 실제로 보인다"를 데모하려면 User Story 2를 곧바로 이어서 포함하는 것을 권장(002와 동일한 결합 이유)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → 작성 흐름 독립 검증 → (선택) Deploy/Demo
3. Add User Story 2 → 작성↔조회 전체 왕복 흐름 검증 → Deploy/Demo (사실상의 MVP)
4. Add User Story 3 → 만료/미존재 처리 검증 → Deploy/Demo
5. 각 단계가 이전 단계를 깨지 않고 가치를 더한다

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Foundational 완료 후:
   - Developer A: User Story 1(`POST` 핸들러, `useCreateEventComment`, `CommentWriteView`)
   - Developer B: User Story 2(`useEventComments`, `CommentCarousel`, `CommentEmptyState`) — 단, `GET` 핸들러(T027)는 Developer A의 `POST`(T018)가 같은 파일에 먼저 들어간 뒤 이어서 작성
3. 두 스토리가 만나는 지점(`CommentModal`의 write↔list 전환)에서 합류해 검증
4. User Story 3은 User Story 1 완료 후 별도 담당자가 이어서 진행

---

## Notes

- [P] tasks = 다른 파일, 완료되지 않은 작업에 대한 의존 없음
- [Story] 라벨은 작업을 특정 사용자 스토리에 매핑해 추적성을 보장
- `CommentWriteView`(T020), `CommentCarousel`(T029) 작업은 반드시 Figma MCP로 해당
  node-id를 먼저 조회한 뒤 구현을 시작한다
- User Story 1과 2는 같은 모달/같은 API 파일을 공유하므로 실질적인 MVP 데모는 둘을 함께
  포함해 정의했다
- 구현 전 quickstart.md의 해당 시나리오를 다시 확인해 회귀가 없는지 검증
- 각 작업 또는 논리적 그룹 완료 후 커밋
- 체크포인트마다 멈춰서 스토리를 독립적으로 검증
- 피할 것: 모호한 작업, 동일 파일 충돌, 스토리 간 불필요한 의존성으로 인한 독립성 훼손
