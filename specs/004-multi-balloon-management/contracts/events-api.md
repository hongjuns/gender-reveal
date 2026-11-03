# Contract: Events API 변경 (받는 사람용 + 일괄 생성)

002의 `events-api.md`를 기준으로 변경되는 부분만 정의한다.

## `POST /api/events` (변경 — 일괄 생성)

`StepOneForm` → `RecipientListForm`에서 "젠더리빌 풍선 만들기"를 눌렀을 때 호출한다
(spec FR-001~FR-007). 기존 단건 바디(`recipientName`)는 더 이상 받지 않는다.

**Request body**:

```ts
{
  babyNickname: string;      // trim 후 1자 이상
  dueDate: string;           // 'YYYY-MM-DD', 유효한 날짜
  babyGender: 'son' | 'daughter';
  recipientNames: string[];  // 길이 1~10, 각 항목 trim 후 1자 이상, 중복 허용
}
```

**Behavior**:

1. 검증 실패(배열 아님, 0개, 11개 이상, 빈 이름 포함 등) → `400`, 아무것도 만들지 않는다.
2. `code = crypto.randomUUID()`, `createdAt = now`, `linkExpiresAt = createdAt + 7일`을 **한 번만** 계산한다.
3. 받는 사람마다 `id = crypto.randomUUID()`, `share_link = id`, `created_at = createdAt + index ms`
   (순서 보존, data-model.md), 공통 `code`·`link_expires_at`으로 행을 만들어 **단일 insert**로 저장한다.
4. 실패 시 `500`(부분 생성 없음).

**Response `201`** (만든 사람에게만 반환 — 관리 코드 포함):

```ts
{
  code: string;
  manageLink: string;        // `${origin}/gender-reveal/manage/${code}`
  linkExpiresAt: string;     // ISO, 묶음 공통
  events: Array<{
    id: string;
    recipientName: string;
    shareLink: string;       // `${origin}/gender-reveal/${id}`
  }>;                        // 요청한 recipientNames 순서와 동일
}
```

**Response `400`**: `{ error: 'INVALID_INPUT' }`
**Response `500`**: `{ error: 'INTERNAL_ERROR' }`

## `GET /api/events/[id]` (변경 — 노출 방지 강화만)

요청/응답 계약은 002와 **동일**하다. 내부 조회를 `select('*')`에서 응답에 필요한 칼럼 목록
(`id, baby_nickname, due_date, recipient_name, gender, link_expires_at, created_at`)으로 바꿔
`code`가 서버 메모리에도 올라오지 않게 한다(FR-009).

**불변 조건**: 응답 JSON에 `code`, `manageLink` 키가 존재하지 않는다(테스트로 고정).

## `GET/POST /api/events/[id]/comments` (변경 — 노출 방지 강화만)

계약은 003과 동일. 이벤트 존재·만료 확인 조회를 `select('id, link_expires_at')`로 줄인다.
