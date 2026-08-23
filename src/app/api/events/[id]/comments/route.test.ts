/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from './route';

const eventMaybeSingleMock = jest.fn();
const commentSingleMock = jest.fn();
const commentsOrderMock = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: () => ({
    from: (table: string) => {
      if (table === 'gender_reveal_events') {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: eventMaybeSingleMock }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({ order: commentsOrderMock }),
        }),
        insert: () => ({
          select: () => ({ single: commentSingleMock }),
        }),
      };
    },
  }),
}));

function buildGetRequest(id: string) {
  return new NextRequest(`http://localhost:3000/api/events/${id}/comments`);
}

function buildRequest(id: string, body: unknown) {
  return new NextRequest(`http://localhost:3000/api/events/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

const validEvent = {
  id: 'event-1',
  link_expires_at: '2999-01-01T00:00:00.000Z',
};

const validBody = { senderName: '지민', content: '축하해요' };

beforeEach(() => {
  eventMaybeSingleMock.mockReset();
  commentSingleMock.mockReset();
  commentsOrderMock.mockReset();
});

describe('GET /api/events/[id]/comments', () => {
  it('존재하지 않는 id면 404를 반환한다', async () => {
    eventMaybeSingleMock.mockResolvedValue({ data: null, error: null });

    const response = await GET(buildGetRequest('missing'), { params: { id: 'missing' } });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'NOT_FOUND' });
  });

  it('만료된 이벤트면 410을 반환한다', async () => {
    eventMaybeSingleMock.mockResolvedValue({
      data: { ...validEvent, link_expires_at: '2000-01-01T00:00:00.000Z' },
      error: null,
    });

    const response = await GET(buildGetRequest('event-1'), { params: { id: 'event-1' } });

    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({ error: 'LINK_EXPIRED' });
  });

  it('유효한 이벤트면 200과 created_at DESC로 정렬된 댓글 배열을 반환한다', async () => {
    eventMaybeSingleMock.mockResolvedValue({ data: validEvent, error: null });
    commentsOrderMock.mockResolvedValue({
      data: [
        {
          id: 'comment-2',
          event_id: 'event-1',
          sender_name: '민수',
          content: '축하!',
          created_at: '2026-08-09T01:00:00.000Z',
        },
        {
          id: 'comment-1',
          event_id: 'event-1',
          sender_name: '지민',
          content: '축하해요',
          created_at: '2026-08-09T00:00:00.000Z',
        },
      ],
      error: null,
    });

    const response = await GET(buildGetRequest('event-1'), { params: { id: 'event-1' } });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      comments: [
        { id: 'comment-2', senderName: '민수', content: '축하!', createdAt: '2026-08-09T01:00:00.000Z' },
        { id: 'comment-1', senderName: '지민', content: '축하해요', createdAt: '2026-08-09T00:00:00.000Z' },
      ],
    });
    expect(commentsOrderMock).toHaveBeenCalledWith('created_at', { ascending: false });
  });
});

describe('POST /api/events/[id]/comments', () => {
  it('존재하지 않는 id면 404를 반환하고 댓글을 저장하지 않는다', async () => {
    eventMaybeSingleMock.mockResolvedValue({ data: null, error: null });

    const response = await POST(buildRequest('missing', validBody), {
      params: { id: 'missing' },
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'NOT_FOUND' });
    expect(commentSingleMock).not.toHaveBeenCalled();
  });

  it('만료된 이벤트면 410을 반환하고 댓글을 저장하지 않는다', async () => {
    eventMaybeSingleMock.mockResolvedValue({
      data: { ...validEvent, link_expires_at: '2000-01-01T00:00:00.000Z' },
      error: null,
    });

    const response = await POST(buildRequest('event-1', validBody), {
      params: { id: 'event-1' },
    });

    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({ error: 'LINK_EXPIRED' });
    expect(commentSingleMock).not.toHaveBeenCalled();
  });

  it.each([
    ['senderName 공백', { ...validBody, senderName: '   ' }],
    ['senderName 20자 초과', { ...validBody, senderName: '가'.repeat(21) }],
    ['content 공백', { ...validBody, content: '' }],
    ['content 100자 초과', { ...validBody, content: '가'.repeat(101) }],
  ])('%s면 400을 반환하고 댓글을 저장하지 않는다', async (_label, body) => {
    eventMaybeSingleMock.mockResolvedValue({ data: validEvent, error: null });

    const response = await POST(buildRequest('event-1', body), {
      params: { id: 'event-1' },
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'INVALID_INPUT' });
    expect(commentSingleMock).not.toHaveBeenCalled();
  });

  it('모두 유효하면 201과 저장된 댓글을 반환한다', async () => {
    eventMaybeSingleMock.mockResolvedValue({ data: validEvent, error: null });
    commentSingleMock.mockResolvedValue({
      data: {
        id: 'comment-1',
        event_id: 'event-1',
        sender_name: '지민',
        content: '축하해요',
        created_at: '2026-08-09T00:00:00.000Z',
      },
      error: null,
    });

    const response = await POST(buildRequest('event-1', validBody), {
      params: { id: 'event-1' },
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: 'comment-1',
      senderName: '지민',
      content: '축하해요',
      createdAt: '2026-08-09T00:00:00.000Z',
    });
  });

  it('저장 중 서버 오류가 나면 500을 반환한다', async () => {
    eventMaybeSingleMock.mockResolvedValue({ data: validEvent, error: null });
    commentSingleMock.mockResolvedValue({ data: null, error: { message: 'db unavailable' } });

    const response = await POST(buildRequest('event-1', validBody), {
      params: { id: 'event-1' },
    });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'INTERNAL_ERROR' });
  });
});
