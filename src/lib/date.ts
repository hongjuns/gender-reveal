import { addDays, isAfter, format, max } from 'date-fns';

const LINK_VALIDITY_DAYS = 7;

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

/**
 * 공유 링크의 만료 시각(생성 시각 + 7일)을 계산한다. KST는 서머타임이 없는 고정
 * UTC+9라 서버의 로컬 타임존과 무관하게 순수 시간 간격(7일) 계산으로 충분하다
 * (research.md #4).
 */
export function calculateLinkExpiresAt(createdAt: Date): Date {
  return addDays(createdAt, LINK_VALIDITY_DAYS);
}

export function isLinkExpired(linkExpiresAt: Date, now: Date = new Date()): boolean {
  return isAfter(now, linkExpiresAt);
}

/**
 * 풍선 1회 연장 시 새 만료 시각. 만료 전이면 기존 만료 시각 + 7일,
 * 이미 만료되었으면 연장한 시점 + 7일 (spec Clarifications, research.md #5).
 */
/**
 * 이미 1회 연장한 풍선인지. 생성 시 만료 시각은 항상 생성 + 7일이고, 연장하면 그보다 늦어지므로
 * 별도 칼럼 없이 만료 시각이 생성 + 7일을 넘는지로 판단한다.
 */
export function hasBeenExtended(linkExpiresAt: Date, createdAt: Date): boolean {
  return isAfter(linkExpiresAt, calculateLinkExpiresAt(createdAt));
}

export function calculateExtendedExpiresAt(linkExpiresAt: Date, now: Date = new Date()): Date {
  return addDays(max([linkExpiresAt, now]), LINK_VALIDITY_DAYS);
}
