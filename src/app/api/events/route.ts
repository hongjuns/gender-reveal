import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { calculateLinkExpiresAt, parseDateInputValue } from '@/lib/date';
import type { BabyGender } from '@/types/genderReveal';

interface CreateEventBody {
  babyNickname?: unknown;
  dueDate?: unknown;
  recipientName?: unknown;
  babyGender?: unknown;
}

function isValidBody(body: CreateEventBody): body is {
  babyNickname: string;
  dueDate: string;
  recipientName: string;
  babyGender: BabyGender;
} {
  return (
    typeof body.babyNickname === 'string' &&
    body.babyNickname.trim().length > 0 &&
    typeof body.dueDate === 'string' &&
    parseDateInputValue(body.dueDate) !== null &&
    typeof body.recipientName === 'string' &&
    body.recipientName.trim().length > 0 &&
    (body.babyGender === 'son' || body.babyGender === 'daughter')
  );
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as CreateEventBody | null;

  if (!body || !isValidBody(body)) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const createdAt = new Date();
  const linkExpiresAt = calculateLinkExpiresAt(createdAt);

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from('gender_reveal_events').insert({
    id,
    baby_nickname: body.babyNickname.trim(),
    due_date: body.dueDate,
    recipient_name: body.recipientName.trim(),
    gender: body.babyGender,
    share_link: id,
    link_expires_at: linkExpiresAt.toISOString(),
    created_at: createdAt.toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }

  return NextResponse.json(
    {
      id,
      shareLink: `${request.nextUrl.origin}/gender-reveal/${id}`,
      linkExpiresAt: linkExpiresAt.toISOString(),
    },
    { status: 201 },
  );
}
