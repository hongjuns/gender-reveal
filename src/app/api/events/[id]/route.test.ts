/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from './route';

const maybeSingleMock = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: maybeSingleMock }),
      }),
    }),
  }),
}));

function buildRequest(id: string) {
  return new NextRequest(`http://localhost:3000/api/events/${id}`);
}

const row = {
  id: 'abc-123',
  baby_nickname: '콩이',
  due_date: '2026-12-25',
  recipient_name: '지민',
  gender: 'son',
  share_link: 'abc-123',
  created_at: '2026-07-18T00:00:00.000Z',
};

beforeEach(() => {
  maybeSingleMock.mockReset();
});

describe('GET /api/events/[id]', () => {
  it('존재하는 유효한 id를 조회하면 200과 저장된 값을 반환한다', async () => {
    maybeSingleMock.mockResolvedValue({
      data: { ...row, link_expires_at: '2999-01-01T00:00:00.000Z' },
      error: null,
    });

    const response = await GET(buildRequest('abc-123'), { params: { id: 'abc-123' } });
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toEqual({
      id: 'abc-123',
      babyNickname: '콩이',
      dueDate: '2026-12-25',
      recipientName: '지민',
      babyGender: 'son',
      shareLink: 'http://localhost:3000/gender-reveal/abc-123',
      createdAt: '2026-07-18T00:00:00.000Z',
      linkExpiresAt: '2999-01-01T00:00:00.000Z',
    });
  });

  it('존재하지 않는 id를 조회하면 404를 반환한다', async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });

    const response = await GET(buildRequest('missing'), { params: { id: 'missing' } });
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'NOT_FOUND' });
  });

  it('조회 중 서버 오류가 나면 500을 반환한다(가짜 404와 구분)', async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: { message: 'db unavailable' } });

    const response = await GET(buildRequest('abc-123'), { params: { id: 'abc-123' } });
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'INTERNAL_ERROR' });
  });

  it('link_expires_at이 과거인 레코드를 조회하면 410을 반환한다', async () => {
    maybeSingleMock.mockResolvedValue({
      data: { ...row, link_expires_at: '2000-01-01T00:00:00.000Z' },
      error: null,
    });

    const response = await GET(buildRequest('abc-123'), { params: { id: 'abc-123' } });
    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({ error: 'LINK_EXPIRED' });
  });

  it('link_expires_at이 7일 이내(미래)면 계속 200을 반환한다', async () => {
    maybeSingleMock.mockResolvedValue({
      data: { ...row, link_expires_at: '2999-01-01T00:00:00.000Z' },
      error: null,
    });

    const response = await GET(buildRequest('abc-123'), { params: { id: 'abc-123' } });
    expect(response.status).toBe(200);
  });
});
