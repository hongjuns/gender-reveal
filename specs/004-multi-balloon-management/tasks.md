---

description: "Task list for 004 여러 풍선 생성 및 관리 링크"
---

# Tasks: 여러 풍선 생성 및 관리 링크

**Input**: Design documents from `/specs/004-multi-balloon-management/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/events-api.md, contracts/manage-api.md, quickstart.md (모두 존재)

**Branch**: `feature/v3` (새 브랜치를 만들지 않는다)

**Figma 참조** (파일 `2jBmXrSjpcIpfrsy93ySPj`, 구현 전 `get_design_context`로 간격·폰트 확인):
- Step1 공통 정보 입력 `258-2` — 패스키 영역(`278:31~278:34`)·사람 아이콘(`278:88`) **구현하지 않음**
- Step2 받는 사람 입력 `258-29`
- Step3 생성 중 로딩 `258-81`
- Step4 관리 링크 모달 `278-112` — 닫기(X) **없음**, 복사 성공 시 숨김
- Step5 풍선 관리 `258-106` — 연장 버튼·만료일은 디자인 없음(행 안에 "삭제"와 같은 보조 텍스트 톤으로 배치)

**Tests**: 헌법 Principle VI에 따라 신규·변경 Route Handler, 훅, 유틸, 컴포넌트에 Jest 테스트를,
신규 컴포넌트에 Storybook 스토리를 둔다. 각 스토리 안에서 Tests를 Implementation보다 먼저 배치한다(002·003 관례).
테스트 파일은 대상 파일과 같은 디렉터리에 `*.test.ts(x)`로 둔다.

**기존 실패 테스트**: `main` 기준 8개(ExpiredLinkNotice, [id]/page, UpdateNoticeModal, BalloonStage,
ResultReveal)는 이번 범위가 아니다. 새로 실패하는 테스트가 없어야 한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 다른 파일을 다루고 미완료 작업에 의존하지 않아 병렬 가능
- **[Story]**: US1~US5 (spec.md User Stories)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: DB 변경 적용과 공용 상수

- [ ] T001 Supabase SQL Editor에서 `supabase/migrations/0005_event_code_and_extension.sql` → `supabase/migrations/0006_events_anon_update_delete_policies.sql` 순서로 적용하고, `gender_reveal_events`에 `code`(NOT NULL, 기본값 있음) 칼럼과 `idx_gender_reveal_events_code` 인덱스가 생겼는지 확인한다(사용자 수동 작업 — 구현 에이전트는 적용 여부만 사용자에게 확인)
- [X] T002 [P] `src/lib/recipients.ts` 생성: `MAX_RECIPIENTS = 10` 상수와 `normalizeRecipientNames(value: unknown): string[] | null`(배열 아님·0개·10개 초과·trim 후 빈 문자열 포함 시 `null`, 아니면 trim된 배열 반환) 구현
- [X] T003 [P] `src/lib/recipients.test.ts` 작성: 정상 1명/10명, 0명, 11명, 빈 문자열·공백만 포함, 배열 아님, 앞뒤 공백 trim, 중복 이름 허용 케이스

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 스토리가 쓰는 타입·날짜 유틸, 관리 코드 비노출 보강

**⚠️ CRITICAL**: 이 단계가 끝나야 사용자 스토리 작업을 시작한다

- [X] T004 `src/lib/supabase/server.ts`의 `GenderRevealEventRow`에 `code: string`이 있고 `Insert`에서 선택값인지 확인(이미 반영됨 — `npx tsc --noEmit` 통과 확인)
- [X] T005 [P] `src/types/genderReveal.ts`에 contracts/manage-api.md의 `ManagedBalloon`, `ManagedBalloonGroup`(`babyNickname`, `dueDate`, `babyGender`, `balloons`), `GetManagedGroupResult`, `DeleteBalloonResult`, `ExtendBalloonResult` 타입 추가. `GenderRevealEventRecord`에는 code를 추가하지 않는다
- [X] T006 [P] `src/lib/date.ts`에 `calculateExtendedExpiresAt(linkExpiresAt: Date, now: Date = new Date()): Date` 추가 — `addDays(max(linkExpiresAt, now), 7)` (date-fns `max`, `addDays` 사용, research #5)
- [X] T007 [P] `src/lib/date.test.ts`에 `calculateExtendedExpiresAt` 테스트 추가: 만료 전(기존 만료 + 7일), 만료 후(now + 7일), 경계값(만료 시각 == now)
- [X] T008 [P] `src/app/api/events/[id]/route.ts`의 조회를 `select('id, baby_nickname, due_date, recipient_name, gender, link_expires_at, created_at')`로 변경(FR-009, contracts/events-api.md)
- [X] T009 [P] `src/app/api/events/[id]/route.test.ts`에 "응답 JSON에 `code`·`manageLink` 키가 없다" 테스트와 select 칼럼에 `code`가 포함되지 않는다는 검증 추가
- [X] T010 [P] `src/app/api/events/[id]/comments/route.ts`의 GET·POST 이벤트 확인 조회를 `select('id, link_expires_at')`로 변경하고 `src/app/api/events/[id]/comments/route.test.ts`의 mock이 깨지지 않게 갱신

**Checkpoint**: 타입·유틸 준비 완료, 받는 사람용 API가 code를 읽지 않음

---

## Phase 3: User Story 1 - 받는 사람 여러 명에게 보낼 풍선을 한 번에 만들기 (Priority: P1) 🎯 MVP

**Goal**: Step1 → Step2 → Step3 흐름으로 받는 사람 1~10명의 풍선을 하나의 code로 한 번에 생성

**Independent Test**: 받는 사람 3명으로 생성 → 로딩 화면 최소 2초 → `/gender-reveal/manage/{code}?created`로 이동. DB에 같은 code·같은 만료 시각의 행 3개가 생기고, 각 공유 링크가 해당 받는 사람 이름으로 열림

### Tests for User Story 1

- [X] T011 [P] [US1] `src/app/api/events/route.test.ts`를 일괄 생성 계약으로 재작성: 201 응답에 `code`·`manageLink`·`linkExpiresAt`·`events[]`(요청 순서) 포함, insert가 **한 번** 배열로 호출되고 모든 행의 `code`·`link_expires_at`이 같으며 `created_at`이 index ms씩 증가, `recipientNames` 0개/11개/빈 이름/배열 아님/기존 `recipientName` 단건 바디 → 400, insert 오류 → 500
- [X] T012 [P] [US1] `src/components/gender-reveal/RecipientListForm.test.tsx` 작성: 최초 01번 1칸·X 없음, `+`로 02 추가·X 있음, 10칸에서 `+` 비활성화, 중간 칸 X 시 번호 재정렬·입력값 유지, 빈 칸 제출 시 `onSubmit` 미호출·오류 표시, 뒤로 가기 버튼 `onBack` 호출
- [X] T013 [P] [US1] `src/components/gender-reveal/BalloonCreatingView.test.tsx` 작성: "{태명}의" / "풍선이 만들어지고 있어요." 문구 렌더, `role="status"` 등 접근성 속성
- [X] T014 [P] [US1] `src/components/gender-reveal/StepOneForm.test.tsx` 갱신: 받는 사람 칸·패스키·사람 아이콘이 없음, 필수값 누락 시 Step2로 이동하지 않음, "받는 사람 입력" → RecipientListForm 표시, 뒤로 가기 시 Step1 값 유지, 생성 성공 시 로딩 화면 후(fake timers 2초) `router.push('/gender-reveal/manage/{code}?created')`, 생성 실패 시 Step2로 복귀·입력값 유지·오류 문구, `LinkGeneratedModal` 미사용

### Implementation for User Story 1

- [X] T015 [US1] `src/app/api/events/route.ts`를 contracts/events-api.md대로 재작성: 바디 검증(`normalizeRecipientNames` 사용), `code = crypto.randomUUID()`, `createdAt`/`linkExpiresAt` 1회 계산, 받는 사람별 `id = crypto.randomUUID()`·`share_link = id`·`created_at = createdAt + index ms`로 행 배열을 만들어 `insert(rows)` 단일 호출, 201 응답에 `code`, `manageLink`(`${origin}/gender-reveal/manage/${code}`), `linkExpiresAt`, `events[{ id, recipientName, shareLink }]`
- [X] T016 [P] [US1] `src/lib/api/events.ts`의 `CreateGenderRevealEventInput`을 `{ babyNickname, dueDate, babyGender, recipientNames: string[] }`로, `CreateGenderRevealEventResponse`를 `{ code, manageLink, linkExpiresAt, events }`로 변경하고 `src/lib/api/events.test.ts` 갱신
- [X] T017 [P] [US1] `src/hooks/useCreateGenderRevealEvent.ts`가 변경된 타입으로 컴파일되는지 확인(필요 시 타입만 수정)
- [X] T018 [P] [US1] `src/components/gender-reveal/RecipientListForm.tsx` 구현(Figma 258-29): props `{ initialNames: string[]; onBack(names): void; onSubmit(names): void; isSubmitting: boolean; errorMessage: string | null }`, "받는 사람 NN" 라벨(두 자리), placeholder "예시: 할머니, 할아버지", 첫 칸 외 X 버튼, 원형 `+` 버튼(`MAX_RECIPIENTS` 도달 시 disabled), "젠더리빌 풍선 만들기 >" 제출 버튼, 상단 뒤로 가기 버튼. 스타일은 `StepOneForm`의 입력칸/버튼 클래스와 맞춘다
- [X] T019 [P] [US1] `src/components/gender-reveal/BalloonCreatingView.tsx` 구현(Figma 258-81): props `{ babyNickname: string }`, `public/img/step2/heart-pink.png`·`heart-blue.png`를 디자인 위치대로 배치, 하단에 "{태명}의" / "풍선이 만들어지고 있어요." 두 줄(font-pixel), `role="status"` `aria-live="polite"`
- [X] T020 [US1] `src/components/gender-reveal/StepOneForm.tsx` 변경(Figma 258-2): 받는 사람 칸 제거, 하위 단계 state `'common' | 'recipients' | 'creating'`과 `recipientNames` state 추가, 제출 버튼 문구 "받는 사람 입력 >"로 변경 후 검증 통과 시 `'recipients'`로 전환, RecipientListForm 제출 시 `'creating'`으로 전환하고 `Promise.all([mutateAsync(...), wait(2000)])` 후 `router.push(`/gender-reveal/manage/${code}?created`)`, 실패 시 `'recipients'`로 복귀 + "풍선 생성에 실패했어요. 다시 시도해주세요". `LinkGeneratedModal` import·state 제거, `UpdateNoticeModal`은 유지. 패스키·사람 아이콘은 만들지 않는다
- [X] T021 [P] [US1] `src/components/gender-reveal/RecipientListForm.stories.tsx`, `src/components/gender-reveal/BalloonCreatingView.stories.tsx` 작성(기본, 3명 입력, 10명 상한, 오류 상태)
- [X] T022 [US1] `src/components/gender-reveal/LinkGeneratedModal.tsx`, `LinkGeneratedModal.test.tsx`, `LinkGeneratedModal.stories.tsx` 삭제(research #8). `src/app/gender-reveal/[id]/page.tsx`의 `ShareLinkBanner`는 변경하지 않는다
- [X] T023 [US1] (생략 — US2 실제 관리 화면을 바로 구현해 불필요) 관리 화면이 생기기 전 임시 확인용: `src/app/gender-reveal/manage/[code]/page.tsx`에 code만 표시하는 최소 페이지를 두어 이동을 확인할 수 있게 한다(US3에서 교체)

**Checkpoint**: 생성 흐름 단독 동작. 관리 화면은 임시 페이지

---

## Phase 4: User Story 2 - 관리 화면에서 받는 사람별 링크 복사하기 (Priority: P1)

**Goal**: 관리 화면(Step5)에서 묶음의 받는 사람 목록과 행별 공유 링크 복사

**Independent Test**: 관리 화면에서 02번 "링크 복사하기" → 복사된 링크로 접속 시 02번 받는 사람 풍선. 받는 사람 화면·응답에 code 0건

### Tests for User Story 2

- [X] T024 [P] [US2] `src/app/api/manage/[code]/route.test.ts` 작성: code 일치 행을 `created_at` 오름차순으로 반환(만료 풍선 포함, `isExpired`·`canExtend` 계산), 0행 → 404, DB 오류 → 500, 응답 `balloons[].shareLink`가 `${origin}/gender-reveal/${id}`
- [X] T025 [P] [US2] `src/lib/api/manage.test.ts` 작성: `getManagedGroup` 200 → ok, 404 → not_found
- [X] T026 [P] [US2] `src/hooks/useManagedBalloons.test.tsx` 작성: queryKey `['managed-balloons', code]`, `retry: false`
- [X] T027 [P] [US2] `src/components/gender-reveal/ManagedBalloonRow.test.tsx` 작성: "받는 사람 NN" 라벨·이름 표시, "링크 복사하기" 클릭 시 clipboard에 shareLink 기록·완료 토스트, clipboard 실패 시 오류 문구, "삭제" 클릭 시 `onDelete(id)` 호출
- [X] T028 [P] [US2] `src/components/gender-reveal/BalloonManager.test.tsx` 작성: 헤더 "풍선이 생성되었어요!"/"링크를 복사하여 풍선 이벤트를 선물하세요.", 풍선 일러스트, 행 목록 순서

### Implementation for User Story 2

- [X] T029 [US2] `src/app/api/manage/[code]/route.ts` 구현(contracts/manage-api.md `GET`): `select('id, baby_nickname, due_date, gender, recipient_name, link_expires_at, created_at').eq('code', code).order('created_at', { ascending: true })`, 응답에 `code` 자체는 넣지 않는다
- [X] T030 [P] [US2] `src/lib/api/manage.ts`에 `getManagedGroup(code)` 구현(axios `apiClient`, `validateStatus`로 404 처리)
- [X] T031 [P] [US2] `src/hooks/useManagedBalloons.ts` 구현(`useQuery`, `enabled: Boolean(code)`, `retry: false`)
- [X] T032 [P] [US2] `src/components/gender-reveal/ManagedBalloonRow.tsx` 구현(Figma 258-106 행): props `{ index: number; balloon: ManagedBalloon; onDelete(id): void; onExtend?(id): void; isMutating?: boolean }`, 라벨 행 오른쪽 "삭제" 텍스트 버튼, 회색 박스 안 이름 + "링크 복사하기"·복사 아이콘. 연장 UI 자리는 US5에서 채운다
- [X] T033 [US2] `src/components/gender-reveal/BalloonManager.tsx` 구현(Figma 258-106): 헤더 2줄, 풍선 + 하트 장식(`public/img/step2/balloon.png`, `heart-pink.png`, `heart-blue.png` 재사용 — 디자인의 리본 달린 검은 풍선과 다르면 Figma에서 내보내 `public/img/manage/balloon.png`로 추가), `ManagedBalloonRow` 목록
- [X] T034 [US2] `src/app/gender-reveal/manage/[code]/page.tsx`를 실제 화면으로 교체: `useManagedBalloons(code)`로 로딩(`StepSkeleton`)/not_found(`notFound()`)/오류/정상(`BalloonManager`) 분기
- [X] T035 [P] [US2] `src/app/gender-reveal/manage/[code]/layout.tsx` 작성: `metadata = { robots: { index: false, follow: false }, referrer: 'no-referrer' }`(research #2)
- [X] T036 [P] [US2] `src/components/gender-reveal/ManagedBalloonRow.stories.tsx`, `src/components/gender-reveal/BalloonManager.stories.tsx` 작성(1명, 4명, 만료 포함)

**Checkpoint**: US1 + US2로 생성 → 공유 가능

---

## Phase 5: User Story 3 - 관리 링크를 보관하고 나중에 관리 화면으로 돌아오기 (Priority: P1)

**Goal**: 생성 직후 관리 링크 모달(Step4) 자동 노출, 복사 성공 시 숨김, 관리 링크 재접속

**Independent Test**: 생성 직후 모달 → 복사 → 모달 사라짐·URL에서 `?created` 제거 → 새로고침 시 모달 안 뜸 → 시크릿 창에서 관리 링크로 같은 목록

### Tests for User Story 3

- [X] T037 [P] [US3] `src/components/gender-reveal/ManageLinkModal.test.tsx` 작성: 안내 문구 3줄·관리 링크 표시, 닫기(X) 버튼 없음, 바깥 클릭·Esc로 `onCopied` 미호출, "링크 복사하기" 성공 시 clipboard에 manageLink 기록 후 `onCopied` 호출, 실패 시 오류 문구·링크 입력칸 선택 가능·"직접 보관했어요" 버튼 노출 → 클릭 시 `onCopied` 호출
- [X] T038 [P] [US3] `src/app/gender-reveal/manage/[code]/page.test.tsx` 작성: `?created` 있으면 모달 노출, 없으면 미노출, `onCopied` 후 모달 사라지고 `router.replace('/gender-reveal/manage/{code}')` 호출, not_found 시 `notFound()` 호출

### Implementation for User Story 3

- [X] T039 [US3] `src/components/gender-reveal/ManageLinkModal.tsx` 구현(Figma 278-112): props `{ manageLink: string; onCopied(): void }`, 반투명 배경 + 흰 카드(rounded 10px), "현재 페이지로 / 돌아오기 위해 아래 링크를 복사하여 / 별도 보관해주세요." (font-pixel), 읽기 전용 링크 입력칸(말줄임), "링크 복사하기" 검정 버튼. X 버튼·바깥 클릭·Esc 닫기 없음. 복사 실패 시 오류 문구 + "직접 보관했어요" 보조 버튼(research #9). `role="dialog"` `aria-modal="true"`
- [X] T040 [US3] `src/app/gender-reveal/manage/[code]/page.tsx`에 모달 연결: `useSearchParams`로 `created` 확인 → 상태로 열고, `onCopied` 시 닫고 `router.replace` 로 쿼리 제거. manageLink는 `${window.location.origin}/gender-reveal/manage/${code}`
- [X] T041 [P] [US3] `src/components/gender-reveal/ManageLinkModal.stories.tsx` 작성(기본, 복사 실패 상태)

**Checkpoint**: MVP(US1~US3) 완료 — quickstart 1~8 시나리오 통과

---

## Phase 6: User Story 4 - 받는 사람 풍선 삭제하기 (Priority: P2)

**Goal**: 관리 화면에서 확인 후 풍선 삭제(댓글 포함), id+code 일치 필수

**Independent Test**: 03번 삭제 → 목록에서 제거·번호 재정렬, 03번 공유 링크 404. 틀린 code로 DELETE → 404, 풍선 유지

### Tests for User Story 4

- [X] T042 [P] [US4] `src/app/api/manage/[code]/events/[id]/route.test.ts` 작성: `delete().eq('id').eq('code').select('id')` 호출, 1행 삭제 → 204, 0행 → 404, 오류 → 500
- [X] T043 [P] [US4] `src/lib/api/manage.test.ts`에 `deleteBalloon` 테스트 추가(204 → ok, 404 → not_found)
- [X] T044 [P] [US4] `src/hooks/useDeleteBalloon.test.tsx` 작성: 성공 시 캐시에서 해당 항목 제거 후 invalidate, not_found 시 invalidate
- [X] T045 [P] [US4] `src/components/gender-reveal/DeleteBalloonConfirmModal.test.tsx` 작성: 받는 사람 이름 포함 확인 문구, 확인 → `onConfirm`, 취소 → `onCancel`, 진행 중 버튼 비활성화
- [X] T046 [P] [US4] `src/components/gender-reveal/BalloonManager.test.tsx`에 빈 목록 시 "남은 풍선이 없어요" + "새 풍선 만들기" 버튼(`/gender-reveal` 이동) 테스트 추가

### Implementation for User Story 4

- [X] T047 [US4] `src/app/api/manage/[code]/events/[id]/route.ts`에 `DELETE` 구현(contracts/manage-api.md, research #6)
- [X] T048 [P] [US4] `src/lib/api/manage.ts`에 `deleteBalloon(code, id)` 추가
- [X] T049 [P] [US4] `src/hooks/useDeleteBalloon.ts` 구현(`useMutation`, `['managed-balloons', code]` 캐시 갱신)
- [X] T050 [P] [US4] `src/components/gender-reveal/DeleteBalloonConfirmModal.tsx` 구현: "'{이름}'에게 보낸 풍선을 삭제할까요? / 삭제하면 남겨진 댓글도 함께 사라지고 되돌릴 수 없어요." + 취소/삭제 버튼. 스타일은 `ManageLinkModal` 카드와 동일 톤
- [X] T051 [US4] `src/components/gender-reveal/BalloonManager.tsx`에 삭제 흐름 연결(행 "삭제" → 확인 모달 → `useDeleteBalloon`)과 빈 상태 UI 추가
- [X] T052 [P] [US4] `src/components/gender-reveal/DeleteBalloonConfirmModal.stories.tsx` 작성, `BalloonManager.stories.tsx`에 빈 상태 스토리 추가

**Checkpoint**: 삭제 동작, quickstart 9·13 통과

---

## Phase 7: User Story 5 - 풍선 링크 기간 1회 연장하기 (Priority: P3)

**Goal**: 풍선별 1회 연장. 만료 전 = 기존 만료 + 7일, 만료 후 = 연장 시점 + 7일

**Independent Test**: 01번 연장 → 만료일 +7일·"연장 완료" 비활성화, 두 번째 요청 409. 만료된 풍선 연장 → 오늘 + 7일, 공유 링크 다시 열림

### Tests for User Story 5

- [X] T053 [P] [US5] `src/app/api/manage/[code]/events/[id]/extend/route.test.ts` 작성: 미연장·만료 전 → 200, `link_expires_at` = 기존 + 7일; 미연장·만료 후 → now + 7일; 이미 연장(`link_expires_at > created_at + 7일`) → 409; 행 없음/틀린 code → 404; 조건부 update(`.eq('link_expires_at', 읽은 값)`) 갱신 0행 → 409; 오류 → 500
- [X] T054 [P] [US5] `src/lib/api/manage.test.ts`에 `extendBalloon` 테스트 추가(200 → ok, 409 → already_extended, 404 → not_found)
- [X] T055 [P] [US5] `src/hooks/useExtendBalloon.test.tsx` 작성: 성공 시 캐시의 해당 항목 교체, 409/404 시 invalidate
- [X] T056 [P] [US5] `src/components/gender-reveal/ManagedBalloonRow.test.tsx`에 만료일(KST 'YYYY년 MM월 DD일') 표시, 유효/"만료됨" 상태, 연장 가능 시 "7일 연장" 버튼 → `onExtend(id)`, 연장 후 "연장 완료" disabled 테스트 추가

### Implementation for User Story 5

- [X] T057 [US5] `src/app/api/manage/[code]/events/[id]/extend/route.ts`에 `POST` 구현(contracts/manage-api.md, research #5, `calculateExtendedExpiresAt` 사용)
- [X] T058 [P] [US5] `src/lib/api/manage.ts`에 `extendBalloon(code, id)` 추가
- [X] T059 [P] [US5] `src/hooks/useExtendBalloon.ts` 구현
- [X] T060 [US5] `src/components/gender-reveal/ManagedBalloonRow.tsx`에 만료일·상태·연장 버튼 추가(`formatKstDate` 사용, 회색 박스 아래 작은 보조 텍스트 줄: "~ 2026년 11월 10일까지" / "만료됨" + 오른쪽 "7일 연장" 또는 "연장 완료")
- [X] T061 [US5] `src/components/gender-reveal/BalloonManager.tsx`에 `useExtendBalloon` 연결, 409 시 "이미 연장한 풍선이에요" 안내
- [X] T062 [P] [US5] `ManagedBalloonRow.stories.tsx`에 미연장/연장 완료/만료됨 스토리 추가

**Checkpoint**: 전 스토리 완료

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T063 [P] 전체 `src/`에서 `code`가 받는 사람용 경로(`src/app/api/events/**`, `src/app/gender-reveal/[id]/**`, `src/components/gender-reveal/Comment*`, `ResultReveal`, `BalloonStage`)에 등장하지 않는지 grep으로 확인(FR-009)
- [X] T064 `npx tsc --noEmit`, `npm run lint`, `npm test` 실행 — 신규 실패 0건(기존 8건 외)
- [X] T065 [P] Figma Step1~5와 화면 대조(390px 모바일 뷰포트), 간격·폰트 차이 수정
- [ ] T066 quickstart.md 수동 시나리오 1~15 확인(T001 적용된 DB 필요) — UI 흐름(1, 1a, 2~5a, 6 화면 구성)은 API mock으로 브라우저 확인 완료, 실제 DB 시나리오는 T001 이후
- [X] T067 [P] `README.md`에 v3 흐름(여러 풍선, 관리 링크) 한 단락 추가

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 (Setup) → Phase 2 (Foundational) → 사용자 스토리
- T001(DB 적용)은 수동 확인(T066)과 실제 실행 시에만 필요하며, 코드·테스트 작업(mock 기반)은 막지 않는다

### User Story Dependencies

- **US1** (P1): Phase 2 이후 독립. T023 임시 페이지로 단독 확인 가능
- **US2** (P1): Phase 2 이후 독립(관리 API·화면). 실제 데이터 확인은 US1 생성 결과 사용
- **US3** (P1): US2의 관리 페이지(T034) 필요
- **US4** (P2): US2의 `BalloonManager`·`ManagedBalloonRow` 필요
- **US5** (P3): US2의 `ManagedBalloonRow` 필요, US4와 독립(같은 `route.ts` 파일을 쓰지 않음 — 연장은 `extend/route.ts`)

### Within Each User Story

- Tests → API Route → `lib/api` → 훅 → 컴포넌트 → 페이지 연결 → 스토리

### Parallel Opportunities

- Phase 2: T005~T010 병렬
- US1: T011~T014 병렬, 이후 T016~T019 병렬 → T020
- US2: T024~T028 병렬, T030~T032 병렬
- US4·US5는 US2 완료 후 병렬 진행 가능(단, 둘 다 `BalloonManager.tsx`·`ManagedBalloonRow.tsx`를 수정하므로 해당 작업 T051/T060/T061은 순차)

---

## Parallel Example: User Story 1

```text
# Tests 동시 작성
T011 src/app/api/events/route.test.ts
T012 src/components/gender-reveal/RecipientListForm.test.tsx
T013 src/components/gender-reveal/BalloonCreatingView.test.tsx
T014 src/components/gender-reveal/StepOneForm.test.tsx

# 이어서 독립 파일 동시 구현
T016 src/lib/api/events.ts
T018 src/components/gender-reveal/RecipientListForm.tsx
T019 src/components/gender-reveal/BalloonCreatingView.tsx
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US3)

1. Phase 1~2 완료
2. US1(생성) → US2(목록·링크 복사) → US3(관리 링크 모달)
3. **STOP & VALIDATE**: quickstart 1~8 → 배포 가능 상태(삭제·연장 없이도 "여러 풍선 보내기" 가치 제공)

### Incremental Delivery

1. MVP 배포
2. US4(삭제) 추가 → 검증 → 배포
3. US5(연장) 추가 → 검증 → 배포

---

## Notes

- 모든 UI 문구는 한국어(헌법 V), 날짜 표시는 `formatKstDate`
- Tailwind 사용은 기존 드리프트 유지(plan Constitution Check)
- 커밋은 사용자 요청 시에만 한다
