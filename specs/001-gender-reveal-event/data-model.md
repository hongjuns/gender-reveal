# Data Model: 젠더리빌(Gender Reveal) 이벤트 웹 애플리케이션

모든 데이터는 서버에 저장되지 않는 클라이언트 전용 상태다(spec.md Assumptions). 아래 엔티티는
`src/stores/genderRevealStore.ts`의 Zustand 스토어 상태를 구성한다.

## GenderRevealInput

Step 1에서 생성되어 Step 2, Step 3에서 참조되는 입력값 묶음. '다시 시작하기' 시에도 유지된다
(Clarifications 2026-07-18, FR-015).

| 필드 | 타입 | 필수 | 검증 규칙 |
|------|------|------|-----------|
| `babyNickname` | `string` | Y | 공백 제거 후 길이 1 이상 (FR-001, FR-002) |
| `dueDate` | `Date` | Y | 유효한 날짜 값(과거 날짜 제한 없음, spec.md Assumptions) |
| `recipientName` | `string` | Y | 공백 제거 후 길이 1 이상 (FR-001, FR-002) |
| `babyGender` | `'son' \| 'daughter'` | Y | 라디오/토글로 단일 선택, 기본값 없음(FR-001) |

- **Identity**: 세션 내 단일 인스턴스(목록/식별자 없음) — 동시에 하나의 이벤트만 진행.
- **Lifecycle**: `input` 단계에서 `setInput()`으로 생성/수정 → `interaction`·`result` 단계에서는
  읽기 전용으로 참조 → `restart()` 호출 시에도 값 유지(초기화되지 않음).

## BalloonInteractionState

Step 2의 풍선 터치 진행 상황과 전환 가드를 나타내는 상태.

| 필드 | 타입 | 필수 | 검증 규칙 |
|------|------|------|-----------|
| `touchCount` | `number` | Y | 0 이상 10 이하 정수, `touchBalloon()` 액션을 통해서만 1씩 증가 (FR-006) |
| `isBursting` | `boolean` | Y | `touchCount === 10`이 되는 순간 `true`로 전환되며, 결과 화면 진입 후 `restart()`가 호출되기 전까지 `true` 유지 (FR-007, FR-008) |

- **State transitions**:
  1. `touchCount: 0, isBursting: false` (Step 2 진입 초기값)
  2. `touchBalloon()` 호출 시 `isBursting === false && touchCount < 10`이면 `touchCount += 1`
     (그 외 조건에서는 아무 동작 없음 — 연타/중복 방지 가드, FR-006/FR-008)
  3. `touchCount === 10`에 도달하는 호출에서 `isBursting = true`로 설정, 터짐 애니메이션 종료 후
     `step`을 `'result'`로 전이
  4. `restart()` 호출 시 `touchCount = 0, isBursting = false`로 재설정하고 `step`을 `'interaction'`
     으로 되돌림(FR-015) — `GenderRevealInput`은 변경하지 않음

## AppStep (화면 전환 상태)

세 화면 중 현재 노출 중인 화면을 나타내는 파생 상태.

| 값 | 의미 | 진입 조건 |
|----|------|-----------|
| `'input'` | Step 1 정보 입력 화면 | 초기 진입 시 기본값 |
| `'interaction'` | Step 2 풍선 터치 화면 | `GenderRevealInput` 4개 필드가 모두 유효할 때 `setInput()` 성공 (FR-002, FR-003), 또는 결과 화면에서 `restart()` 호출 시 (FR-015) |
| `'result'` | Step 3 성별 공개 결과 화면 | `BalloonInteractionState.touchCount === 10`이고 터짐 애니메이션이 끝났을 때 (FR-007) |

## 파생 값 (컴포넌트 렌더링용, 스토어에 저장하지 않음)

- **안내 문구 (Step 2)**: `'[babyNickname]'은 아들일까요? 딸일까요?'` — `babyNickname`으로 동적
  치환 (FR-004).
- **결과 이미지/문구 (Step 3)**: `babyGender === 'son'`이면 `img/002.png` + 남아용 문구(FR-009),
  `babyGender === 'daughter'`이면 `img/003.png` + 여아용 문구(FR-010). 문구의 날짜는
  `format(dueDate, 'yyyy년 MM월 dd일')`로 변환한 값을 사용(FR-011, research.md #4).
