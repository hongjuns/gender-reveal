# Contract: Manage API (관리 코드 필요)

관리 화면(`/gender-reveal/manage/[code]`)과 그 훅(`useManagedBalloons`, `useDeleteBalloon`,
`useExtendBalloon`)은 아래 계약에만 의존한다. 모든 엔드포인트는 경로의 `code`가 일치하는 행만 다룬다.
코드가 틀린 경우와 대상이 없는 경우는 구분하지 않고 `404`로 응답한다(FR-010, FR-011).

공통 응답 아이템 타입:

```ts
interface ManagedBalloon {
  id: string;
  recipientName: string;
  shareLink: string;        // `${origin}/gender-reveal/${id}`
  linkExpiresAt: string;    // ISO
  isExpired: boolean;       // isLinkExpired(linkExpiresAt) — 서버 시각 기준
  canExtend: boolean;       // !(linkExpiresAt > createdAt + 7일)
}
```

## `GET /api/manage/[code]`

**Behavior**: `code`가 같은 행을 `created_at ASC`로 전부 조회한다(만료된 풍선 포함, FR-016). 0행이면 `404`.

**Response `200`**:

```ts
{
  babyNickname: string;
  dueDate: string;          // 'YYYY-MM-DD'
  babyGender: 'son' | 'daughter';
  balloons: ManagedBalloon[];
}
```

**Response `404`**: `{ error: 'NOT_FOUND' }`
**Response `500`**: `{ error: 'INTERNAL_ERROR' }`

## `DELETE /api/manage/[code]/events/[id]`

**Behavior**: `delete … where id = :id and code = :code` 단일 조건부 삭제(research #6). 댓글은 FK cascade로
함께 삭제. 삭제된 행이 0개면 `404`.

**Response `204`**: (본문 없음)
**Response `404`**: `{ error: 'NOT_FOUND' }`
**Response `500`**: `{ error: 'INTERNAL_ERROR' }`

## `POST /api/manage/[code]/events/[id]/extend`

**Request body**: 없음

**Behavior** (research #5):

1. `id`+`code`로 `link_expires_at, created_at` 조회. 없으면 `404`.
2. `link_expires_at > created_at + 7일`(이미 연장)이면 `409`.
3. `newExpiresAt = calculateExtendedExpiresAt(link_expires_at, now)` = `max(link_expires_at, now) + 7일`.
4. `update set link_expires_at = newExpiresAt where id and code and link_expires_at = (1에서 읽은 값)`.
   갱신 0행 → (동시 요청에 밀림) `409`.

**Response `200`**: `ManagedBalloon` (갱신된 값)
**Response `404`**: `{ error: 'NOT_FOUND' }`
**Response `409`**: `{ error: 'ALREADY_EXTENDED' }`
**Response `500`**: `{ error: 'INTERNAL_ERROR' }`

## 클라이언트 결과 타입 (`src/lib/api/manage.ts`)

```ts
type GetManagedGroupResult =
  | { status: 'ok'; group: ManagedBalloonGroup }
  | { status: 'not_found' };

type DeleteBalloonResult = { status: 'ok' } | { status: 'not_found' };

type ExtendBalloonResult =
  | { status: 'ok'; balloon: ManagedBalloon }
  | { status: 'already_extended' }
  | { status: 'not_found' };
```

- 삭제/연장 후 `['managed-balloons', code]` 쿼리를 갱신(삭제는 낙관적 제거 후 invalidate, 연장은 응답으로
  해당 항목 교체). `not_found` 결과면 목록을 다시 불러와 해당 행을 제거한다(spec Edge Cases).
