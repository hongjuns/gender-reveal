# Contract: Comments API (Route Handlers)

`src/components/gender-reveal/Comment*`, `src/hooks/useEventComments` /
`useCreateEventComment`는 아래 두 엔드포인트의 요청/응답 계약에만 의존하며,
`gender_reveal_comments`/`gender_reveal_events` 테이블 스키마(내부 구현)에는 직접
의존하지 않는다. 기존 `events-api.md`(002)에 정의된 `POST /api/events`, `GET
/api/events/[id]`는 이 계약에 포함되지 않으며 변경도 없다.

## `GET /api/events/[id]/comments`

결과 화면(step3) 진입 시, 그리고 댓글 등록 성공 후 목록 갱신을 위해 호출한다(spec.md
FR-004).

**Path params**: `id` — `gender_reveal_events.id`(UUID)

**Behavior**:
1. `id`에 해당하는 `gender_reveal_events` 행을 조회한다(`select('id, link_expires_at')`).
   없으면 `404`.
2. 행이 있고 `isLinkExpired(link_expires_at)`이면 `410`.
3. 유효하면 `gender_reveal_comments`에서 `event_id = id`인 행을 `created_at DESC`
   순으로 전체 조회해 `200`으로 반환한다(spec.md FR-004 — 페이지네이션 없음, Assumptions).

**Response `200`**:

```ts
{
  comments: Array<{
    id: string;
    senderName: string;
    content: string;
    createdAt: string; // ISO datetime
  }>;
}
```

**Response `410`** (만료):

```ts
{ error: 'LINK_EXPIRED' }
```

**Response `404`** (이벤트 없음):

```ts
{ error: 'NOT_FOUND' }
```

**Response `500`** (조회 중 서버/DB 오류):

```ts
{ error: 'INTERNAL_ERROR' }
```

## `POST /api/events/[id]/comments`

참여자가 `CommentForm`을 제출했을 때 호출한다(spec.md FR-001, FR-002, FR-006, FR-007).

**Path params**: `id` — `gender_reveal_events.id`(UUID)

**Request body**:

```ts
{
  senderName: string; // trim 후 1~20자
  content: string;    // trim 후 1~100자
}
```

**검증 순서** (spec.md FR-006, FR-007 — 반드시 이 순서로 판정):

1. `id`에 해당하는 `gender_reveal_events` 행이 없으면 → `404`.
2. 행은 있으나 `isLinkExpired(link_expires_at)`이면 → `410`(열람 시점엔 유효했으나
   제출 시점에 만료된 레이스 케이스 포함, spec.md Edge Cases).
3. `senderName` 또는 `content`가 trim 후 비어 있거나, 각각 20자/100자를 초과하면 →
   `400`.
4. 위 셋을 모두 통과하면 `gender_reveal_comments`에 insert하고 `201`.

**Response `201`**:

```ts
{
  id: string;
  senderName: string;
  content: string;
  createdAt: string; // ISO datetime
}
```

**Response `400`** (검증 실패):

```ts
{ error: 'INVALID_INPUT' }
```

**Response `410`** (만료):

```ts
{ error: 'LINK_EXPIRED' }
```

**Response `404`** (이벤트 없음):

```ts
{ error: 'NOT_FOUND' }
```

**Response `500`** (입력은 유효하지만 저장 중 서버/DB 오류):

```ts
{ error: 'INTERNAL_ERROR' }
```

## Consumer 계약

| 호출부 | 사용하는 엔드포인트 | 매핑되는 UI |
|--------|----------------------|-------------|
| `useEventComments(eventId)` (`CommentSection`이 사용) | `GET /api/events/[id]/comments` | `ok` + 빈 배열 → `CommentEmptyState` / `ok` + 1개 이상 → `CommentList` / `expired`\`not_found` → `CommentSection` 비노출(상위 라우팅이 이미 걸러낸 경로이므로 방어적 처리만) |
| `useCreateEventComment(eventId)` (`CommentForm`이 사용) | `POST /api/events/[id]/comments` | `ok` → 폼 초기화 + 목록에 즉시 반영 / `invalid` → 필드 인라인 에러 / `expired`\`not_found` → 폼을 만료 안내로 교체 |

이 표에 없는 응답 형태·상태 코드에 대한 의존은 계약 위반으로 간주한다. `POST
/api/events`, `GET /api/events/[id]`(002)의 계약·구현은 이 기능으로 인해 전혀 변경되지
않는다.
