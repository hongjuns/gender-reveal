---

description: "Task list template for feature implementation"
---

# Tasks: 젠더리빌(Gender Reveal) 이벤트 웹 애플리케이션

**Input**: Design documents from `/specs/001-gender-reveal-event/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/gender-reveal-store.md, quickstart.md (모두 존재)

**Tests**: 헌법(`Principle VI`)이 컴포넌트별 Jest 테스트 및 Storybook 스토리를 필수(NON-NEGOTIABLE 준하는 Quality Gate)로 요구하므로, 각 컴포넌트/스토어/유틸 작업에 테스트·스토리 작업을 포함한다.

**Organization**: 작업은 spec.md의 사용자 스토리별로 그룹화된다. 세 스토리 모두 우선순위 P1이며, 하나의 화면 흐름(Step 1 → 2 → 3)을 구성하는 순차적 단계이므로 US1 → US2 → US3 순서로 구현한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 완료되지 않은 작업에 대한 의존 없음)
- **[Story]**: 해당 작업이 속한 사용자 스토리 (US1, US2, US3)
- 각 작업에 정확한 파일 경로 포함

## Path Conventions

plan.md의 Project Structure를 따른다: `src/app/gender-reveal/`, `src/components/gender-reveal/`, `src/stores/`, `src/lib/`, `src/types/`, `public/img/` (repo root 기준).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Next.js 14 프로젝트 초기화 및 기본 도구 구성 (현재 저장소에는 아직 앱 코드가 없음)

- [X] T001 Next.js 14(App Router) + TypeScript 프로젝트를 repo root에 초기화하고 `src/app/`, `src/components/`, `src/stores/`, `src/lib/`, `src/types/` 디렉터리를 plan.md 구조대로 생성
- [X] T002 [P] 런타임 의존성 설치: `zustand`, `date-fns` (package.json 반영)
- [X] T003 [P] `eslint-config-next` 기반 ESLint 설정 확인/구성 (`.eslintrc` 또는 `eslint.config.*`, Constitution Principle VI)
- [X] T004 [P] Next.js 14 + TypeScript 프로젝트에 Jest + React Testing Library 테스트 환경 구성 (`jest.config.ts`, `jest.setup.ts`)
- [X] T005 [P] Next.js(App Router) 프로젝트에 Storybook 구성 (`.storybook/main.ts`, `.storybook/preview.ts`)
- [X] T006 [P] 저장소 루트 `img/001.png`, `img/002.png`, `img/003.png`를 `public/img/`로 이동하고 코드 전반에서 소문자 `img/...` 경로만 참조하도록 확인 (research.md #5)

**Checkpoint**: `npm run dev`, `npm test`, `npm run storybook`, `npm run lint`이 빈 프로젝트 기준으로 모두 실행 가능한 상태

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 세 사용자 스토리가 공통으로 의존하는 타입·상태 저장소·라우트 셸

**⚠️ CRITICAL**: 이 Phase가 끝나기 전에는 어떤 사용자 스토리 작업도 시작할 수 없음

- [X] T007 `src/types/genderReveal.ts`에 `GenderRevealInput`, `BalloonInteractionState`, `AppStep` 타입 정의 (data-model.md 기준)
- [X] T008 `src/stores/genderRevealStore.ts`에 Zustand 스토어 구현: 상태(`step`, `input`, `touchCount`, `isBursting`)와 액션(`setInput`, `touchBalloon`, `completeBurstTransition`, `restart`)을 contracts/gender-reveal-store.md 계약대로 구현
- [X] T009 [P] `genderRevealStore`에 대한 Jest 테스트를 `src/stores/genderRevealStore.test.ts`에 작성: 필수값 누락 시 `setInput`이 `{ ok: false }` 반환(FR-002), `touchBalloon`이 `isBursting` 또는 10회 도달 시 카운트를 더 이상 증가시키지 않음(FR-006/FR-008), `restart` 호출 시 `input` 유지·`touchCount` 0·`step` `'interaction'`으로 재설정(FR-015)
- [X] T010 [P] `src/lib/date.ts`에 date-fns 기반 KST 'yyyy년 MM월 dd일' 포맷 헬퍼 구현 (research.md #4, FR-011)
- [X] T011 [P] `src/lib/date.ts`에 대한 Jest 테스트를 `src/lib/date.test.ts`에 작성 (다양한 날짜 입력에 대한 포맷 결과 검증)
- [X] T012 `src/app/gender-reveal/page.tsx`에 클라이언트 컴포넌트(`"use client"`) 셸 생성: `genderRevealStore`의 `step` 값에 따라 `StepOneForm`/`BalloonStage`/`ResultReveal`(각 스토리에서 구현 예정) 중 하나만 렌더링하고, 전환 시 전체 화면 스피너 대신 스켈레톤 영역을 노출하도록 준비(FR-014)

**Checkpoint**: 스토어와 타입, 라우트 셸이 완비되어 이후 각 사용자 스토리를 독립적으로 구현/테스트 가능

---

## Phase 3: User Story 1 - 정보 입력 후 이벤트 시작 (Priority: P1) 🎯 MVP 시작점

**Goal**: 태명·출산 예정일·받는 사람·성별을 입력받고, 유효성 검증 후 '시작하기'로 Step 2에 진입하는 화면

**Independent Test**: 4개 필드를 모두 채우고 '시작하기'를 눌렀을 때 `setInput`이 성공 호출되어 `step`이 `'interaction'`으로 바뀌는지 확인. 하나라도 비운 채 클릭하면 '정보를 모두 입력해주세요' 메시지가 노출되고 상태가 바뀌지 않는지 확인.

### Tests for User Story 1

- [X] T013 [P] [US1] `src/components/gender-reveal/StepOneForm.test.tsx`에 Jest 테스트 작성: 필수값 누락 시 검증 메시지 노출 및 미전환(FR-002), 4개 필드 입력 후 제출 시 `setInput` 호출 및 성공 처리(FR-001/FR-003), 성별 라디오/토글 단일 선택 동작

### Implementation for User Story 1

- [X] T014 [US1] `src/components/gender-reveal/StepOneForm.tsx` 구현: 태명(텍스트)·출산 예정일(date picker)·받는 사람(텍스트)·성별(라디오/토글 '아들'/'딸') 입력 폼과 '시작하기' 버튼, 클라이언트 측 필수값 검증 및 '정보를 모두 입력해주세요' 메시지 노출(FR-001, FR-002)
- [X] T015 [P] [US1] `src/components/gender-reveal/StepOneForm.module.scss` 작성: 파스텔톤/축하 느낌의 반응형 스타일(Constitution Principle III)
- [X] T016 [P] [US1] `src/components/gender-reveal/StepOneForm.stories.tsx` 작성: 빈 폼, 일부 입력, 검증 에러 상태를 각각 스토리로 문서화(Constitution Principle VI)
- [X] T017 [US1] `src/app/gender-reveal/page.tsx`에서 `step === 'input'`일 때 `StepOneForm`을 렌더링하도록 연결

**Checkpoint**: User Story 1이 독립적으로 완전히 동작 — 폼 검증부터 Step 2 진입까지 테스트 가능

---

## Phase 4: User Story 2 - 풍선 터치 인터랙션 (Priority: P1)

**Goal**: 검정 풍선을 터치할 때마다 시각 피드백을 주고, 정확히 10번째 터치에서 터짐 이펙트 후 결과 화면으로 전환

**Independent Test**: 스토어에 `input`이 채워진 상태를 직접 세팅한 뒤 풍선을 10번 클릭 — 매 클릭 시 애니메이션 클래스가 바뀌고, 10번째 클릭에서 `isBursting`이 `true`가 된 뒤 `step`이 `'result'`로 전환되는지 확인. 20회 이상 빠르게 연타해도 10번째에서만 전환되는지 확인.

### Tests for User Story 2

- [X] T018 [P] [US2] `src/components/gender-reveal/BalloonStage.test.tsx`에 Jest 테스트 작성: 클릭 시 `touchBalloon` 호출 및 피드백 클래스 반영(FR-005), 10회 도달 시 터짐 이펙트 트리거 및 전환(FR-007), 빠른 연타(10회 초과 클릭 시뮬레이션) 시에도 정확히 10에서만 전환되고 중복 전환이 없음(FR-006/FR-008)

### Implementation for User Story 2

- [X] T019 [US2] `src/components/gender-reveal/BalloonStage.tsx` 구현: `public/img/001.png` 풍선 이미지와 "'[태명]'은 아들일까요? 딸일까요?" 동적 문구(FR-004) 노출, 터치/클릭 핸들러에서 `touchBalloon()` 호출, `isBursting`이 되면 터짐 애니메이션 재생 후 `completeBurstTransition()` 호출
- [X] T020 [P] [US2] `src/components/gender-reveal/BalloonStage.module.scss` 작성: 터치당 흔들림/확대 트랜지션과 10번째 터치의 burst 애니메이션(research.md #2)
- [X] T021 [P] [US2] `src/components/gender-reveal/BalloonStage.stories.tsx` 작성: 터치 0회/5회/9회/터짐(bursting) 상태를 각각 스토리로 문서화
- [X] T022 [US2] `src/app/gender-reveal/page.tsx`에서 `step === 'interaction'`일 때 `BalloonStage`를 렌더링하도록 연결

**Checkpoint**: User Story 1과 2가 함께 동작 — 정보 입력부터 풍선 터짐까지 완주 가능

---

## Phase 5: User Story 3 - 성별 공개 결과 화면 (Priority: P1)

**Goal**: 입력된 성별에 따라 남아/여아 이미지·문구로 분기되는 결과 화면과 '다시 시작하기' 기능 제공

**Independent Test**: 스토어에 `input.babyGender`를 각각 `'son'`/`'daughter'`로 세팅하고 `step`을 `'result'`로 두었을 때, `img/002.png`+남아 문구 또는 `img/003.png`+여아 문구가 입력값과 정확히 일치해 노출되는지 확인. '다시 시작하기' 클릭 시 `input`은 유지된 채 `step`이 `'interaction'`, `touchCount`가 0이 되는지 확인.

### Tests for User Story 3

- [X] T023 [P] [US3] `src/components/gender-reveal/ResultReveal.test.tsx`에 Jest 테스트 작성: 성별 '아들'/'딸' 분기별 이미지·문구 정확성(FR-009/FR-010), 출산 예정일 'YYYY년 MM월 DD일' 포맷 반영(FR-011), '다시 시작하기' 클릭 시 `restart()` 호출 및 입력값 유지(FR-015)

### Implementation for User Story 3

- [X] T024 [US3] `src/components/gender-reveal/ResultReveal.tsx` 구현: `babyGender === 'son'`이면 `public/img/002.png` + "[받는사람]님! '[태명]'이는 '아들'이에요! [예정일]에 건강하게 만나요!" 문구(FR-009), `'daughter'`면 `public/img/003.png` + 동일 포맷의 '딸' 문구(FR-010), `src/lib/date.ts` 헬퍼로 날짜 포맷(FR-011), '다시 시작하기' 버튼에서 `restart()` 호출(FR-015)
- [X] T025 [P] [US3] `src/components/gender-reveal/ResultReveal.module.scss` 작성: 축하 느낌의 파스텔톤 반응형 결과 화면 스타일
- [X] T026 [P] [US3] `src/components/gender-reveal/ResultReveal.stories.tsx` 작성: 아들 결과, 딸 결과 두 상태를 각각 스토리로 문서화
- [X] T027 [US3] `src/app/gender-reveal/page.tsx`에서 `step === 'result'`일 때 `ResultReveal`을 렌더링하도록 연결

**Checkpoint**: 세 사용자 스토리 모두 독립적으로 완전히 동작 — 전체 이벤트 흐름(입력 → 터치 → 결과 → 재시작) 완주 가능

---

## Phase 6: Design & Typography Enhancements (FR-016~FR-020)

**Purpose**: 레퍼런스(`public/reference/step1~4.png`)에 맞춰 픽셀/레트로 타이포그래피, 화이트+픽셀
아트 톤앤매너, 성별별 파스텔 배경·포인트 컬러, 하트 파티클·캐릭터 일러스트를 기존 US1~US3 화면에
반영한다. plan.md의 "Design & Typography Implementation" 섹션이 구현 기준이다.

**Independent Test**: 세 화면을 각각 레퍼런스 스크린샷과 나란히 비교했을 때 브랜드 타이틀/헤드라인
폰트, 화이트 배경, 토글 배경색, 결과 화면 포인트 컬러·캐릭터 일러스트, 풍선 주변 하트 파티클·진행
카운터 폰트가 일치하는지 확인(quickstart.md #10).

### Shared Design Tokens & Assets

- [X] T032 [P] `src/app/globals.css` 최상단의 `@import 'pretendard/dist/web/static/pretendard.css';`를
  제거하고, plan.md에 명시된 `RoundedFixedsys`(DungGeunMo) + `Pretendard`(100~900, 9단계) jsDelivr
  CDN `@font-face` 선언 10개를 그대로 추가(FR-016). 다크모드 배경 오버라이드도 제거해 FR-017(화이트
  배경 통일)을 충족시킴
- [X] T033 [P] `tailwind.config.js`의 `theme.extend`에 `fontFamily.pixel: ['RoundedFixedsys', 'monospace']`와
  `colors`(`boy-bg: '#cae7ff'`, `boy-point: '#509fdf'`, `girl-bg: '#ffd2d2'`, `girl-point: '#ff9999'`,
  `heart-pink: '#fba3af'`, `heart-blue: '#9cc5e5'`) 추가(plan.md Color tokens, FR-016/FR-018/FR-019/FR-020)
- [~] T034 [P] ~~`public/img/heart-pink.png`, `public/img/heart-blue.png` 픽셀 아트 하트 스프라이트
  자산 추가~~ → 래스터 이미지 자산을 생성할 수 없어 인라인 SVG 하트(`HeartParticles.tsx`, `fill-heart-pink`/
  `fill-heart-blue` 토큰 사용)로 대체 구현. 시각적으로 FR-020을 충족하나, 실제 픽셀 아트 PNG 스프라이트로
  교체를 원하면 디자인 자산 전달 후 별도 작업 필요
- [~] T035 [P] ~~`public/img/002.png`(남아), `public/img/003.png`(여아)를 픽셀 아트 캐릭터 일러스트로
  교체~~ → 실제 확인 결과 기존 자산이 이미 레퍼런스(`step3.png`, `step4.png`)와 동일한 픽셀 아트
  캐릭터였음(교체 불필요, Playwright로 시각 검증 완료)

### Implementation for User Story 1 (Design)

- [X] T036 [US1] `src/components/gender-reveal/StepOneForm.tsx` 수정: 브랜드 타이틀("Gender-Reveal",
  "Come on baby")과 헤드라인에 `font-pixel` 클래스 적용(FR-016), 성별 토글 배경을 '아들'=`bg-boy-bg`,
  '딸'=`bg-girl-bg`로 교체(FR-018)

### Implementation for User Story 2 (Design)

- [X] T037 [P] [US2] `src/components/gender-reveal/HeartParticles.tsx` 신규 컴포넌트 작성: SVG 하트를
  풍선 주변 6곳에 핑크/블루 교차 배치(`absolute` 포지셔닝)(FR-020, T034 참고 — PNG 대신 SVG로 구현)
- [X] T038 [P] [US2] `src/components/gender-reveal/HeartParticles.test.tsx`에 Jest 테스트 작성:
  하트 6개가 렌더링되고 핑크/블루가 교차 배치되는지 검증(Constitution Principle VI)
- [X] T039 [P] [US2] `src/components/gender-reveal/HeartParticles.stories.tsx` 작성: 하트 파티클
  배치 상태를 Storybook 스토리로 문서화(Constitution Principle VI)
- [X] T040 [US2] `src/components/gender-reveal/BalloonStage.tsx` 수정: 헤드라인과 진행 카운터
  (`{touchCount} / 10`)에 `font-pixel` 클래스 적용(FR-016), `HeartParticles`를 풍선 주변에 렌더링(FR-020)

### Implementation for User Story 3 (Design)

- [X] T041 [US3] `src/components/gender-reveal/ResultReveal.tsx` 수정: 헤드라인에 `font-pixel` 클래스
  적용(FR-016), 강조 문구("...아들이에요!"/"...딸이에요!")와 예정일 텍스트 색상을 성별에 따라
  `text-boy-point`/`text-girl-point`로 분기(FR-019). 색상 타겟팅을 위해 메시지를 `<span>`으로 분리하며
  `ResultReveal.test.tsx`의 관련 단언을 `getByText` 전체 문자열 매칭에서 `data-testid="result-message"` +
  `toHaveTextContent`로 조정(기능 로직·검증 내용은 동일, 마크업만 분리)

**Checkpoint**: 세 화면 모두 레퍼런스와 시각적으로 일치 — 폰트/배경/토글색상/포인트컬러/하트파티클/카운터가
FR-016~FR-020을 충족

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 개별 스토리에 속하지 않는 전체 품질 점검

- [ ] T028 [P] `quickstart.md`의 수동 검증 시나리오(연타 안정성 SC-003, 반응형 SC-004, 결과 일치 SC-005 포함) 전체 실행
- [ ] T029 [P] 3가지 이상의 대표 화면 크기(모바일 320px, 태블릿, 데스크톱)에서 텍스트/이미지 잘림·겹침 여부 점검(FR-013, SC-004)
- [ ] T030 [P] `npm run lint`로 ESLint(`eslint-config-next`) 전체 통과 확인, 비활성화된 규칙에 대한 정당화 주석 여부 점검(Constitution Principle VI)
- [ ] T031 `npm test`로 전체 Jest 테스트 스위트 통과 확인 및 `npm run storybook`으로 모든 컴포넌트 스토리 정상 렌더링 확인
- [X] T042 [P] `quickstart.md` #10 디자인/타이포그래피 검증 시나리오(레퍼런스 이미지 육안 비교) 실행(FR-016~FR-020) —
  Playwright로 Step1(아들/딸 폼)·Step2(풍선+하트+카운터)·Step3/4(남아/여아 결과) 스크린샷을 확보해 레퍼런스와
  비교 완료

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료에 의존 — 모든 사용자 스토리를 BLOCK
- **User Story 1 (Phase 3)**: Foundational 완료 후 시작 가능
- **User Story 2 (Phase 4)**: Foundational 완료 후 시작 가능. 실제 화면 흐름상 US1 다음 단계이지만, 스토어 상태를 직접 세팅하면 US1 완료 전에도 독립적으로 구현/테스트 가능
- **User Story 3 (Phase 5)**: Foundational 완료 후 시작 가능. 마찬가지로 스토어 상태 직접 세팅으로 US1/US2 완료 전에도 독립 구현/테스트 가능
- **Design & Typography Enhancements (Phase 6)**: US1~US3(Phase 3~5)의 컴포넌트가 이미 존재해야
  스타일/클래스를 얹을 수 있으므로 Phase 3~5 완료 후 진행. 공유 토큰(T032~T035)은 서로 다른 파일이라
  병렬 가능하며, 스토리별 적용 작업(T036, T037~T040, T041)도 서로 다른 컴포넌트 파일이라 병렬 가능
- **Polish (Phase 7)**: Design & Typography Enhancements(Phase 6)를 포함해 모든 스토리가 완료된 후 진행

### User Story Dependencies

- **User Story 1 (P1)**: Foundational 완료 후 시작 — 다른 스토리에 대한 의존 없음
- **User Story 2 (P1)**: Foundational 완료 후 시작 — 컴포넌트 단위로는 US1과 독립적이나, 실제 사용자가 체감하는 전체 흐름에서는 US1 산출물(`app/gender-reveal/page.tsx`의 `'input'` 분기) 뒤에 이어짐
- **User Story 3 (P1)**: Foundational 완료 후 시작 — 컴포넌트 단위로는 독립적이나, 전체 흐름에서는 US2(풍선 터짐) 뒤에 이어짐

### Within Each User Story

- 테스트를 먼저 작성하고 구현 전에 실패 확인(Constitution Principle VI의 품질 게이트 충족 목적)
- 컴포넌트 구현 → 스타일(.module.scss) → Storybook 스토리 → 라우트 연결 순서 권장
- 스토리 완료 후 Checkpoint에서 독립 검증

### Parallel Opportunities

- Setup의 T002~T006은 모두 [P] — 병렬 실행 가능
- Foundational의 T009, T010, T011은 [P] — 병렬 실행 가능(단, T008 스토어 구현 완료 후 T009 실행)
- Foundational 완료 후에는 US1(T013~T017), US2(T018~T022), US3(T023~T027)를 서로 다른 담당자가 병렬로 진행 가능(단, 각 스토리 내부에서 스토어 상태를 직접 세팅해 테스트)
- 각 스토리 내 테스트(T013/T018/T023)와 스타일(T015/T020/T025), 스토리 파일(T016/T021/T026)은 서로 다른 파일이므로 [P]
- Phase 6의 공유 토큰 작업(T032~T035)은 모두 [P] — 병렬 실행 가능
- Phase 6의 T037(HeartParticles 구현)과 T038(테스트)·T039(스토리)는 서로 다른 파일이므로 [P](단, T040은 T037 완료 후 진행)

---

## Parallel Example: User Story 1

```bash
# US1의 테스트와 스타일, 스토리 파일은 서로 다른 파일이므로 병렬 진행 가능:
Task: "StepOneForm.test.tsx에 Jest 테스트 작성"
Task: "StepOneForm.module.scss 스타일 작성"
Task: "StepOneForm.stories.tsx Storybook 스토리 작성"
```

---

## Implementation Strategy

### MVP 범위

이 기능은 spec.md에서 세 사용자 스토리가 모두 P1로 지정되어 있으며, 정보 공개(이벤트의 핵심 목적)는
Step 1~3이 모두 연결되어야 사용자에게 가치를 전달한다. 따라서 **MVP = Setup + Foundational + User
Story 1~3 전체**이며, "User Story 1만 배포"는 이벤트로서 의미 있는 증분이 아니다(입력만 받고 아무
결과도 못 봄). 다만 각 스토리는 스토어 상태를 직접 세팅해 컴포넌트 단위로는 독립적으로 개발·검증할 수
있으므로, 여러 담당자가 Foundational 완료 직후 US1/US2/US3를 병렬로 구현한 뒤 Phase 3→4→5 순서로
라우트에 통합하는 방식을 권장한다.

### Incremental Delivery

1. Setup + Foundational 완료 → 타입/스토어/라우트 셸 준비 완료
2. US1 구현 → 정보 입력 화면만 데모 가능(결과는 아직 없음, 내부 검증용)
3. US2 구현 → 입력 + 풍선 터치까지 데모 가능(결과 화면은 아직 없음, 내부 검증용)
4. US3 구현 → 전체 흐름(입력 → 터치 → 결과 → 재시작) 완주 가능 → 실제 배포 가능한 첫 시점
5. Design & Typography Enhancements(Phase 6) → 레퍼런스 기준 폰트/컬러/파티클/일러스트 반영(FR-016~FR-020)
6. Polish(Phase 7)로 반응형/린트/테스트 전수 확인 후 배포

---

## Notes

- [P] 작업 = 서로 다른 파일, 의존성 없음
- [Story] 라벨은 작업을 사용자 스토리에 매핑하기 위한 추적용
- 각 사용자 스토리는 스토어 상태를 직접 세팅하는 방식으로 독립적으로 완성·테스트 가능해야 함
- 구현 전 테스트가 실패하는지 확인(Constitution Quality Gate)
- 각 작업 또는 논리적 작업 묶음 완료 후 커밋
- 각 Checkpoint에서 멈춰 해당 스토리를 독립적으로 검증 가능
- 회피할 것: 모호한 작업, 동일 파일 충돌, 스토리 간 독립성을 해치는 교차 의존
