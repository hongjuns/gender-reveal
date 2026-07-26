# Contract: Events API (Route Handlers)

이 기능부터 프론트엔드가 의존하는 외부 인터페이스가 처음 생긴다. `src/components/gender-reveal/*`,
`src/hooks/*`는 아래 두 엔드포인트의 요청/응답 계약에만 의존하며, Supabase 스키마(내부 구현)에는
직접 의존하지 않는다(research.md #7).

## `POST /api/events`

생성자가 '링크 생성'을 클릭했을 때 호출한다(spec.md FR-002, FR-003, FR-004).

**Request body**:

```ts
{
  babyNickname: string;   // trim 후 1자 이상
  dueDate: string;        // 'yyyy-MM-dd'
  recipientName: string;  // trim 후 1자 이상
  babyGender: 'son' | 'daughter';
}
```

**Behavior**:
- 4개 필드 중 하나라도 유효하지 않으면 저장하지 않고 `400`을 반환한다.
- 유효하면 `gender_reveal_events`에 새 행을 insert한다. `created_at`은 DB 기본값(`now()`),
  `link_expires_at`은 서버에서 `addDays(now, 7)`로 계산해 함께 저장한다(research.md #4).
  `share_link`는 생성된 `id`와 동일한 값으로 채운다(research.md #2).
- 매 호출마다 새 레코드를 만든다(중복 제출 방지는 클라이언트 책임, research.md #3).

**Response `201`**:

```ts
{
  id: string;
  shareLink: string;      // 참여자에게 전달할 절대 URL (예: `${origin}/gender-reveal/${id}`)
  linkExpiresAt: string;  // ISO datetime
}
```

**Response `400`** (하나 이상의 필드 누락/유효하지 않음):

```ts
{ error: 'INVALID_INPUT' }
```

**Response `500`** (입력은 유효하지만 저장 중 서버/DB 오류):

```ts
{ error: 'INTERNAL_ERROR' }
```

## `GET /api/events/[id]`

공유 링크 접속 시(생성자 재진입 포함) 항상 호출한다(spec.md FR-007, FR-010, FR-011, research.md #6).

**Path params**: `id` — `gender_reveal_events.id`(UUID)

**Behavior**:
- `id`에 해당하는 행이 없으면(형식이 UUID가 아니거나, 존재한 적 없는 값 포함) `404`를 반환한다
  (spec.md Edge Cases — 형식은 맞지만 미발급된 값도 동일하게 404).
- 행이 있고 `now() > link_expires_at`이면 `410`(만료)을 반환한다.
- 행이 있고 아직 유효하면 `200`과 이벤트 데이터를 반환한다. `shareLink`는 DB에 저장된 원본 값(= `id`)이
  아니라 요청의 origin으로 재구성한 완전한 URL이다(POST 응답과 동일한 형태, research.md #2 참고) —
  참여자/생성자 화면에 그대로 노출·복사되는 값이므로 클릭 가능한 절대 URL이어야 한다.

**Response `200`**:

```ts
{
  id: string;
  babyNickname: string;
  dueDate: string;        // 'yyyy-MM-dd'
  recipientName: string;
  babyGender: 'son' | 'daughter';
  shareLink: string;
  createdAt: string;      // ISO datetime
  linkExpiresAt: string;  // ISO datetime
}
```

**Response `410`** (만료):

```ts
{ error: 'LINK_EXPIRED' }
```

**Response `404`** (존재하지 않음):

```ts
{ error: 'NOT_FOUND' }
```

**Response `500`** (조회 중 서버/DB 오류 — 존재하지 않음과 구분되는 실제 오류):

```ts
{ error: 'INTERNAL_ERROR' }
```

## Consumer 계약

| 호출부 | 사용하는 엔드포인트 | 매핑되는 UI |
|--------|----------------------|-------------|
| `useCreateGenderRevealEvent` (`StepOneForm`이 사용) | `POST /api/events` | 성공 시 `/gender-reveal/[id]?created=1`로 이동 |
| `useGenderRevealEvent` (`/gender-reveal/[id]/page.tsx`가 사용) | `GET /api/events/[id]` | `200` → `hydrateFromEvent` 후 step2~3 렌더링 / `410` → `ExpiredLinkNotice` / `404` → Next.js `notFound()` |

이 표에 없는 응답 형태·상태 코드에 대한 의존은 계약 위반으로 간주하며, Supabase 테이블 컬럼명이나
내부 쿼리 방식이 바뀌어도 위 요청/응답 형태가 유지되는 한 프론트엔드는 영향을 받지 않아야 한다.
