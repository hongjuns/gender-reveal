# Quickstart: 여러 풍선 생성 및 관리 링크 검증

## Prerequisites

- 브랜치 `feature/v3`, `.env.local`에 Supabase 변수 설정(`.env.example` 참고)
- Supabase SQL Editor에서 마이그레이션 적용: `0005_event_code_and_extension.sql` → `0006_events_anon_update_delete_policies.sql`
- `npm install`

## 자동 검증

```bash
npx tsc --noEmit
npm run lint
npm test            # 신규/변경 route·hook·component·date 테스트 포함
npm run storybook   # 신규 컴포넌트 스토리 확인
```

## 수동 시나리오 (`npm run dev` → http://localhost:3000/gender-reveal)

| # | 시나리오 | 기대 결과 | 관련 |
|---|----------|-----------|------|
| 1 | 태명·예정일·성별 입력 → "받는 사람 입력" → `+`로 3칸 → 이름 입력 → 만들기 | "{태명}의 풍선이 만들어지고 있어요." 최소 2초 → 관리 화면, 관리 링크 모달 자동 노출, 목록 01~03 | US1, US3 |
| 1a | Step1 화면 확인 | 패스키 영역·사람 아이콘 없음 | Assumptions |
| 2 | 받는 사람 10칸까지 추가 | 10칸에서 `+` 비활성화 | FR-002 |
| 3 | 02번 칸 X | 칸 제거, 번호 01·02로 재정렬, 입력값 유지 | US1-3 |
| 4 | 받는 사람 화면에서 뒤로 가기 후 다시 다음 | 공통 정보·받는 사람 입력값 유지 | Assumptions |
| 5 | 모달 바깥 클릭·Esc | 모달 유지(X 버튼 없음) | US3-3 |
| 5a | 모달에서 "링크 복사하기" → 새로고침 | 복사 즉시 모달 사라짐, 새로고침해도 다시 안 뜸, URL에 `?created` 없음 | US3-3, US3-6 |
| 5b | 생성 API 실패 상황(네트워크 오프라인)에서 만들기 | 로딩 후 받는 사람 화면으로 복귀, 입력값 유지, 오류 안내 | US1-7 |
| 6 | 새 시크릿 창에서 관리 링크 접속 | 같은 목록 표시 | US3-5, SC-003 |
| 7 | 02번 "링크 복사하기" → 새 창에서 열기 | 02번 받는 사람 이름으로 풍선 흐름 동작 | US2 |
| 8 | 7번 화면의 네트워크 응답·페이지 소스에서 관리 코드 검색 | 0건 | FR-009, SC-004 |
| 9 | 03번 삭제 → 확인 | 목록에서 제거, 03번 공유 링크는 404 | US4 |
| 10 | 01번 연장 | 만료일 +7일, 버튼 "연장 완료"로 비활성화 | US5-2 |
| 11 | DB에서 한 풍선의 `link_expires_at`을 과거로 수정 → 관리 화면 새로고침 → 연장 | "만료됨" 표시 → 연장 후 만료일 = 오늘+7일, 공유 링크 다시 열림 | US5-5, US5-6 |
| 12 | 존재하지 않는 코드로 `/gender-reveal/manage/xxx` 접속 | 찾을 수 없는 페이지 | US3-7 |
| 13 | 틀린 code로 `curl -X DELETE /api/manage/wrong/events/{id}` | 404, 풍선 유지 | FR-010, SC-005 |
| 14 | 같은 풍선에 연장 요청 2번 (`curl -X POST …/extend`) | 두 번째 409, 만료일 변화 없음 | FR-022, SC-006 |
| 15 | v3 이전에 만든 풍선의 공유 링크 접속 | 기존과 동일하게 동작 | FR-025, SC-007 |
