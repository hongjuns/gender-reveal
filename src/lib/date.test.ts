import { calculateLinkExpiresAt, formatKstDate, isLinkExpired, parseDateInputValue } from './date';

describe('formatKstDate', () => {
  it("'yyyy년 MM월 dd일' 형식으로 변환한다", () => {
    expect(formatKstDate(new Date(2026, 11, 25))).toBe('2026년 12월 25일');
  });

  it('한 자리 월/일도 앞자리 0을 채워 두 자리로 표시한다', () => {
    expect(formatKstDate(new Date(2026, 0, 5))).toBe('2026년 01월 05일');
  });
});

describe('parseDateInputValue', () => {
  it("'YYYY-MM-DD' 문자열을 로컬 자정 기준 Date로 변환한다(UTC 파싱으로 인한 하루 밀림 방지)", () => {
    const date = parseDateInputValue('2026-12-25');
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(11);
    expect(date?.getDate()).toBe(25);
  });

  it('형식이 올바르지 않으면 null을 반환한다', () => {
    expect(parseDateInputValue('')).toBeNull();
    expect(parseDateInputValue('2026/12/25')).toBeNull();
  });

  it('존재하지 않는 날짜(예: 2월 30일)는 null을 반환한다', () => {
    expect(parseDateInputValue('2026-02-30')).toBeNull();
  });
});

describe('calculateLinkExpiresAt', () => {
  it('생성 시각으로부터 정확히 7일 뒤 시각을 반환한다', () => {
    const createdAt = new Date('2026-07-18T00:00:00.000Z');
    const expiresAt = calculateLinkExpiresAt(createdAt);
    expect(expiresAt.getTime() - createdAt.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

describe('isLinkExpired', () => {
  it('만료 시각 이전이면 false를 반환한다', () => {
    const expiresAt = new Date('2026-07-25T00:00:00.000Z');
    const now = new Date('2026-07-24T23:00:00.000Z');
    expect(isLinkExpired(expiresAt, now)).toBe(false);
  });

  it('만료 시각을 지나면 true를 반환한다', () => {
    const expiresAt = new Date('2026-07-25T00:00:00.000Z');
    const now = new Date('2026-07-25T00:00:01.000Z');
    expect(isLinkExpired(expiresAt, now)).toBe(true);
  });
});
