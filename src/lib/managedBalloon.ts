import { hasBeenExtended, isLinkExpired } from '@/lib/date';
import type { ManagedBalloon } from '@/types/genderReveal';

export interface ManagedBalloonSourceRow {
  id: string;
  recipient_name: string;
  link_expires_at: string;
  created_at: string;
}

/** 관리 API 응답용 변환. 관리 코드(code)는 포함하지 않는다. */
export function toManagedBalloon(
  row: ManagedBalloonSourceRow,
  origin: string,
  now: Date = new Date(),
): ManagedBalloon {
  const linkExpiresAt = new Date(row.link_expires_at);
  return {
    id: row.id,
    recipientName: row.recipient_name,
    shareLink: `${origin}/gender-reveal/${row.id}`,
    linkExpiresAt: row.link_expires_at,
    isExpired: isLinkExpired(linkExpiresAt, now),
    canExtend: !hasBeenExtended(linkExpiresAt, new Date(row.created_at)),
  };
}
