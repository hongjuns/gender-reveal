# Implementation Plan: 젠더리빌(Gender Reveal) 이벤트 웹 애플리케이션

**Branch**: `001-gender-reveal-event` | **Date**: 2026-07-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-gender-reveal-event/spec.md`

## Summary

예비 부모가 태명·출산 예정일·받는 사람·성별을 입력(Step 1)한 뒤, 화면 중앙의 검정 풍선을 정확히 10번
터치하는 인터랙션(Step 2)을 거쳐, 입력한 성별에 따라 분기되는 축하 문구·이미지가 담긴 결과 화면
(Step 3)을 보여주는 프론트엔드 단독 이벤트 페이지다. 서버 저장이나 링크 공유는 없으며, 모든 상태는
Zustand 스토어로 클라이언트에서만 관리된다. Step 3에는 '다시 시작하기' 버튼을 두어 입력값은 유지한 채
Step 2(터치 카운트 0)부터 재시작할 수 있다(Clarifications 세션 2026-07-18 반영).

## Technical Context

**Language/Version**: TypeScript, Next.js 14 (App Router)

**Primary Dependencies**: React (Next.js 내장), Zustand(클라이언트 상태), date-fns(KST 날짜 포맷),
axios + TanStack Query(프로젝트 표준 스택이나 본 기능은 서버 데이터가 없어 사용 안 함), SCSS/Sass
(CSS Modules), ESLint(`eslint-config-next`), Jest, Storybook

**Storage**: N/A — 서버/DB 저장 없음. 입력값과 터치 카운트는 Zustand 클라이언트 상태로만 유지되며
새로고침 시 초기화된다(spec.md Assumptions).

**Testing**: Jest (컴포넌트/유틸 단위 테스트), Storybook (컴포넌트 문서 겸 시각적 확인)

**Target Platform**: 모바일·PC 웹 브라우저 (반응형, 한국어 UI, KST 기준 날짜 표시)

**Project Type**: 웹 애플리케이션 — 단일 Next.js 프로젝트, 백엔드 API 없음(프론트엔드 단독 이벤트 페이지)

**Performance Goals**: 풍선 터치 시 다음 프레임 내 시각 피드백(체감 지연 없음); 표준 웹 애니메이션
수준(60fps 목표)

**Constraints**: 서버 저장/공유 기능 없음(FR-003, Assumptions); 한국어 UI만 지원(FR-012); 날짜는 KST
기준 'YYYY년 MM월 DD일' 포맷(FR-011); 전역 스피너 대신 스켈레톤 UI 사용(FR-014)

**Scale/Scope**: 화면 3개(Step 1~3, 결과는 성별에 따라 2개 변형) + 재시작 흐름 1개. 동시 대량 트래픽을
고려할 필요 없는 소규모 이벤트 페이지.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Next.js App Router & TypeScript | PASS | 신규 라우트는 App Router(`app/`) + TypeScript로만 구현. Pages Router 미사용. |
| II. Component Standards | PASS | 모든 컴포넌트는 함수형, PascalCase(`StepOneForm`, `BalloonStage`, `ResultReveal` 등)로 파일당 1개 컴포넌트. |
| III. Styling with SCSS | PASS | 컴포넌트별 `*.module.scss` CSS Modules만 사용, 인라인 스타일/CSS-in-JS 없음. |
| IV. Data & State Management | PASS (조건부) | 이 기능은 원격 데이터 조회가 없어 TanStack Query/axios를 사용하지 않음 — 원칙은 "서버 데이터가 있을 때" 강제되므로 위반 아님. 전역 클라이언트 상태(입력값, 터치 카운트)는 Zustand로 관리해 원칙을 충족. |
| V. Localization & Time Handling | PASS | 모든 UI 텍스트 한국어, 출산 예정일은 `date-fns`로 KST 기준 포맷. |
| VI. Quality Gates | PASS | 각 컴포넌트에 Jest 테스트, 공유 컴포넌트에 Storybook 스토리, ESLint(`eslint-config-next`) 통과 요구. |

Constitution Check 위반 없음 → Complexity Tracking 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/001-gender-reveal-event/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   └── gender-reveal-store.md
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── gender-reveal/
│       └── page.tsx                       # Step 1~3 전환을 담당하는 단일 라우트 엔트리
├── components/
│   └── gender-reveal/
│       ├── StepOneForm.tsx                # Step 1: 정보 입력 폼
│       ├── StepOneForm.module.scss
│       ├── StepOneForm.test.tsx
│       ├── StepOneForm.stories.tsx
│       ├── BalloonStage.tsx               # Step 2: 풍선 터치 인터랙션
│       ├── BalloonStage.module.scss
│       ├── BalloonStage.test.tsx
│       ├── BalloonStage.stories.tsx
│       ├── ResultReveal.tsx               # Step 3: 성별 공개 결과 + 다시 시작하기
│       ├── ResultReveal.module.scss
│       ├── ResultReveal.test.tsx
│       └── ResultReveal.stories.tsx
├── stores/
│   └── genderRevealStore.ts               # Zustand 스토어: GenderRevealInput + BalloonInteractionState
├── lib/
│   └── date.ts                            # date-fns 기반 KST 'YYYY년 MM월 DD일' 포맷 헬퍼
└── types/
    └── genderReveal.ts                    # GenderRevealInput, BalloonInteractionState, AppStep 타입

public/
└── img/
    ├── 001.png                            # 풍선(검정)
    ├── 002.png                            # 남아 일러스트
    └── 003.png                            # 여아 일러스트
```

**Structure Decision**: 백엔드가 필요 없는 단일 Next.js 14 App Router 프로젝트(옵션 1의 단일 프로젝트
구조를 Next.js 관례에 맞게 조정). 3단계 화면은 하나의 라우트(`app/gender-reveal/page.tsx`) 안에서
Zustand 스토어의 `step` 값에 따라 세 컴포넌트(`StepOneForm` → `BalloonStage` → `ResultReveal`)를
전환하는 방식으로 구현한다. 컴포넌트별 스타일(`.module.scss`)·테스트(`.test.tsx`)·Storybook
스토리(`.stories.tsx`)를 co-locate하여 Quality Gates(Principle VI)를 파일 단위로 강제한다.
