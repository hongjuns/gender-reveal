# Implementation Plan: 젠더리빌(Gender Reveal) 이벤트 웹 애플리케이션

**Branch**: `001-gender-reveal-event` | **Date**: 2026-07-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-gender-reveal-event/spec.md`

## Summary

예비 부모가 태명·출산 예정일·받는 사람·성별을 입력(Step 1)한 뒤, 화면 중앙의 검정 풍선을 정확히 10번
터치하는 인터랙션(Step 2)을 거쳐, 입력한 성별에 따라 분기되는 축하 문구·이미지가 담긴 결과 화면
(Step 3)을 보여주는 프론트엔드 단독 이벤트 페이지다. 서버 저장이나 링크 공유는 없으며, 모든 상태는
Zustand 스토어로 클라이언트에서만 관리된다. Step 3에는 '다시 시작하기' 버튼을 두어 입력값은 유지한 채
Step 2(터치 카운트 0)부터 재시작할 수 있다(Clarifications 세션 2026-07-18 반영). 전체 화면은
레퍼런스(`public/reference/step1~4.png`) 기준의 화이트 배경·픽셀 아트 톤앤매너로 통일하며, 브랜드
타이틀/헤드라인에는 픽셀 폰트(RoundedFixedsys), 본문/라벨에는 Pretendard(100~800)를 적용하고,
성별에 따라 파스텔 블루/핑크 포인트 컬러와 하트 파티클·캐릭터 일러스트를 노출한다(FR-016~FR-020,
자세한 구현은 아래 Design & Typography Implementation 참고).

## Technical Context

**Language/Version**: TypeScript, Next.js 14 (App Router)

**Primary Dependencies**: React (Next.js 내장), Zustand(클라이언트 상태), date-fns(KST 날짜 포맷),
axios + TanStack Query(프로젝트 표준 스택이나 본 기능은 서버 데이터가 없어 사용 안 함), SCSS/Sass
(CSS Modules), ESLint(`eslint-config-next`), Jest, Storybook, 웹폰트
RoundedFixedsys(DungGeunMo)·Pretendard(100~900 weight) — jsDelivr CDN `@font-face`로 로드
(FR-016, 자세한 내용은 Design & Typography Implementation 참고)

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

## Design & Typography Implementation

레퍼런스: `public/reference/step1.png` ~ `step4.png` (spec.md FR-016~FR-020 대응)

> 참고: 현재 저장소는 Constitution Principle III(SCSS Modules)와 달리 실제로는 Tailwind CSS +
> `src/app/globals.css` 기반으로 이미 구현되어 있다(`StepOneForm.tsx`, `BalloonStage.tsx`,
> `ResultReveal.tsx` 확인 결과). 이 드리프트를 이번 기능 범위에서 되돌리지는 않으며, 아래 폰트/컬러
> 토큰도 기존 구현과 일관되게 Tailwind + 전역 CSS 방식으로 추가한다.

### Fonts

아래 `@font-face` 선언을 `src/app/globals.css` 최상단에 추가한다(기존
`@import 'pretendard/dist/web/static/pretendard.css';` 줄을 대체):

```css
@font-face {
    font-family: 'RoundedFixedsys';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_six@1.2/DungGeunMo.woff') format('woff');
    font-weight: normal;
    font-display: swap;
}

@font-face {
    font-family: 'Pretendard';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-Thin.woff2') format('woff2');
    font-weight: 100;
    font-display: swap;
}

@font-face {
    font-family: 'Pretendard';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-ExtraLight.woff2') format('woff2');
    font-weight: 200;
    font-display: swap;
}

@font-face {
    font-family: 'Pretendard';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-Light.woff2') format('woff2');
    font-weight: 300;
    font-display: swap;
}

@font-face {
    font-family: 'Pretendard';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-Regular.woff2') format('woff2');
    font-weight: 400;
    font-display: swap;
}

@font-face {
    font-family: 'Pretendard';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-Medium.woff2') format('woff2');
    font-weight: 500;
    font-display: swap;
}

@font-face {
    font-family: 'Pretendard';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-SemiBold.woff2') format('woff2');
    font-weight: 600;
    font-display: swap;
}

@font-face {
    font-family: 'Pretendard';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-Bold.woff2') format('woff2');
    font-weight: 700;
    font-display: swap;
}

@font-face {
    font-family: 'Pretendard';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-ExtraBold.woff2') format('woff2');
    font-weight: 800;
    font-display: swap;
}

@font-face {
    font-family: 'Pretendard';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-Black.woff2') format('woff2');
    font-weight: 900;
    font-display: swap;
}
```

- `tailwind.config.ts`의 `theme.extend.fontFamily`에 `pixel: ['RoundedFixedsys', 'monospace']`를
  추가한다(기존 `sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']`는 유지).
  브랜드 타이틀("Gender-Reveal", "Come on baby")과 각 화면 헤드라인에는 `font-pixel`을, 라벨·
  입력값·본문에는 기존 `font-sans`(Pretendard)를 적용한다(FR-016).
- `package.json`의 `pretendard` npm 의존성은 위 CDN `@font-face`로 대체되어 더 이상 필요하지
  않으나, 의존성 제거는 이번 기능 범위 밖(별도 정리 태스크로 분리).

### Color tokens

레퍼런스 이미지(`step1.png`, `step2.png`, `step3.png`, `step4.png`)를 픽셀 샘플링해 얻은 근사
색상이다. `tailwind.config.ts`의 `theme.extend.colors`에 추가한다:

| 토큰 | 값 | 용도 | 대응 FR |
|------|-----|------|---------|
| `boy-bg` | `#cae7ff` | Step 1 '아들' 토글 배경(FR-018) | FR-018 |
| `boy-point` | `#509fdf` | Step 3 강조 문구·예정일 포인트 컬러(아들) | FR-019 |
| `girl-bg` | `#ffd2d2` | Step 1 '딸' 토글 배경 | FR-018 |
| `girl-point` | `#ff9999` | Step 3 강조 문구·예정일 포인트 컬러(딸) | FR-019 |
| `heart-pink` | `#fba3af` | Step 2 하트 파티클 | FR-020 |
| `heart-blue` | `#9cc5e5` | Step 2 하트 파티클 | FR-020 |

기존 `StepOneForm.tsx`의 teal/pink 토글 색상(`peer-checked:bg-teal-500` 등)과
`ResultReveal.tsx`·`StepOneForm.tsx`의 teal 그라데이션 버튼은 배경/보더 색상만 위 토큰으로
교체 대상이며(그라데이션 버튼 자체는 유지), 실제 클래스 치환은 `/speckit-tasks` 단계에서
태스크로 분리한다.

### Assets

- Step 2 하트 파티클(FR-020): 픽셀 아트 하트 스프라이트 2종
  `public/img/heart-pink.png`, `public/img/heart-blue.png` 신규 추가 필요. 신규 컴포넌트
  `HeartParticles.tsx`(`ConfettiBurst.tsx`와 동일한 패턴, `components/gender-reveal/` 아래)를
  만들어 `BalloonStage.tsx`에서 풍선 주변 6곳에 `heart-pink`/`heart-blue` 교차 배치로 절대
  위치시킨다.
- Step 2 진행 카운터(FR-020): `BalloonStage.tsx`에 이미 `{touchCount} / 10` 텍스트가 존재하므로
  텍스트 자체는 재구현 불필요 — `font-pixel` 클래스 적용만 추가한다.
- Step 3 캐릭터 일러스트(FR-019): 기존 `img/002.png`(남아), `img/003.png`(여아)를 레퍼런스
  (`step3.png`, `step4.png`)의 픽셀 아트 캐릭터 일러스트로 교체한다.

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
