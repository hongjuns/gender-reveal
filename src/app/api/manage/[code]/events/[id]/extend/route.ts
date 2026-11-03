import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { calculateExtendedExpiresAt, hasBeenExtended } from '@/lib/date';
import { toManagedBalloon } from '@/lib/managedBalloon';

const BALLOON_COLUMNS = 'id, recipient_name, link_expires_at, created_at';

/**
 * 풍선 1회 연장. 새 만료 시각 = max(기존 만료 시각, 지금) + 7일.
 * 연장 여부는 link_expires_at > created_at + 7일로 판단하고(별도 칼럼 없음),
 * 방금 읽은 link_expires_at과 같을 때만 갱신해 동시 요청이 와도 한 번만 반영된다(research.md #5).
 */
export async function POST(request: NextRequest, { params }: { params: { code: string; id: string } }) {
  const supabase = getSupabaseServerClient();
  const { data: current, error: findError } = await supabase
    .from('gender_reveal_events')
    .select(BALLOON_COLUMNS)
    .eq('id', params.id)
    .eq('code', params.code)
    .maybeSingle();

  if (findError) {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
  if (!current) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  const currentExpiresAt = new Date(current.link_expires_at);
  if (hasBeenExtended(currentExpiresAt, new Date(current.created_at))) {
    return NextResponse.json({ error: 'ALREADY_EXTENDED' }, { status: 409 });
  }

  const now = new Date();
  const newExpiresAt = calculateExtendedExpiresAt(currentExpiresAt, now);

  const { data: updated, error: updateError } = await supabase
    .from('gender_reveal_events')
    .update({ link_expires_at: newExpiresAt.toISOString() })
    .eq('id', params.id)
    .eq('code', params.code)
    .eq('link_expires_at', current.link_expires_at)
    .select(BALLOON_COLUMNS)
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
  if (!updated) {
    // 조회와 갱신 사이에 다른 요청이 먼저 연장했다.
    return NextResponse.json({ error: 'ALREADY_EXTENDED' }, { status: 409 });
  }

  return NextResponse.json(toManagedBalloon(updated, request.nextUrl.origin, now), { status: 200 });
}
