# Data Model: 여러 풍선 생성 및 관리 링크

**Feature**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)

## Entity: `gender_reveal_events` (변경)

행 1개 = 받는 사람 1명에게 보내는 풍선 1개. 같은 `code`를 가진 행들이 하나의 풍선 묶음이다.

| Column | Type | Null | Default | 비고 |
|--------|------|------|---------|------|
| id | uuid | NO | `gen_random_uuid()` | PK. 공유 링크 식별자(받는 사람에게 노출) |
| baby_nickname | text | NO | | 묶음 공통(중복 저장) |
| due_date | date | NO | | 묶음 공통(중복 저장) |
| recipient_name | text | NO | | 받는 사람별 |
| gender | text | NO | | `son` \| `daughter`, 묶음 공통 |
| share_link | text | NO | | unique, 기존과 동일하게 `id`와 같은 값 |
| link_expires_at | timestamptz | NO | | 생성 시 묶음 전체 동일(생성 + 7일). 연장 시 갱신. **생성 + 7일보다 늦으면 연장한 풍선** |
| created_at | timestamptz | NO | `now()` | 묶음 전체 동일. 관리 화면 정렬 기준 |
| **code** | text | NO | `gen_random_uuid()::text` | **신규.** 관리 코드(비밀값). 받는 사람에게 절대 노출 금지 |

**Indexes**

- `idx_gender_reveal_events_code` on `(code)` — 일반 인덱스(묶음 조회용, unique 아님)

**Validation rules** (API 레이어, spec FR 참조)

- 생성 요청: `babyNickname` trim 후 1자 이상, `dueDate` `YYYY-MM-DD` 유효 날짜, `babyGender` ∈
  {`son`, `daughter`}, `recipientNames` 길이 1~10, 각 항목 trim 후 1자 이상 (FR-002, FR-004)
- 한 번의 생성으로 만든 행은 `code`, `link_expires_at`, `created_at`, `baby_nickname`, `due_date`,
  `gender`가 모두 같다 (FR-005, FR-007)
- 묶음 내 정렬: `created_at` 오름차순. 한 번의 insert에서 시각이 같아 순서가 섞이지 않도록, 생성 API가
  행마다 `created_at`을 `baseTime + index(ms)`로 1ms씩 늘려 넣는다(입력 순서 보존). 별도 순서 칼럼은
  추가하지 않는다.

### State transitions (풍선별)

```text
          생성
           │
           ▼
   ┌──────────────┐  now > link_expires_at   ┌──────────────┐
   │  유효·미연장   │ ───────────────────────▶ │  만료·미연장   │
   └──────────────┘                          └──────────────┘
           │ 연장(만료시각+7일)                      │ 연장(연장시점+7일)
           ▼                                        ▼
   ┌──────────────┐  now > link_expires_at   ┌──────────────┐
   │  유효·연장됨   │ ───────────────────────▶ │  만료·연장됨   │ (종료 상태, 더 이상 연장 불가)
   └──────────────┘                          └──────────────┘

어느 상태에서든 삭제(id+code 일치) → 행과 댓글 영구 삭제
```

- 연장 가능 조건: `link_expires_at <= created_at + 7일` (만료 여부 무관, 별도 칼럼 없음)
- 새 만료 시각: `max(link_expires_at, now) + 7일`
- 만료 판정: 기존 `isLinkExpired(link_expires_at)` 그대로

## Entity: `gender_reveal_comments` (변경 없음)

- `event_id` → `gender_reveal_events(id)` `on delete cascade` (0003). 풍선 삭제 시 댓글도 삭제된다.
- write-once RLS 정책(0004) 유지.

## Derived concept: 풍선 묶음 (저장 개체 아님)

- `select … from gender_reveal_events where code = ? order by created_at asc`
- 결과가 0행이면 "존재하지 않는 관리 코드"로 취급(404).

## Migrations

| 파일 | 내용 |
|------|------|
| `supabase/migrations/0005_event_code_and_extension.sql` | `code` 추가 → 기존 행 무작위 백필 → 기본값·NOT NULL → 인덱스 |
| `supabase/migrations/0006_events_anon_update_delete_policies.sql` | anon 역할의 update/delete RLS 정책(서버 API가 id+code 검증) |

검토 결과 두 파일 모두 이 데이터 모델과 일치한다. 적용 순서는 0005 → 0006.

## TypeScript 타입 변경

- `src/lib/supabase/server.ts`: `GenderRevealEventRow`에 `code: string`
  추가(완료). `Insert`에서 `code`는 선택값.
- `src/types/genderReveal.ts`: 관리 화면용 `ManagedBalloon`, `ManagedBalloonGroup`, 결과 유니언 타입 추가
  (contracts/manage-api.md 참조). 받는 사람용 `GenderRevealEventRecord`에는 **code를 추가하지 않는다.**
