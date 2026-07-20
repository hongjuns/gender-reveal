# Research: 젠더리빌(Gender Reveal) 이벤트 웹 애플리케이션

Technical Context에 `NEEDS CLARIFICATION` 항목은 없다(프로젝트 헌법에서 기술 스택이 이미 확정되어
있음). 아래는 설계 결정을 위해 검토가 필요한 항목들에 대한 조사 결과다.

## 1. 풍선 터치 카운트 정확성 보장 방식

- **Decision**: 터치 카운트는 Zustand 스토어의 단일 액션(`touchBalloon()`) 내부에서만 증가시키고,
  `isBursting`(터짐 애니메이션 진행 중) 플래그가 `true`인 동안에는 이 액션이 아무 것도 하지 않도록
  가드한다. 카운트가 정확히 10에 도달하는 순간에만 `isBursting`을 `true`로 설정한다.
- **Rationale**: React state batching이나 빠른 연타로 인한 이벤트 핸들러 중복 실행 시에도, 카운트
  증가 로직이 스토어의 단일 액션(단일 진실 공급원)에만 존재하면 경쟁 조건 없이 정확한 카운트가
  보장된다. `isBursting` 가드는 FR-008(전환 중 중복 카운트/중복 전환 방지)을 만족시킨다.
- **Alternatives considered**: 컴포넌트 로컬 `useState`로 카운트 관리 — 리렌더링 배칭 시 클로저에
  갇힌 stale 값 때문에 연타 시 카운트 유실 위험이 있어 기각. `onTouchStart`/`onClick` 이벤트를
  각각 별도로 처리 — 모바일에서 동일 탭에 대해 두 이벤트가 모두 발생해 중복 카운트될 위험이 있어,
  단일 `onClick`(포인터 이벤트로 통합) 핸들러만 사용하기로 결정.

## 2. 풍선 시각 피드백 애니메이션 구현 방식

- **Decision**: CSS Modules 내 CSS 애니메이션/트랜지션(`transform: scale()`, 짧은 `shake` keyframe)으로
  구현하고, 터치 횟수에 비례해 `scale` 값을 점증시킨다. 10번째 터치 시에는 별도의 `burst` 클래스로
  확대 후 페이드아웃하는 짧은 애니메이션을 재생한다.
- **Rationale**: 별도 애니메이션 라이브러리 없이 SCSS(Principle III)만으로 충분히 구현 가능해
  의존성을 늘리지 않는다. CSS 트랜지션은 GPU 가속되어 모바일에서도 60fps에 가까운 성능을 낸다.
- **Alternatives considered**: JS 애니메이션 라이브러리(Framer Motion 등) 도입 — 이 기능 하나를
  위해 새 의존성을 추가하는 것은 헌법의 "임의 기술 도입 시 개정 필요" 원칙과 YAGNI에 어긋나 기각.

## 3. Zustand 스토어 설계

- **Decision**: 하나의 스토어(`useGenderRevealStore`)에 `input`(GenderRevealInput),
  `touchCount`, `isBursting`, `step`(`'input' | 'interaction' | 'result'`)을 함께 두고,
  `setInput`, `touchBalloon`, `restart` 세 가지 액션만 노출한다.
- **Rationale**: 세 값(입력값, 터치 상태, 현재 단계)은 하나의 이벤트 흐름 안에서만 함께 변하므로
  스토어를 나누면 오히려 동기화 버그(예: `step`과 `touchCount`의 불일치) 위험이 커진다. 단일
  스토어 + 최소 액션 집합이 Principle IV(전역 클라이언트 상태는 Zustand)와 가장 잘 맞는다.
- **Alternatives considered**: React Context + `useReducer` — 헌법상 전역 클라이언트 상태는
  Zustand로 못박혀 있어 기각. 스토어를 입력/인터랙션 두 개로 분리 — 액션 간 조합 로직이 두 스토어에
  걸쳐 분산되어 복잡도만 증가해 기각.

## 4. 출산 예정일 KST 포맷팅

- **Decision**: `date-fns`의 `format` 함수와 KST(UTC+9, DST 없음) 고정 오프셋을 전제로, Step 1에서
  선택한 날짜를 `Date` 객체로 저장하고 결과 화면 렌더링 시 `format(date, 'yyyy년 MM월 dd일')`로
  변환한다.
- **Rationale**: KST는 서머타임이 없는 고정 UTC+9 표준시이므로, 별도의 타임존 변환 라이브러리
  (`date-fns-tz` 등) 없이도 날짜 선택 UI에서 로컬 자정 기준으로 값을 받아 그대로 포맷하면 KST
  표시 요구(FR-011, 헌법 Principle V)를 충족한다.
- **Alternatives considered**: `date-fns-tz`로 명시적 타임존 변환 — 서버 시간대가 다를 수 있는
  풀스택 앱에서는 유효하지만, 이 기능은 순수 클라이언트 입력→표시 흐름이라 오버엔지니어링으로 판단해
  기각(단, 추후 서버 저장 기능이 추가되면 재검토 필요).

## 5. 이미지 자산 경로 대소문자 이슈

- **Decision**: 세 이미지 모두 소문자 경로(`public/img/001.png`, `public/img/002.png`,
  `public/img/003.png`)로 통일하고, 코드에서도 항상 소문자 `img/...`로 참조한다.
- **Rationale**: 원본 요구사항에는 풍선 이미지가 `Img/001.png`(대문자 I)로, 결과 이미지는
  `img/002.png`, `img/003.png`(소문자)로 표기되어 있다. macOS/Windows 개발 환경은 대소문자를
  구분하지 않아 문제가 드러나지 않지만, 일반적인 Linux 기반 배포 환경은 대소문자를 구분해 배포 후
  이미지가 깨질 수 있다. 세 경로를 소문자로 통일해 이 위험을 제거한다.
- **Alternatives considered**: 표기 그대로 `Img/001.png` 유지 — 개발 환경에서는 문제없이 동작해
  발견이 늦어질 수 있는 잠재적 배포 버그이므로 기각.

## 6. Next.js App Router에서 다단계 화면 전환 패턴

- **Decision**: 별도 라우트 분리 없이 `app/gender-reveal/page.tsx` 하나를 클라이언트 컴포넌트로
  선언(`"use client"`)하고, Zustand 스토어의 `step` 값에 따라 `StepOneForm` / `BalloonStage` /
  `ResultReveal` 세 컴포넌트 중 하나를 조건부 렌더링한다.
- **Rationale**: 각 단계는 서버에 저장되지 않는 임시 클라이언트 상태에만 의존하고 URL로 공유되거나
  새로고침 후에도 유지될 필요가 없다(Assumptions). 별도 라우트(`/step-1`, `/step-2`, `/step-3`)로
  나누면 새로고침 시 상태 유실과 라우트 간 이동이라는 불필요한 복잡도만 늘어난다.
- **Alternatives considered**: 단계별 개별 라우트 + 쿼리 파라미터로 상태 전달 — 필수 값이 URL에
  노출되고 새로고침 엣지 케이스 처리가 추가로 필요해 기각.

## 7. 풍선 터짐 사운드 이펙트

- **Decision**: 사운드는 선택 사항(spec.md Assumptions)으로 두고, 구현 시 `<audio>` 엘리먼트를
  터치 인터랙션(사용자 제스처) 컨텍스트 안에서만 재생하도록 한다. 사운드 파일이 없거나 재생이
  차단되어도 애니메이션만으로 FR-007을 충족한 것으로 간주한다.
- **Rationale**: 브라우저 자동재생 정책상 사용자 제스처 없이는 오디오 재생이 차단되지만, 이미 10번째
  '터치'라는 사용자 제스처 이벤트 핸들러 내부에서 재생을 시도하므로 정책 제약을 준수하면서도 사운드를
  걸 수 있다. 다만 필수 요구사항은 아니므로 실패해도 흐름이 막히지 않게 한다.
- **Alternatives considered**: 사운드를 필수 요구사항으로 격상 — spec.md에서 이미 선택 사항으로
  명시했으므로 범위 밖.

## 8. 테스트(Jest) 및 Storybook 범위

- **Decision**: `StepOneForm`, `BalloonStage`, `ResultReveal` 세 컴포넌트와 `genderRevealStore`,
  `lib/date.ts` 유틸에 대해 Jest 단위/컴포넌트 테스트를 작성한다. Storybook 스토리는 세 컴포넌트에
  대해 각각 주요 상태(빈 폼/채워진 폼, 터치 0~9/10, 아들/딸 결과)를 스토리로 분리해 문서화한다.
- **Rationale**: 헌법 Principle VI(Quality Gates)가 컴포넌트별 Jest 테스트와 Storybook 스토리를
  요구하므로, 세 화면 컴포넌트와 상태 관리 로직을 테스트 대상으로 명시해 `/speckit-tasks` 단계에서
  누락되지 않게 한다.
- **Alternatives considered**: E2E 테스트(Playwright 등) 도입 — 프로젝트 헌법에 명시된 테스트
  도구가 Jest뿐이라 이번 기능 범위에서는 제외하고, 향후 필요 시 별도 헌법 개정으로 논의.

## 9. 디자인 시스템(폰트·컬러) 적용 방식 (FR-016~FR-020)

- **Decision**: 픽셀 폰트(RoundedFixedsys/DungGeunMo)와 Pretendard(100~900)는 모두 jsDelivr CDN
  `@font-face`로 `src/app/globals.css`에 선언하고, `tailwind.config.ts`의
  `fontFamily`(`pixel`, `sans`)·`colors`(`boy-bg`, `boy-point`, `girl-bg`, `girl-point`,
  `heart-pink`, `heart-blue`) 확장을 통해 컴포넌트에서 Tailwind 유틸리티 클래스로 사용한다.
- **Rationale**: 프로젝트는 Constitution Principle III(SCSS Modules)와 달리 이미 Tailwind CSS +
  `globals.css` 기반으로 구현되어 있다(`StepOneForm`, `BalloonStage`, `ResultReveal` 확인 결과).
  새 디자인 토큰도 기존 컴포넌트의 유틸리티 클래스 패턴과 일관되게 전역 CSS `@font-face` + Tailwind
  테마 확장 방식으로 추가하는 것이 가장 적은 리스크로 FR-016~FR-020을 충족한다. 색상 값은 사용자가
  제공한 레퍼런스 이미지(`public/reference/step1~4.png`)를 픽셀 샘플링해 근사치를 산출했다.
- **Alternatives considered**: `next/font/local`로 self-host — 오프라인 대응·성능 면에서는 낫지만,
  사용자가 명시적으로 제공한 CDN `@font-face` 코드를 그대로 사용하도록 지정했으므로 채택하지 않음.
  Constitution 위반(Tailwind 사용)을 이번 기회에 SCSS Modules로 되돌리는 방안 — 이번 기능(디자인
  요구사항 추가)과 무관한 대규모 리팩터링이 되어 범위 초과로 기각, 별도 헌법 개정/정리 작업으로
  분리 필요.
