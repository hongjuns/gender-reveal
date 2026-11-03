import { calculateExtendedExpiresAt, calculateLinkExpiresAt, hasBeenExtended, formatKstDate, isLinkExpired, parseDateInputValue } from './date';

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

describe('calculateExtendedExpiresAt', () => {
  const now = new Date('2026-11-03T00:00:00.000Z');

  it('만료 전이면 기존 만료 시각 + 7일', () => {
    const expiresAt = new Date('2026-11-05T12:00:00.000Z');
    expect(calculateExtendedExpiresAt(expiresAt, now).toISOString()).toBe('2026-11-12T12:00:00.000Z');
  });

  it('이미 만료되었으면 연장한 시점 + 7일', () => {
    const expiresAt = new Date('2026-10-01T00:00:00.000Z');
    expect(calculateExtendedExpiresAt(expiresAt, now).toISOString()).toBe('2026-11-10T00:00:00.000Z');
  });

  it('만료 시각과 연장 시점이 같으면 그 시각 + 7일', () => {
    expect(calculateExtendedExpiresAt(now, now).toISOString()).toBe('2026-11-10T00:00:00.000Z');
  });
});

describe('hasBeenExtended', () => {
  const createdAt = new Date('2026-11-03T00:00:00.000Z');

  it('만료 시각이 생성 + 7일 그대로면 연장하지 않은 것', () => {
    expect(hasBeenExtended(new Date('2026-11-10T00:00:00.000Z'), createdAt)).toBe(false);
  });

  it('일괄 생성 시 created_at이 몇 ms 늦어도 연장하지 않은 것으로 본다', () => {
    const laterCreatedAt = new Date(createdAt.getTime() + 9);
    expect(hasBeenExtended(new Date('2026-11-10T00:00:00.000Z'), laterCreatedAt)).toBe(false);
  });

  it('만료 전 연장(생성 + 14일)이면 연장한 것', () => {
    expect(hasBeenExtended(new Date('2026-11-17T00:00:00.000Z'), createdAt)).toBe(true);
  });

  it('만료 후 연장(연장 시점 + 7일)이면 연장한 것', () => {
    const extendedAt = new Date('2026-11-20T00:00:00.000Z');
    expect(hasBeenExtended(calculateExtendedExpiresAt(new Date('2026-11-10T00:00:00.000Z'), extendedAt), createdAt)).toBe(true);
  });
});
