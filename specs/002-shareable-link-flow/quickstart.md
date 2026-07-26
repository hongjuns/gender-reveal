# Quickstart: 공유 링크 기반 젠더리빌 플로우(v2) 검증 가이드

이 문서는 구현이 끝난 뒤 기능이 spec.md 요구사항대로 동작하는지 확인하는 절차다. API/데이터 형태는
[contracts/events-api.md](./contracts/events-api.md), 스키마는 [data-model.md](./data-model.md)를
참고한다.

## Prerequisites

- Node.js(`package.json` 명시 버전), `npm install` 완료(`@supabase/supabase-js`, `axios`,
  `@tanstack/react-query` 추가 설치 포함)
- Supabase 프로젝트에 `gender_reveal_events` 테이블 생성 — `supabase/migrations/0001_gender_reveal_events.sql`을
  아래 방법 중 하나로 적용한다(data-model.md 스키마와 동일):
  - **Supabase 대시보드**: 프로젝트의 SQL Editor에 `supabase/migrations/0001_gender_reveal_events.sql`
    파일 내용을 그대로 붙여넣고 실행
  - **Supabase CLI**: 프로젝트에 CLI가 연결되어 있다면 `supabase db push` (또는
    `supabase migration up`)로 `supabase/migrations/` 아래 마이그레이션을 순서대로 적용
  - 적용 후 `select * from gender_reveal_events limit 1;`로 테이블이 생성됐는지 확인
- `.env.local`(gitignore 대상, 커밋되지 않음)에 아래 환경 변수 설정:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_ANON_KEY` (또는 서버 전용 이름으로 `SUPABASE_SERVICE_ROLE_KEY` — 실제 값은 서버
    환경에서만 주입하고 클라이언트 번들에 노출되는 `NEXT_PUBLIC_` 접두사를 붙이지 않는다)
  - 테이블에 RLS(Row Level Security)가 켜져 있다면, 서버 전용 클라이언트(`src/lib/supabase/server.ts`)가
    사용할 키(anon 또는 service role)에 해당 테이블 select/insert 권한이 있는지 확인한다

## 자동 검증 (Jest)

```bash
npm run lint
npm test
```

**기대 결과**: 모든 테스트 통과. 특히 다음 케이스가 포함되어야 한다.
- `POST /api/events`: 4개 필드가 모두 유효하면 `201`과 `id`/`shareLink`/`linkExpiresAt`을 반환하고,
  하나라도 비어 있으면 `400`을 반환한다(FR-002, FR-003).
- `GET /api/events/[id]`: 존재하지 않는 UUID로 조회 시 `404`, `link_expires_at`이 지난 레코드
  조회 시 `410`, 유효한 레코드 조회 시 `200`과 저장된 값을 그대로 반환한다(FR-009~FR-011).
- `hydrateFromEvent`: 서버 이벤트로 하이드레이션하면 `input`이 채워지고 `step`이 `'interaction'`,
  `touchCount`가 0으로 초기화된다(data-model.md).
- `ResultReveal`에 `onCreateNew`를 넘기면 "새로 만들기" 클릭 시 `resetAll` 대신 해당 콜백이
  호출된다(research.md #5).

## 수동 검증 (개발 서버)

```bash
npm run dev
```

### 1. 생성자 플로우 — 링크 생성

1. `http://localhost:3000/gender-reveal` 접속 → 태명 "콩이", 출산예정일 임의 미래 날짜, 받는사람
   "지민", 성별 '아들' 입력 후 '젠더리빌 풍선 만들기' 클릭.
2. 필수값 중 하나를 비운 채 제출 → 안내 메시지가 뜨고 링크가 발급되지 않는지 확인(FR-002, User
   Story 1 Acceptance #3).
3. 정상 제출 시 `/gender-reveal/[id]?created=1`로 자동 이동하고, 화면 상단에 복사 가능한 공유
   링크 배너가 노출되는지 확인(FR-005, User Story 1 Acceptance #1, #2).
4. 같은 화면에서 곧바로 풍선 터치(step2)로 진입해 있는지 확인 — 생성자도 참여자와 동일하게 체험할
   수 있어야 한다(FR-008, User Story 1 Acceptance #4).

### 2. 참여자 플로우 — 공유 링크 접속

1. 1번에서 발급된 URL을 새 시크릿 창(또는 다른 브라우저)에서 열기.
2. step1 화면 없이 곧바로 풍선 터치 화면(step2)부터 시작하고, "콩이"가 안내 문구에 반영되어 있는지
   확인(FR-006, FR-007, User Story 2 Acceptance #1).
3. 풍선을 10번 터치 → 생성자가 입력한 성별·받는사람·예정일이 반영된 결과 화면(step3)으로 전환되는지
   확인(User Story 2 Acceptance #2).
4. 같은 링크를 세 번째 창에서 다시 열어, 동일한 콘텐츠가 보이지만 각 창의 풍선 터치 진행 상태는
   서로 독립적인지 확인(FR-012, FR-013, User Story 2 Acceptance #3).

### 3. 만료/존재하지 않는 링크

1. Supabase 테이블에서 임의 레코드의 `link_expires_at`을 과거 시각으로 직접 수정 → 그 링크로 접속
   시 "만료된 링크" 안내 화면이 표시되는지 확인(FR-010, User Story 3 Acceptance #1).
2. 존재하지 않는 임의 UUID로 `/gender-reveal/`를 접속 → Next.js 404 화면이 표시되는지 확인
   (FR-011, User Story 3 Acceptance #3).
3. 생성 후 7일이 되지 않은 정상 링크는 계속 step2부터 정상 진입하는지 확인(User Story 3 Acceptance
   #2).

### 4. "새로 만들기" 분기

1. 참여자 경로(`/gender-reveal/[id]`)의 결과 화면에서 '젠더리빌 새로 만들기' 클릭 →
   `/gender-reveal`(생성자 진입점)로 이동하는지 확인(research.md #5).
2. 생성자 경로에서 링크 생성 후 곧바로 결과 화면까지 진행한 뒤 같은 버튼 클릭 → 기존과 동일하게
   step1로 돌아가는지 확인(회귀 없음).

## Storybook 확인

```bash
npm run storybook
```

`ShareLinkBanner`(링크 있음/복사 성공/복사 실패), `ExpiredLinkNotice` 스토리가 개별 상태로
노출되는지 확인한다(Constitution Principle VI).
