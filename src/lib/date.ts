import { format } from 'date-fns';

/**
 * KST(UTC+9, 서머타임 없음)는 고정 오프셋이므로 별도 타임존 변환 없이
 * 로컬 날짜 값을 그대로 'YYYY년 MM월 DD일' 형식으로 포맷한다 (research.md #4).
 */
export function formatKstDate(date: Date): string {
  return format(date, 'yyyy년 MM월 dd일');
}

/**
 * <input type="date">의 'YYYY-MM-DD' 값을 UTC로 파싱하면(new Date(value)) 로컬
 * 타임존에 따라 하루가 밀리는 오프바이원 버그가 생길 수 있어, 연/월/일을 직접
 * 분해해 로컬 자정 기준 Date로 생성한다.
 */
export function parseDateInputValue(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const [, yearStr, monthStr, dayStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}
