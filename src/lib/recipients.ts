export const MAX_RECIPIENTS = 10;

/**
 * 받는 사람 이름 목록을 검증하고 앞뒤 공백을 제거한다.
 * 배열이 아니거나, 비어 있거나, MAX_RECIPIENTS를 넘거나, 빈 이름이 하나라도 있으면 null.
 * 같은 이름이 여러 번 나오는 것은 허용한다(받는 사람별로 별도 풍선).
 */
export function normalizeRecipientNames(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_RECIPIENTS) {
    return null;
  }

  const names: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') {
      return null;
    }
    const trimmed = item.trim();
    if (trimmed.length === 0) {
      return null;
    }
    names.push(trimmed);
  }
  return names;
}

/** "받는 사람 01" 형식의 두 자리 번호. index는 0부터. */
export function formatRecipientNumber(index: number): string {
  return String(index + 1).padStart(2, '0');
}
