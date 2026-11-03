import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { calculateLinkExpiresAt, parseDateInputValue } from '@/lib/date';
import { normalizeRecipientNames } from '@/lib/recipients';
import type { BabyGender } from '@/types/genderReveal';

interface CreateEventsBody {
  babyNickname?: unknown;
  dueDate?: unknown;
  babyGender?: unknown;
  recipientNames?: unknown;
}

interface ValidCreateEventsInput {
  babyNickname: string;
  dueDate: string;
  babyGender: BabyGender;
  recipientNames: string[];
}

function parseBody(body: CreateEventsBody): ValidCreateEventsInput | null {
  const recipientNames = normalizeRecipientNames(body.recipientNames);
  if (
    typeof body.babyNickname !== 'string' ||
    body.babyNickname.trim().length === 0 ||
    typeof body.dueDate !== 'string' ||
    parseDateInputValue(body.dueDate) === null ||
    (body.babyGender !== 'son' && body.babyGender !== 'daughter') ||
    recipientNames === null
  ) {
    return null;
  }

  return {
    babyNickname: body.babyNickname.trim(),
    dueDate: body.dueDate,
    babyGender: body.babyGender,
    recipientNames,
  };
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as CreateEventsBody | null;
  const input = body ? parseBody(body) : null;

  if (!input) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  }

  // 묶음 전체가 같은 관리 코드·생성 시각·만료 시각을 갖도록 한 번만 계산한다.
  const code = crypto.randomUUID();
  const createdAt = new Date();
  const linkExpiresAt = calculateLinkExpiresAt(createdAt);

  const rows = input.recipientNames.map((recipientName, index) => {
    const id = crypto.randomUUID();
    return {
      id,
      code,
      baby_nickname: input.babyNickname,
      due_date: input.dueDate,
      recipient_name: recipientName,
      gender: input.babyGender,
      share_link: id,
      link_expires_at: linkExpiresAt.toISOString(),
      // 관리 화면에서 입력 순서대로 정렬되도록 1ms씩 늘린다.
      created_at: new Date(createdAt.getTime() + index).toISOString(),
    };
  });

  // 배열 insert는 단일 INSERT 문이라 전부 성공하거나 전부 실패한다.
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from('gender_reveal_events').insert(rows);

  if (error) {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }

  const origin = request.nextUrl.origin;
  return NextResponse.json(
    {
      code,
      manageLink: `${origin}/gender-reveal/manage/${code}`,
      linkExpiresAt: linkExpiresAt.toISOString(),
      events: rows.map((row) => ({
        id: row.id,
        recipientName: row.recipient_name,
        shareLink: `${origin}/gender-reveal/${row.id}`,
      })),
    },
    { status: 201 },
  );
}
