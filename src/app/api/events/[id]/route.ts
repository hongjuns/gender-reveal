import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { isLinkExpired } from '@/lib/date';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('gender_reveal_events')
    // 관리 코드(code)가 서버 메모리에도 올라오지 않도록 받는 사람에게 필요한 칼럼만 조회한다.
    .select('id, baby_nickname, due_date, recipient_name, gender, link_expires_at, created_at')
    .eq('id', params.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  if (isLinkExpired(new Date(data.link_expires_at))) {
    return NextResponse.json({ error: 'LINK_EXPIRED' }, { status: 410 });
  }

  return NextResponse.json(
    {
      id: data.id,
      babyNickname: data.baby_nickname,
      dueDate: data.due_date,
      recipientName: data.recipient_name,
      babyGender: data.gender,
      shareLink: `${request.nextUrl.origin}/gender-reveal/${data.id}`,
      createdAt: data.created_at,
      linkExpiresAt: data.link_expires_at,
    },
    { status: 200 },
  );
}
