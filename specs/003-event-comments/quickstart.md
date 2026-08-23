# Quickstart: 결과 화면 댓글 기능 검증 가이드

이 문서는 구현이 끝난 뒤 기능이 spec.md 요구사항대로 동작하는지 확인하는 절차다.
API/데이터 형태는 [contracts/comments-api.md](./contracts/comments-api.md), 스키마는
[data-model.md](./data-model.md)를 참고한다. 002의 `gender_reveal_events` 테이블/API가
이미 동작 중이라는 전제 위에서 진행한다(002 quickstart를 먼저 통과한 환경 기준).

## Prerequisites

- 002 quickstart의 Prerequisites(패키지 설치, `.env.local` Supabase 환경 변수)가 이미
  충족되어 있어야 한다.
- Supabase 프로젝트에 신규 테이블 `gender_reveal_comments` 생성 —
  `supabase/migrations/0003_gender_reveal_comments.sql`,
  `supabase/migrations/0004_comments_anon_insert_select_policies.sql`을 아래 방법 중
  하나로 적용한다(data-model.md 스키마와 동일):
  - **Supabase 대시보드**: SQL Editor에 두 파일 내용을 순서대로(0003 → 0004) 붙여넣고
    실행
  - **Supabase CLI**: `supabase db push` (또는 `supabase migration up`)로 새 마이그레이션
    적용
  - 적용 후 `select * from gender_reveal_comments limit 1;`로 테이블이 생성됐는지,
    `insert`/`select`는 되지만 `update`/`delete`는 RLS에 의해 거부되는지 확인한다
    (`update gender_reveal_comments set content = 'x' where true;` 실행 시 0 rows
    affected 또는 권한 오류가 나야 정상)
- 기존 `gender_reveal_events` 테이블/마이그레이션(0001, 0002)은 그대로 두고 변경하지
  않는다.

## 자동 검증 (Jest)

```bash
npm run lint
npm test
```

**기대 결과**: 모든 테스트 통과. 특히 다음 케이스가 포함되어야 한다.

- `GET /api/events/[id]/comments`: 존재하지 않는 `id` → `404`, 만료된 이벤트의 `id` →
  `410`, 유효한 이벤트의 `id` → `200`과 `created_at DESC` 순 댓글 배열(spec.md FR-004,
  FR-005).
- `POST /api/events/[id]/comments`: 존재하지 않는 `id` → `404`, 만료된 이벤트 → `410`,
  `senderName`/`content` 중 하나라도 공백뿐이거나 길이 초과 → `400`, 모두 유효 →
  `201`과 저장된 댓글(spec.md FR-001, FR-002, FR-006, FR-007). 검증 순서가
  존재여부 → 만료여부 → 입력값 순인지도 확인한다(contracts/comments-api.md).
- 기존 `POST /api/events`, `GET /api/events/[id]`(002) 테스트가 그대로 통과해 회귀가
  없는지 확인한다(spec.md FR-009).
- `CommentSection`/`CommentForm`/`CommentList`/`CommentEmptyState` 컴포넌트 테스트:
  빈 목록일 때 `CommentEmptyState`가 보이는지, 제출 성공 시 폼이 초기화되고 새 댓글이
  목록 맨 위에 나타나는지, 이름/내용이 비어 있으면 제출이 막히는지(spec.md FR-006).

## 수동 검증 (개발 서버)

```bash
npm run dev
```

### 1. 댓글 작성 (User Story 1)

1. 002 플로우대로 링크를 하나 생성하고 풍선을 터치해 결과 화면(step3)까지 진행한다.
2. 결과 화면 하단에 댓글 작성 폼이 보이는지 확인한다.
3. 이름 또는 내용 중 하나를 비운 채 제출 → 등록이 거부되고 무엇을 채워야 하는지
   안내되는지 확인한다(spec.md FR-006, User Story 1 Acceptance #2).
4. 이름 "지민", 내용 "축하해요!"를 입력하고 제출 → 댓글이 즉시 목록에 나타나는지
   확인한다(User Story 1 Acceptance #1).
5. 같은 화면에서 다시 한번 다른 내용으로 제출 → 새 댓글이 추가되고 기존 댓글은 그대로
   남아 있는지 확인한다(User Story 1 Acceptance #3, write-once).
6. 결과 이미지 저장/공유 버튼을 눌러봤을 때, 저장되는 이미지에 댓글 목록/입력 폼이
   포함되지 않는지 확인한다(research.md #6 — 캡처 영역과 댓글 UI 분리).

### 2. 모든 참여자가 동일한 댓글 목록 보기 (User Story 2)

1. 1번에서 댓글이 달린 공유 링크를 새 시크릿 창에서 연다.
2. step3까지 진행했을 때 1번에서 남긴 댓글이 모두 최신순으로 보이는지 확인한다(User
   Story 2 Acceptance #1).
3. 이 창에서 새 댓글을 하나 등록한다.
4. 원래 창을 새로고침해 방금 등록한 댓글이 같은 순서로 보이는지 확인한다(User Story 2
   Acceptance #2).

### 3. 만료/존재하지 않는 링크에서 댓글 UI 숨김 (User Story 3)

1. Supabase 테이블에서 특정 이벤트의 `link_expires_at`을 과거 시각으로 직접 수정 →
   그 링크로 접속 시 기존 "만료된 링크" 안내만 보이고 댓글 작성/조회 UI는 어디에도
   나타나지 않는지 확인한다(spec.md FR-005, User Story 3 Acceptance #1).
2. 존재하지 않는 임의 UUID로 접속 → 기존 404 화면만 보이고 댓글 UI가 없는지 확인한다
   (User Story 3 Acceptance #2).
3. (선택, API 레벨) 유효한 링크를 열어둔 상태에서 서버에서 해당 이벤트를 만료시킨 뒤
   그 화면에서 댓글을 제출 → 등록이 거부되고 만료 안내로 전환되는지 확인한다(User
   Story 3 Acceptance #3, Edge Cases 레이스 케이스).

### 4. 기존 기능 회귀 없음 확인

1. 002 quickstart의 생성자/참여자 플로우를 다시 한 번 수행해 step1/step2 동작, 공유
   링크 배너, 만료/404 처리에 변화가 없는지 확인한다(spec.md FR-009).
2. `genderRevealStore`를 사용하는 기존 컴포넌트(BalloonStage 등)의 동작에 변화가 없는지
   확인한다.

## Storybook 확인

```bash
npm run storybook
```

`CommentForm`(빈 상태/입력 중/검증 에러), `CommentList`(댓글 여러 개), `CommentEmptyState`,
`CommentSection`(전체 조합) 스토리가 개별 상태로 노출되는지 확인한다(Constitution
Principle VI).
