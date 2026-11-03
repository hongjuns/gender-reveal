import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { toManagedBalloon } from '@/lib/managedBalloon';

export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('gender_reveal_events')
    .select('id, baby_nickname, due_date, gender, recipient_name, link_expires_at, created_at')
    .eq('code', params.code)
    .order('created_at', { ascending: true });

  if (error || !data) {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
  if (data.length === 0) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  const [first] = data;
  const origin = request.nextUrl.origin;
  const now = new Date();

  return NextResponse.json(
    {
      babyNickname: first.baby_nickname,
      dueDate: first.due_date,
      babyGender: first.gender,
      balloons: data.map((row) => toManagedBalloon(row, origin, now)),
    },
    { status: 200 },
  );
}
