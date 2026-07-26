# Data Model: 공유 링크 기반 젠더리빌 플로우(v2)

이번 기능부터 서버 저장이 도입된다(Supabase Postgres). 아래 테이블 하나가 spec.md의 "공유 링크"·
"이벤트 정보" 두 엔티티를 함께 표현한다.

## Table: `gender_reveal_events`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `uuid` | PK, `default gen_random_uuid()` | 이벤트/공유 링크의 고유 식별자. 공유 URL(`/gender-reveal/[id]`)의 경로 파라미터로 그대로 사용된다(research.md #2). |
| `baby_nickname` | `text` | NOT NULL, 공백 제거 후 길이 1 이상 | 태명 (spec.md FR-001) |
| `due_date` | `date` | NOT NULL | 출산예정일 |
| `recipient_name` | `text` | NOT NULL, 공백 제거 후 길이 1 이상 | 받는사람 이름 |
| `gender` | `text` | NOT NULL, `'son' \| 'daughter'` | 아기 성별 (기존 `BabyGender` 타입과 동일한 값) |
| `share_link` | `text` | UNIQUE, NOT NULL | 공유 URL 전체 문자열 또는 `id`와 동일한 값(research.md #2) — 참여자에게 노출/복사되는 값 |
| `link_expires_at` | `timestamptz` | NOT NULL | `created_at + 7일`(KST 기준 계산, research.md #4). 이 시각 이후 접속은 만료로 처리(FR-009, FR-010) |
| `created_at` | `timestamptz` | NOT NULL, `default now()` | 등록일. 링크 유효기간 계산의 기준 시각 |

- **Identity/Uniqueness**: `id`(PK)가 유일한 식별자이며 조회는 항상 `id` 기준으로 수행한다.
  `share_link`는 UNIQUE 제약만 걸어두되, `id`와 값이 같도록 생성하므로 사실상 중복 충돌이 발생하지
  않는다.
- **Lifecycle**: `POST /api/events`로 한 번 insert된 이후 UPDATE/DELETE 경로는 제공하지 않는다
  (spec.md FR-014, "불변 데이터"). 만료는 레코드를 삭제하지 않고 `link_expires_at` 값과 조회 시점을
  비교해 판정하는 파생 상태다 — 만료된 레코드도 DB에는 그대로 남는다(자동 삭제는 이번 범위 밖).
- **Multiplicity**: 하나의 `id`(공유 링크)는 하나의 이벤트 정보에만 연결된다(1:1). 한 레코드를
  여러 사용자가 동시에 조회할 수 있으나(FR-012), 레코드 자체는 접속자별로 분리되지 않는다.

## Derived state: 접속자별 진행 상태 (DB에 저장하지 않음)

풍선 터치 진행 상태(`touchCount`, `isBursting`)는 spec.md Assumptions에 따라 접속자(브라우저)별로
독립적으로만 존재하며, `gender_reveal_events` 테이블과는 무관하다. 기존 001 기능의
`BalloonInteractionState`(`src/stores/genderRevealStore.ts`)를 그대로 재사용한다.

## 클라이언트 측 타입 (`src/types/genderReveal.ts` 확장)

```ts
// 기존 GenderRevealInput / BabyGender / AppStep은 유지

export interface GenderRevealEventRecord {
  id: string;
  babyNickname: string;
  dueDate: string; // ISO date string (yyyy-MM-dd) — 클라이언트에서 Date로 변환 후 GenderRevealInput과 동일하게 사용
  recipientName: string;
  babyGender: BabyGender;
  shareLink: string;
  createdAt: string; // ISO datetime string
  linkExpiresAt: string; // ISO datetime string
}

export type GetEventResult =
  | { status: 'ok'; event: GenderRevealEventRecord }
  | { status: 'expired' }
  | { status: 'not_found' };
```

- `GenderRevealEventRecord`는 `GET /api/events/[id]` 응답 바디를 그대로 반영한다(camelCase로
  변환, contracts/events-api.md 참고).
- `GetEventResult`는 `useGenderRevealEvent` 훅이 반환하는 판별 유니온으로, 페이지 컴포넌트가
  `not_found`일 때 Next.js `notFound()`를, `expired`일 때 `ExpiredLinkNotice`를, `ok`일 때
  `genderRevealStore` 하이드레이션 후 `BalloonStage`/`ResultReveal`을 렌더링하도록 분기한다.

## `genderRevealStore` 확장 (기존 상태 재사용 + 신규 액션)

| 필드/액션 | 변경 여부 | 설명 |
|-----------|-----------|------|
| `step`, `input`, `touchCount`, `isBursting` | 기존 유지 | 001과 동일한 의미/타입 |
| `setInput` | 기존 유지 | 생성자 라우트(`/gender-reveal`)의 `StepOneForm`이 API 성공 후에도 여전히 로컬 표시용으로 호출 가능(선택적) |
| `hydrateFromEvent(event: GenderRevealEventRecord): void` | **신규** | `dueDate` 문자열을 `Date`로 변환해 `input`을 채우고 `step`을 `'interaction'`으로, `touchCount`/`isBursting`을 초기값으로 설정한다. 유효성 검증은 하지 않는다(서버에서 이미 검증된 값). `/gender-reveal/[id]` 페이지가 `useGenderRevealEvent` 성공 시 이 액션을 호출한다(research.md #6). |
| `touchBalloon`, `completeBurstTransition`, `restart`, `resetAll` | 기존 유지 | 의미 변경 없음(research.md #5에 따라 `resetAll` 호출 여부 자체를 라우트별로 다르게 트리거) |

## State transitions (신규 라우트 관점)

1. `/gender-reveal` (생성자): `StepOneForm` 제출 → `useCreateGenderRevealEvent` 뮤테이션 성공 →
   응답의 `id`로 `router.push('/gender-reveal/' + id + '?created=1')`.
2. `/gender-reveal/[id]` (공용): 진입 시 `useGenderRevealEvent(id)` 호출 →
   - `not_found` → Next.js `notFound()` (404 페이지, FR-011)
   - `expired` → `ExpiredLinkNotice` 렌더링(FR-010)
   - `ok` → `hydrateFromEvent(event)` 호출 후 `BalloonStage`(`step === 'interaction'`) 또는
     `ResultReveal`(`step === 'result'`) 렌더링. `created=1` 쿼리 파라미터가 있으면
     `ShareLinkBanner`도 함께 노출(FR-005, FR-008).
