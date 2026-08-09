# Data Model: 결과 화면 댓글 기능

`gender_reveal_events`(002)는 이 기능에서 **읽기 전용으로만** 참조되며 스키마 변경이
없다. 아래 신규 테이블 하나가 spec.md의 "댓글" 엔티티를 표현한다.

## Table: `gender_reveal_comments` (신규)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `uuid` | PK, `default gen_random_uuid()` | 댓글 고유 식별자 |
| `event_id` | `uuid` | NOT NULL, FK → `gender_reveal_events(id)` `ON DELETE CASCADE` | 이 댓글이 귀속된 공유 링크(이벤트)의 id (spec.md FR-003) |
| `sender_name` | `varchar(20)` | NOT NULL, `btrim(sender_name) <> ''` | 보내는 사람 이름 (spec.md FR-001, Assumptions: 최대 20자) |
| `content` | `varchar(100)` | NOT NULL, `btrim(content) <> ''` | 댓글 내용 (spec.md FR-001, Assumptions: 최대 100자) |
| `created_at` | `timestamptz` | NOT NULL, `default now()` | 작성 시각. 정렬 기준(FR-004) |

- **Identity/Uniqueness**: `id`(PK)가 댓글의 유일한 식별자. `event_id`는 유니크가 아니며
  하나의 이벤트에 여러 댓글이 달릴 수 있다(1:N).
- **Lifecycle**: INSERT만 가능(write-once, spec.md FR-002). UPDATE/DELETE 경로는 API
  라우트에도, DB RLS 정책에도 존재하지 않는다(아래 RLS 절 참고) — 즉 애플리케이션
  레이어뿐 아니라 anon 키로의 직접 접근 레벨에서도 수정/삭제가 차단된다.
- **Cascade**: 부모 `gender_reveal_events` 행이 삭제되면 그 이벤트에 달린 댓글도 함께
  삭제된다(`ON DELETE CASCADE`). 002 기준 이벤트 삭제 경로는 아직 없으므로 현재는
  발동하지 않는 안전장치 성격이다.
- **정렬**: 조회 시 항상 `created_at DESC`(최신순, spec.md FR-004).
- **인덱스**: `event_id`에 조회 성능을 위한 인덱스를 추가한다(`idx_gender_reveal_comments_event_id`).
- **만료 판정과의 관계**: 이 테이블에는 만료 관련 컬럼이 없다. 조회/등록 시점의 만료
  여부는 항상 `gender_reveal_events.link_expires_at`을 조회해 `isLinkExpired()`(002,
  `src/lib/date.ts`)로 판정한다(research.md #2). `gender_reveal_comments`는 이미
  만료된 이벤트에도 과거 댓글이 있을 수 있으나(이력 보존), 만료 이후에는 GET/POST 모두
  `410`을 반환해 UI에 노출되지 않는다(spec.md FR-005, FR-007).

## Migration 초안

### `supabase/migrations/0003_gender_reveal_comments.sql`

```sql
-- specs/003-event-comments/data-model.md
create table if not exists gender_reveal_comments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references gender_reveal_events(id) on delete cascade,
  sender_name varchar(20) not null,
  content varchar(100) not null,
  created_at timestamptz not null default now(),
  constraint sender_name_not_blank check (btrim(sender_name) <> ''),
  constraint content_not_blank check (btrim(content) <> '')
);

create index if not exists idx_gender_reveal_comments_event_id
  on gender_reveal_comments (event_id);
```

### `supabase/migrations/0004_comments_anon_insert_select_policies.sql`

```sql
-- specs/003-event-comments/data-model.md
-- write-once를 DB 레벨에서 강제: update/delete 정책은 의도적으로 만들지 않는다.
alter table gender_reveal_comments enable row level security;

create policy "Public can create gender reveal comments"
  on gender_reveal_comments
  for insert
  to anon
  with check (true);

create policy "Public can read gender reveal comments"
  on gender_reveal_comments
  for select
  to anon
  using (true);
```

`gender_reveal_events`의 기존 마이그레이션(`0001_gender_reveal_events.sql`,
`0002_anon_insert_select_policies.sql`)은 수정하지 않고 그대로 둔다.

## 클라이언트 측 타입 (`src/types/genderReveal.ts` 확장 — 기존 타입은 그대로 두고 아래만 추가)

```ts
// 기존 GenderRevealInput / GenderRevealEventRecord / GetEventResult 등은 변경 없음

export interface GenderRevealCommentRecord {
  id: string;
  senderName: string;
  content: string;
  createdAt: string; // ISO datetime string
}

export type ListCommentsResult =
  | { status: 'ok'; comments: GenderRevealCommentRecord[] }
  | { status: 'expired' }
  | { status: 'not_found' };

export type CreateCommentResult =
  | { status: 'ok'; comment: GenderRevealCommentRecord }
  | { status: 'expired' }
  | { status: 'not_found' }
  | { status: 'invalid'; message: string };
```

- `ListCommentsResult`/`CreateCommentResult`는 002의 `GetEventResult` 판별 유니온과
  같은 형태를 따른다(research.md #3). `CreateCommentResult`만 `invalid` 분기가
  추가되는데, 이는 002에는 없던 "제출 시점 사용자 입력 오류"를 폼에 인라인으로
  표시하기 위함이다(spec.md FR-006).

## `src/lib/supabase/server.ts` 확장 (기존 파일 — 신규 팩토리 아님)

```ts
// 기존 GenderRevealEventRow, Database 인터페이스는 그대로 두고 아래를 추가/병합한다

export interface GenderRevealCommentRow {
  id: string;
  event_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

// Database.public.Tables에 아래 항목 추가
gender_reveal_comments: {
  Row: Fresh<GenderRevealCommentRow>;
  Insert: Fresh<Omit<GenderRevealCommentRow, 'id' | 'created_at'>>;
  Update: Fresh<Partial<GenderRevealCommentRow>>;
  Relationships: [];
};
```

`getSupabaseServerClient()` 함수 자체는 수정하지 않는다 — 반환 타입의 기반이 되는
`Database` 타입만 넓어진다(research.md #1).

## State transitions (댓글 관점)

1. 참여자가 `/gender-reveal/[id]` 접속 → `step === 'result'` 진입 시 `CommentSection`이
   `eventId`를 받아 마운트 → `useEventComments(eventId)`가 `GET
   /api/events/[id]/comments` 호출.
   - `not_found`/`expired` → `CommentSection` 자체가 아무것도 렌더링하지 않음(사실상
     도달 불가 경로 — 이미 상위 페이지에서 `notFound()`/`ExpiredLinkNotice`로
     분기되므로, `eventId` prop이 존재하는 시점엔 이벤트는 항상 유효했던 상태다).
   - `ok`이고 `comments`가 빈 배열 → `CommentEmptyState` 렌더링.
   - `ok`이고 `comments`가 1개 이상 → `CommentList`가 `created_at DESC` 순서 그대로
     렌더링(서버가 이미 정렬해 내려줌).
2. 참여자가 `CommentForm`에 이름/내용을 입력 후 제출 → `useCreateEventComment`가 `POST
   /api/events/[id]/comments` 호출.
   - `invalid` → 폼 인라인 에러 메시지 표시, 목록/입력값 유지.
   - `not_found`/`expired`(열람 중 만료된 레이스 케이스, spec.md Edge Cases) → 폼을
     비활성화하고 만료/삭제 안내 문구로 대체.
   - `ok` → 응답으로 받은 새 댓글을 `useEventComments` 쿼리 캐시 맨 앞에 즉시
     반영(낙관적 UI 없이 서버 응답 기준으로 append) → 폼 초기화.
