# Contract: `useGenderRevealStore` (Zustand)

이 기능에는 외부 API가 없다(백엔드 없음, 프론트엔드 단독 이벤트 페이지). 대신 `StepOneForm`,
`BalloonStage`, `ResultReveal` 세 컴포넌트가 공유하는 유일한 내부 인터페이스인 Zustand 스토어의
상태/액션 시그니처를 컴포넌트 간 계약으로 정의한다. 각 컴포넌트는 이 계약에 정의된 필드/액션
외에는 스토어 내부 구현에 의존하지 않는다.

## State shape

```ts
type AppStep = 'input' | 'interaction' | 'result';

interface GenderRevealInput {
  babyNickname: string;
  dueDate: Date;
  recipientName: string;
  babyGender: 'son' | 'daughter';
}

interface GenderRevealState {
  step: AppStep;
  input: GenderRevealInput | null; // 'input' 단계 진입 직후에는 아직 null
  touchCount: number;              // 0 ~ 10
  isBursting: boolean;
}
```

## Actions

### `setInput(input: GenderRevealInput): { ok: true } | { ok: false; error: 'MISSING_FIELDS' }`

- **Preconditions**: 호출 시점의 `step === 'input'`.
- **Behavior**: `input`의 4개 필드가 모두 유효(빈 문자열/미선택 아님)하면 상태에 저장하고
  `step`을 `'interaction'`으로 전이한 뒤 `{ ok: true }`를 반환한다(FR-003). 하나라도 누락되면
  상태를 변경하지 않고 `{ ok: false, error: 'MISSING_FIELDS' }`를 반환한다(FR-002) — 호출부
  (`StepOneForm`)는 이 값으로 '정보를 모두 입력해주세요' 메시지를 노출한다.
- **Postconditions**: 성공 시 `input`이 채워지고 `step === 'interaction'`, `touchCount === 0`,
  `isBursting === false`.

### `touchBalloon(): void`

- **Preconditions**: `step === 'interaction'`.
- **Behavior**: `isBursting === false && touchCount < 10`일 때만 `touchCount`를 1 증가시킨다
  (FR-006). 증가 후 `touchCount === 10`이 되면 `isBursting = true`로 설정한다(FR-007). 그 외
  호출(`isBursting === true`이거나 이미 `touchCount === 10`)은 아무 상태도 변경하지 않는다
  (FR-008, 연타/중복 전환 방지).
- **Postconditions**: `touchCount`는 항상 0~10 범위, `isBursting`은 `touchCount === 10`이 된
  이후에만 `true`.

### `completeBurstTransition(): void`

- **Preconditions**: `isBursting === true`.
- **Behavior**: 터짐 애니메이션 재생이 끝난 뒤 `BalloonStage`가 호출하여 `step`을 `'result'`로
  전이시킨다.
- **Postconditions**: `step === 'result'`.

### `restart(): void`

- **Preconditions**: `step === 'result'`.
- **Behavior**: `input`은 변경하지 않고 `touchCount = 0`, `isBursting = false`, `step =
  'interaction'`으로 재설정한다(FR-015, Clarifications 2026-07-18).
- **Postconditions**: `input`은 호출 전과 동일, `touchCount === 0`, `step === 'interaction'`.

## Consumer 계약

| 컴포넌트 | 읽는 상태 | 호출하는 액션 |
|----------|-----------|----------------|
| `StepOneForm` | `step` | `setInput` |
| `BalloonStage` | `step`, `input.babyNickname`, `touchCount`, `isBursting` | `touchBalloon`, `completeBurstTransition` |
| `ResultReveal` | `step`, `input` | `restart` |

이 표에 없는 필드/액션에 대한 의존은 계약 위반으로 간주하며, 스토어 내부 구현이 바뀌어도 위 표의
필드·액션 시그니처가 유지되는 한 각 컴포넌트는 영향을 받지 않아야 한다.
