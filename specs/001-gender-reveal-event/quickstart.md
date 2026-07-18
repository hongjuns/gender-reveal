# Quickstart: 젠더리빌(Gender Reveal) 이벤트 웹 애플리케이션 검증 가이드

이 문서는 구현이 끝난 뒤 기능이 spec.md의 요구사항대로 동작하는지 수동/자동으로 확인하는 절차다.
모델·컴포넌트 세부 구현은 [data-model.md](./data-model.md), [contracts/gender-reveal-store.md]
(./contracts/gender-reveal-store.md)를 참고한다.

## Prerequisites

- Node.js (프로젝트 `package.json`에 명시된 버전), `npm install` 완료
- `public/img/001.png`, `public/img/002.png`, `public/img/003.png` 자산 존재 (research.md #5에
  따라 모두 소문자 경로)

## 자동 검증 (Jest)

```bash
npm run lint          # ESLint(eslint-config-next) 통과 확인 (Constitution Principle VI)
npm test              # StepOneForm / BalloonStage / ResultReveal / genderRevealStore / date 유틸
```

**기대 결과**: 모든 테스트 통과. 특히 다음 케이스가 포함되어야 한다.
- `touchBalloon()`을 10회 초과 호출해도 `touchCount`가 10을 넘지 않는다(FR-006, FR-008).
- 4개 입력 필드 중 하나라도 비운 채 `setInput()`을 호출하면 `{ ok: false }`가 반환되고 상태가
  바뀌지 않는다(FR-002).
- `restart()` 호출 후 `input`은 그대로, `touchCount`는 0, `step`은 `'interaction'`이다(FR-015).

## 수동 검증 (개발 서버)

```bash
npm run dev
# http://localhost:3000/gender-reveal 접속
```

1. **Step 1 필수값 검증**: 아무 값도 입력하지 않고 '시작하기' 클릭 → '정보를 모두 입력해주세요'
   메시지가 노출되고 화면이 전환되지 않는지 확인(SC-002).
2. **Step 1 정상 흐름**: 태명 "콩이", 출산 예정일 임의 미래 날짜, 받는 사람 "지민", 성별 '아들'을
   입력 후 '시작하기' 클릭 → Step 2로 전환되고 "'콩이'은 아들일까요? 딸일까요?" 문구와 검정 풍선
   (`img/001.png`)이 보이는지 확인(FR-004).
3. **풍선 터치 피드백**: 풍선을 1~9회 터치하며 매 회 시각적 피드백(흔들림/확대)이 즉시 나타나는지
   확인(FR-005).
4. **10번째 터치 및 전환**: 10번째 터치에서 터짐 이펙트가 재생되고 자동으로 Step 3(결과 화면)로
   전환되는지 확인(FR-007). 결과 화면에 `img/002.png`와 "지민님! '콩이'이는 '아들'이에요!
   [YYYY년 MM월 DD일]에 건강하게 만나요!" 문구가 입력값과 일치하는지 확인(FR-009, SC-005).
5. **연타 안정성**: 새 세션에서 Step 2 진입 후 풍선을 매우 빠르게(예: 20회 이상) 연타 → 정확히
   10번째 터치에서만 전환되고 스크립트 오류가 없는지 확인(SC-003).
6. **다시 시작하기**: Step 3에서 '다시 시작하기' 클릭 → Step 2로 돌아가고 태명·받는 사람·예정일·
   성별이 그대로 유지된 채 풍선을 다시 10번 터치해야 하는지 확인(FR-015).
7. **딸 분기**: 성별을 '딸'로 바꿔 전체 흐름을 반복 → `img/003.png`와 '딸' 문구가 노출되는지
   확인(FR-010).
8. **반응형 확인**: 브라우저 개발자 도구에서 모바일(폭 320px 전후) / 태블릿 / 데스크톱 폭으로
   전환하며 텍스트·이미지가 잘리거나 겹치지 않는지 확인(SC-004).
9. **스켈레톤 UI 확인**: 느린 네트워크(개발자 도구 throttling)에서 화면 전환 시 전체 화면 스피너
   대신 해당 영역에 스켈레톤이 노출되는지 확인(FR-014).

## Storybook 확인

```bash
npm run storybook
```

`StepOneForm`, `BalloonStage`, `ResultReveal` 스토리에서 각 컴포넌트의 주요 상태(빈 폼/채워진 폼,
터치 0·9·10회, 아들·딸 결과)가 개별 스토리로 노출되는지 확인한다(Constitution Principle VI).
