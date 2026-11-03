import { MAX_RECIPIENTS, formatRecipientNumber, normalizeRecipientNames } from './recipients';

describe('normalizeRecipientNames', () => {
  it('받는 사람 1명이면 trim된 배열을 반환한다', () => {
    expect(normalizeRecipientNames(['  할머니 '])).toEqual(['할머니']);
  });

  it(`최대 ${MAX_RECIPIENTS}명까지 허용한다`, () => {
    const names = Array.from({ length: MAX_RECIPIENTS }, (_, i) => `이름${i}`);
    expect(normalizeRecipientNames(names)).toEqual(names);
  });

  it('같은 이름이 여러 번 있어도 허용한다', () => {
    expect(normalizeRecipientNames(['삼촌', '삼촌'])).toEqual(['삼촌', '삼촌']);
  });

  it.each([
    ['빈 배열', []],
    [`${MAX_RECIPIENTS + 1}명`, Array.from({ length: MAX_RECIPIENTS + 1 }, () => '이름')],
    ['빈 문자열 포함', ['할머니', '']],
    ['공백만 있는 이름 포함', ['할머니', '   ']],
    ['문자열이 아닌 항목 포함', ['할머니', 3]],
    ['배열이 아님', '할머니'],
    ['undefined', undefined],
  ])('%s이면 null을 반환한다', (_label, value) => {
    expect(normalizeRecipientNames(value)).toBeNull();
  });
});

describe('formatRecipientNumber', () => {
  it('0부터 시작하는 index를 두 자리 번호로 만든다', () => {
    expect(formatRecipientNumber(0)).toBe('01');
    expect(formatRecipientNumber(9)).toBe('10');
  });
});
