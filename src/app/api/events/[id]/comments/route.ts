import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { isLinkExpired } from '@/lib/date';

const SENDER_NAME_MAX_LENGTH = 20;
const CONTENT_MAX_LENGTH = 100;

interface CreateCommentBody {
  senderName?: unknown;
  content?: unknown;
}

function isValidBody(
  body: CreateCommentBody,
): body is { senderName: string; content: string } {
  return (
    typeof body.senderName === 'string' &&
    body.senderName.trim().length > 0 &&
    body.senderName.trim().length <= SENDER_NAME_MAX_LENGTH &&
    typeof body.content === 'string' &&
    body.content.trim().length > 0 &&
    body.content.trim().length <= CONTENT_MAX_LENGTH
  );
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseServerClient();
  const { data: event, error: eventError } = await supabase
    .from('gender_reveal_events')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (eventError) {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
  if (!event) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }
  if (isLinkExpired(new Date(event.link_expires_at))) {
    return NextResponse.json({ error: 'LINK_EXPIRED' }, { status: 410 });
  }

  const { data, error } = await supabase
    .from('gender_reveal_comments')
    .select('*')
    .eq('event_id', params.id)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }

  return NextResponse.json(
    {
      comments: data.map((row) => ({
        id: row.id,
        senderName: row.sender_name,
        content: row.content,
        createdAt: row.created_at,
      })),
    },
    { status: 200 },
  );
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseServerClient();
  const { data: event, error: eventError } = await supabase
    .from('gender_reveal_events')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (eventError) {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
  if (!event) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }
  if (isLinkExpired(new Date(event.link_expires_at))) {
    return NextResponse.json({ error: 'LINK_EXPIRED' }, { status: 410 });
  }

  const body = (await request.json().catch(() => null)) as CreateCommentBody | null;
  if (!body || !isValidBody(body)) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('gender_reveal_comments')
    .insert({
      event_id: params.id,
      sender_name: body.senderName.trim(),
      content: body.content.trim(),
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }

  return NextResponse.json(
    {
      id: data.id,
      senderName: data.sender_name,
      content: data.content,
      createdAt: data.created_at,
    },
    { status: 201 },
  );
}
