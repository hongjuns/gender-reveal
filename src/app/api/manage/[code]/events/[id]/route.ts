import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

/**
 * 풍선 삭제. id와 관리 코드가 모두 일치하는 행만 단일 조건부 쿼리로 지운다.
 * 코드가 틀린 경우와 풍선이 없는 경우를 구분하지 않고 404로 응답한다(FR-010).
 * 댓글은 FK(on delete cascade)로 함께 삭제된다.
 */
export async function DELETE(_request: Request, { params }: { params: { code: string; id: string } }) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('gender_reveal_events')
    .delete()
    .eq('id', params.id)
    .eq('code', params.code)
    .select('id');

  if (error || !data) {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
  if (data.length === 0) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
