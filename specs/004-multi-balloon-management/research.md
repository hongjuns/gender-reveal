# Research: 여러 풍선 생성 및 관리 링크

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-11-03

Technical Context에 NEEDS CLARIFICATION은 없다(스택은 001~003과 동일). 아래는 설계 결정 기록이다.

## 1. 묶음 모델: 부모 테이블 대신 `code` 칼럼

- **Decision**: `gender_reveal_events`에 `code text not null` 칼럼을 추가하고, 같은 `code`를 가진
  행들을 하나의 풍선 묶음으로 본다. 별도 묶음 테이블은 만들지 않는다.
- **Rationale**: 행 = 받는 사람 1명 = 공유 링크 1개라는 기존 구조와 댓글 FK(`event_id`)를 그대로
  유지할 수 있다. 공통 정보(태명·예정일·성별)는 수정 기능이 없으므로(spec Assumptions) 중복 저장해도
  정합성 문제가 생기지 않는다.
- **Alternatives considered**: `gender_reveal_groups(id, code, baby_nickname, …)` 부모 테이블 +
  `events.group_id` FK. 정규화는 되지만 기존 이벤트 조회/생성 API, 백필, 타입이 모두 바뀌고 이번 범위에서
  얻는 이점이 없다. 공통 정보 수정 기능이 생기면 그때 분리한다.

## 2. 관리 코드 생성과 노출 방지

- **Decision**: 관리 코드는 서버에서 `crypto.randomUUID()`(122비트 무작위)로 생성한다. DB 칼럼 기본값도
  `gen_random_uuid()::text`로 두어 코드 없이 삽입되는 경로(테스트 데이터 등)에도 무작위 값이 들어가게
  한다. 기존 행은 마이그레이션에서 `gen_random_uuid()::text`로 행마다 따로 백필한다.
- **Rationale**: `id`는 공유 링크에 그대로 노출되므로 `code = id` 백필은 받는 사람에게 관리 권한을 주는
  것과 같다(FR-008). UUID v4는 추측 불가능하고 별도 의존성이 없다.
- **노출 방지 규칙** (FR-009):
  - 받는 사람이 호출하는 API(`GET /api/events/[id]`, 댓글 API)는 `select('*')` 대신 필요한 칼럼만
    명시해 조회한다. 응답 매핑도 지금처럼 필드를 하나씩 고른다(이중 방어).
  - 관리 코드는 생성 응답(만든 사람에게만 반환)과 관리 API 경로에만 등장한다.
  - 관리 화면은 `<meta name="referrer" content="no-referrer">`, `robots: noindex`를 적용해 외부로
    URL이 새거나 검색 엔진에 수집되지 않게 한다.
- **Alternatives considered**: 짧은 코드(6~8자) — 사람이 받아 적기 쉽지만 무작위 대입에 취약해 기각.
  관리 코드를 요청 헤더로 전달 — 서버 로그에 경로가 남지 않는 이점이 있으나, 관리 화면 URL 자체에 코드가
  들어가야 하므로(로그인 없음) 이점이 제한적이고 일관성을 위해 경로 파라미터로 통일한다.

## 3. 관리 화면/관리 API 경로

- **Decision**:
  - 화면: `/gender-reveal/manage/[code]` (생성 직후에는 `?created` 쿼리로 진입)
  - API: `GET /api/manage/[code]`, `DELETE /api/manage/[code]/events/[id]`,
    `POST /api/manage/[code]/events/[id]/extend`
- **Rationale**: App Router에서 정적 세그먼트(`manage`)는 같은 레벨의 동적 세그먼트(`[id]`)보다 우선
  매칭되므로 기존 `/gender-reveal/[id]`와 충돌하지 않는다(`/gender-reveal/manage` 단독 요청은 `[id]`로
  매칭되어 기존처럼 404). API를 `/api/manage/[code]/…` 아래로 모아 "코드가 있어야만 쓸 수 있는 API"를
  경로만으로 구분한다.
- **Alternatives considered**: `/manage/[code]` 최상위 경로 — 기능 영역(gender-reveal) 밖으로 흩어져
  기각. `DELETE /api/events/[id]?code=` — 받는 사람용 API와 관리용 API가 섞여 노출 방지 검토가 어려워 기각.

## 4. 일괄 생성의 원자성

- **Decision**: `POST /api/events`에서 받는 사람 수만큼 행을 만들어 Supabase `insert([...])` **한 번**으로
  삽입한다.
- **Rationale**: PostgREST는 배열 insert를 단일 `INSERT … VALUES (…), (…)` 문으로 실행하므로 전부 성공
  또는 전부 실패가 보장된다(FR-006). 모든 행의 `link_expires_at`, `created_at`, `code`는 서버에서 한 번
  계산한 같은 값을 쓴다(FR-007).
- **Alternatives considered**: 행별 순차 insert + 실패 시 보상 삭제 — 부분 실패 창이 생겨 기각. Postgres
  함수(RPC) — 불필요한 복잡도.

## 5. 1회 연장의 원자성과 새 만료 시각

- **Decision**: 연장 여부는 별도 칼럼 없이 `link_expires_at > created_at + 7일`로 판단한다
  (`hasBeenExtended`). 연장 API는 (1) `id`+`code`로 `link_expires_at, created_at`을 조회하고, (2) 이미
  연장했으면 409, (3) 새 만료 시각 `max(link_expires_at, now) + 7일`을 계산한 뒤, (4)
  `update … where id = ? and code = ? and link_expires_at = (방금 읽은 값)`으로 조건부 갱신한다.
  갱신된 행이 0개면(동시 요청에 밀림) 409.
- **Rationale**: 생성 시 만료 시각은 항상 생성 + 7일이고, 연장하면 만료 전(기존 + 7일)이든 만료 후(지금 + 7일)든
  반드시 그보다 늦어지므로 칼럼 없이도 1회 여부를 판별할 수 있다. 일괄 생성의 `created_at`은 1ms씩 늘어나지만
  만료 시각은 기준 시각 + 7일이라 오판하지 않는다. 읽은 값과 같을 때만 갱신하는 낙관적 잠금으로 동시 요청이 와도
  하나만 성공한다(FR-022, SC-006).
- **Trade-off**: DB에서 `link_expires_at`을 직접 늘린 풍선은 연장한 것으로 판단되고, 기본 유효기간(7일)을 바꾸면
  이전 풍선의 판단이 틀어질 수 있다. 연장 시각 기록은 남지 않는다(화면에서 쓰지 않음). 만료 후 연장 = 연장 시점 + 7일이라는 결정(spec Clarifications)을
  `max(…)` 한 줄로 표현할 수 있다. 계산 함수는 `src/lib/date.ts`에 `calculateExtendedExpiresAt`으로
  추가해 단위 테스트한다.
- **Alternatives considered**: `extended_at timestamptz` 칼럼 — 명시적이지만 마이그레이션이 늘어나 사용자 결정으로
  제외(2026-11-03). `extension_count` 정수 칼럼 — 1회 제한에는 과하다. RPC로 DB에서 계산 —
  supabase-js의 update는 표현식(`greatest(...)`)을 지원하지 않아 함수가 필요해지므로 기각.

## 6. 삭제와 존재 여부 비노출

- **Decision**: `delete().eq('id', id).eq('code', code).select('id')`로 한 번에 삭제하고, 삭제된 행이
  없으면 404(`NOT_FOUND`)를 반환한다. 코드가 틀린 경우와 풍선이 없는 경우를 구분하지 않는다(FR-010).
  댓글은 기존 FK `on delete cascade`로 함께 삭제된다(FR-019).
- **Rationale**: 조회 후 삭제가 아닌 단일 조건부 삭제라 경쟁 조건이 없다.
- **비고**: RLS 하에서도 FK cascade 동작은 RLS를 우회하므로(참조 무결성 트리거는 테이블 소유자 권한으로
  실행) 댓글 테이블에 delete 정책을 추가할 필요가 없다. 댓글 write-once 정책(0004)은 그대로 유지된다.

## 7. 마지막 풍선 삭제 후 화면

- **Decision**: 같은 화면에서 마지막 풍선을 지우면 TanStack Query 캐시가 빈 목록이 되어
  "남은 풍선이 없어요" 빈 상태를 보여준다. 이후 같은 관리 링크로 다시 접속하면 해당 코드의 행이 없으므로
  "찾을 수 없는 페이지"를 보여준다.
- **Rationale**: 묶음은 별도 저장 개체가 아니므로(research #1) 빈 묶음과 잘못된 코드를 서버가 구분할 수
  없다. spec US4-5는 같은 화면에서의 경험이며, 재방문 시 404는 FR-011과 일치한다.

## 8. 생성 흐름 UI 구조와 상태

- **Decision**: `/gender-reveal`의 `StepOneForm`에서 받는 사람 입력칸을 제거하고, "다음"을 누르면 같은
  페이지 안에서 `RecipientListForm`(Figma 258-29)으로 전환한다. 공통 입력값과 받는 사람 목록은
  `StepOneForm`의 React 로컬 state로 보관해 뒤로 가기 시 그대로 유지한다. 생성 성공 시
  `/gender-reveal/manage/[code]?created`로 이동한다.
- **Rationale**: 헌법 IV(로컬 상태는 React hooks). `genderRevealStore`는 받는 사람의 풍선 터뜨리기 흐름
  전용이므로 변경하지 않는다. 생성 직후 모달(`LinkGeneratedModal`)은 관리 링크 모달(`ManageLinkModal`,
  Figma 278-112)로 대체되므로 `LinkGeneratedModal`과 스토리/테스트는 삭제한다.
- **Alternatives considered**: 받는 사람 입력을 별도 라우트로 분리 — 새로고침 시 공통 입력값을 잃거나
  상태를 URL/스토어로 옮겨야 해서 기각.

## 9. 관리 링크 모달 자동 노출과 닫기

- **Decision**: 관리 페이지는 `?created` 쿼리가 있을 때만 `ManageLinkModal`을 자동으로 연다. 모달에는
  닫기(X)·바깥 클릭·Esc 닫기가 없고, "링크 복사하기"로 클립보드 복사에 성공하면 모달을 숨기고
  `router.replace`로 쿼리를 제거해 새로고침이나 관리 링크 재접속 시 다시 뜨지 않게 한다(US3-3, US3-6).
  복사가 실패하면 모달을 유지하고, 링크 입력칸을 선택 가능하게 둔 채 "직접 보관했어요" 보조 버튼을
  노출한다(클립보드가 막힌 환경에서 갇히지 않도록).
- **Rationale**: 디자인 요청(Step4)대로 복사를 강제해 관리 링크 분실을 줄이되, 복사 불가 환경의 탈출구는
  남긴다.
  관리 링크(모달에 보여줄 값)는 `window.location.origin + /gender-reveal/manage/{code}`로 만든다.

## 9a. 생성 중 로딩 화면(Step3)

- **Decision**: `StepOneForm`이 `'common' | 'recipients' | 'creating'` 하위 단계를 로컬 state로 관리한다.
  생성 요청 시 `'creating'`으로 바꿔 `BalloonCreatingView`(Figma 258-81, 하트 장식 + "{태명}의 풍선이
  만들어지고 있어요.")를 보여주고, API 응답과 2초 타이머를 `Promise.all`로 함께 기다린 뒤 관리 화면으로
  이동한다. 실패하면 `'recipients'`로 돌아가 오류 문구를 보여준다.
- **Rationale**: 저장이 수백 ms 안에 끝나 화면이 깜빡이는 것을 막고(clarification: 최소 2초), 실패 시 입력값을
  잃지 않는다. 하트 이미지는 기존 `public/img/step2/heart-*.png`를 재사용한다.

## 9b. Step1 디자인 차이

- **Decision**: Figma 258-2의 패스키 영역(`278:31~278:34`)과 사람 아이콘(`278:88`)은 구현하지 않는다.
  받는 사람 칸을 제거하고 제출 버튼 문구를 "받는 사람 입력 >"으로 바꾼다.

## 10. 받는 사람 수 상한

- **Decision**: 상한 10명을 상수(`MAX_RECIPIENTS = 10`)로 두고 클라이언트(`+` 비활성화)와 서버(400
  `INVALID_INPUT`) 양쪽에서 검사한다(FR-002). 받는 사람 이름은 trim 후 1자 이상이어야 하며, 길이 상한은
  기존 규칙(없음)을 유지한다.

## 11. 디자인 자산

- **Decision**: 관리 화면 상단 풍선/하트 일러스트는 기존 `public/img/step2/balloon.png`,
  `heart-pink.png`, `heart-blue.png`를 재사용한다. Figma 258-106의 리본 달린 검은 풍선이 기존 자산과
  다르면 구현 단계에서 Figma에서 내보내 `public/img/manage/`에 추가한다.
- 연장 버튼·만료일 표시는 디자인이 없으므로 행 안에 기존 보조 텍스트 스타일(작은 회색 글씨,
  "삭제" 버튼과 같은 톤)로 배치한다(spec Assumptions).
