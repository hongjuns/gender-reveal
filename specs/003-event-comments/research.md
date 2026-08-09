# Research: 결과 화면 댓글 기능

이번 기능은 사용자가 계획 단계 입력에서 테이블 스키마·API 경로·RLS 정책까지 구체적으로
지정했기 때문에, 남아있는 결정은 "그 지시를 002의 기존 컨벤션과 어떻게 정합성 있게
연결할 것인가"에 가깝다. `plan.md` Technical Context에는 `NEEDS CLARIFICATION`이
남지 않는다.

## 1. Supabase 클라이언트: 기존 팩토리 재사용 + 타입만 확장

- **Decision**: `src/lib/supabase/server.ts`에 새 클라이언트 팩토리를 추가하지 않는다.
  대신 파일 내부의 `Database` 타입(`Tables`)에 `gender_reveal_comments` 항목을 추가하고,
  `getSupabaseServerClient()`를 댓글 라우트에서도 그대로 import해 사용한다.
- **Rationale**: 사용자가 "신규 팩토리 생성 금지"를 명시했다. `Database` 타입은 실행
  가능한 클라이언트 인스턴스가 아니라 컴파일 타임 스키마 선언이므로, 이를 확장하는 것은
  "새 팩토리를 만드는 것"이 아니라 기존 팩토리가 새 테이블도 타입-세이프하게 다룰 수
  있도록 넓히는 것이다. 확장하지 않으면 `.from('gender_reveal_comments')` 호출이
  `never`/`any`로 추론되어 타입 안전성이 깨진다.
- **Alternatives considered**: (a) 타입 캐스팅(`as any`)으로 우회 — 헌법 Principle I이
  금지하는 `any` 사용에 해당해 기각. (b) 별도 `commentsSupabaseClient.ts` 팩토리 신설 —
  사용자 지시와 정면으로 충돌해 기각.

## 2. 만료 판정 재사용 방식

- **Decision**: 댓글 테이블에는 만료 관련 컬럼/로직을 두지 않는다. 댓글 GET/POST 라우트
  핸들러는 매 요청마다 `gender_reveal_events`에서 `id`와 `link_expires_at`만 조회한
  뒤(`select('id, link_expires_at').eq('id', eventId).maybeSingle()`), 002가 만든
  `src/lib/date.ts`의 `isLinkExpired()`를 그대로 호출해 판정한다.
- **Rationale**: "만료 판정 로직 중복 구현 금지"는 로직(함수)의 중복을 금지하는 것이지
  조회 자체를 금지하는 것이 아니다. `gender_reveal_events` 테이블/로우를 읽기만 하고
  쓰지 않으므로 FR-009("기존 테이블 변경 금지")도 위반하지 않는다.
- **Alternatives considered**: 댓글 테이블에 `event_expires_at`을 비정규화해 저장 —
  원본과 값이 어긋날 위험(드리프트)이 생기고, 사실상 만료 로직을 댓글 도메인에 다시
  구현하는 것이라 기각.

## 3. API 응답 계약 스타일

- **Decision**: HTTP 레이어는 002와 동일하게 상태 코드 + `{ error: CODE }` 바디를
  쓴다(`404 NOT_FOUND`, `410 LINK_EXPIRED`, `400 INVALID_INPUT`, `500 INTERNAL_ERROR`).
  클라이언트 훅 레이어(`src/lib/api/comments.ts`)에서 이 상태 코드를 판별 유니온
  (`{status:'ok'|'expired'|'not_found'|'invalid', ...}`)으로 변환해 컴포넌트에 넘긴다 —
  `getGenderRevealEvent`가 하는 방식 그대로다.
- **Rationale**: 이미 검증된 패턴을 그대로 따르면 리뷰 부담과 학습 비용이 줄고, 002/003
  두 기능의 에러 처리 방식이 하나로 통일된다.
- **Alternatives considered**: 항상 `200`과 바디 내 상태 필드만으로 응답 — REST 관례와
  002의 기존 계약에서 벗어나 기각.

## 4. 실시간 갱신 여부

- **Decision**: Supabase Realtime 구독을 쓰지 않는다. `useEventComments`는 일반
  `useQuery`로 마운트 시 1회 조회하며, 댓글 등록 성공 시 `useCreateEventComment`의
  `onSuccess`에서 해당 쿼리 캐시를 무효화(또는 낙관적으로 append)해 "즉시 반영"만
  만족시킨다.
- **Rationale**: spec.md Assumptions에서 실시간 자동 갱신은 범위 밖으로 명시했다.
- **Alternatives considered**: 폴링(`refetchInterval`) — 불필요한 트래픽을 유발해
  기각. Realtime 채널 — 범위 밖으로 기각.

## 5. `eventId`를 `ResultReveal`까지 전달하는 경로

- **Decision**: `ResultReveal`에 새 선택적 prop `eventId?: string`을 추가하고, 그 값이
  있을 때만 `CommentSection`을 렌더링한다. `genderRevealStore`에는 id를 추가하지
  않는다. `/gender-reveal/[id]/page.tsx`에서만 `eventId={id}`를 넘기고,
  `/gender-reveal/page.tsx`(공유 링크 없이 로컬로만 도달하는 레거시 경로)는 prop을
  넘기지 않아 자연스럽게 댓글 UI가 나타나지 않는다.
- **Rationale**: 사용자가 `genderRevealStore`를 "절대 수정 금지"로 지정했다. id를
  prop으로만 흘려보내면 스토어를 건드리지 않고도 댓글 기능이 "공유 링크로 접속했는지"를
  구분할 수 있다 — 이는 FR-005/FR-008(참여자·생성자 동등, 만료/미존재 시 숨김)와도
  맞아떨어진다: 애초에 유효한 이벤트가 있는 라우트에서만 `eventId`가 존재한다.
- **Alternatives considered**: 스토어에 `eventId` 필드 추가 — 사용자 지시로 명시적
  기각. URL에서 매번 `useParams()`로 직접 읽기 — `ResultReveal`이 라우팅 컨텍스트에
  결합돼 Storybook/테스트에서 라우터 모킹이 추가로 필요해지므로, prop 주입이 더 단순.

## 6. 캡처(공유 이미지) 영역과 댓글 UI 분리

- **Decision**: `CommentSection`은 `ResultReveal`의 `captureRef`(html2canvas가
  캡처하는 `<div>`) **바깥**에 배치한다.
- **Rationale**: 결과 이미지를 저장/공유할 때 댓글 목록·입력 폼까지 이미지에 함께
  캡처되면 원치 않는 화면이 저장된다. 기존 캡처 로직(`ResultReveal.tsx`)은 건드리지
  않고 새 섹션을 캡처 대상 바깥의 형제 요소로 추가하는 것만으로 이 문제를 피할 수 있다.
- **Alternatives considered**: 캡처 시점에 댓글 섹션을 임시로 `display:none` 처리 —
  기존 캡처 로직에 조건 분기를 추가해야 해 "기존 파일 최소 변경" 원칙과 맞지 않아 기각.

## 7. 검증 이중화(길이/공백) 범위

- **Decision**: `sender_name`/`content`의 "비어있음·공백만·길이 초과" 검증은 (a) DB
  CHECK 제약(`btrim(...) <> ''`, `varchar(20)`/`varchar(100)`)과 (b) API 라우트의
  사전 검증(`400 INVALID_INPUT`) 양쪽에 둔다.
- **Rationale**: 이 검증은 "만료 판정 로직"이 아니라 입력값 검증이며, 사용자가 데이터
  모델 절에서 DB 레벨 CHECK 제약을 명시적으로 요구했다. API 레벨 사전 검증이 없으면
  DB 제약 위반 시 Supabase가 돌려주는 500류 에러를 그대로 노출하게 되어 FR-006(무엇이
  누락됐는지 안내)을 만족할 수 없다.
- **Alternatives considered**: DB 제약만 두고 API는 그대로 통과시켜 DB 에러를 파싱 —
  에러 코드 파싱이 취약(Supabase/Postgres 에러 문자열에 의존)해 기각.
