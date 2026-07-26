/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from './route';

const insertMock = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: () => ({
    from: () => ({ insert: insertMock }),
  }),
}));

function buildRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/events', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

const validBody = {
  babyNickname: '콩이',
  dueDate: '2026-12-25',
  recipientName: '지민',
  babyGender: 'son',
};

beforeEach(() => {
  insertMock.mockReset();
  insertMock.mockResolvedValue({ error: null });
});

describe('POST /api/events', () => {
  it('4개 필드가 모두 유효하면 201과 id/shareLink/linkExpiresAt을 반환한다', async () => {
    const response = await POST(buildRequest(validBody));
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.id).toEqual(expect.any(String));
    expect(json.shareLink).toContain(`/gender-reveal/${json.id}`);
    expect(json.linkExpiresAt).toEqual(expect.any(String));
    expect(insertMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['babyNickname', { ...validBody, babyNickname: '  ' }],
    ['dueDate', { ...validBody, dueDate: 'not-a-date' }],
    ['recipientName', { ...validBody, recipientName: '' }],
    ['babyGender', { ...validBody, babyGender: 'unknown' }],
  ])('%s가 유효하지 않으면 400을 반환하고 insert를 호출하지 않는다', async (_field, body) => {
    const response = await POST(buildRequest(body));
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json).toEqual({ error: 'INVALID_INPUT' });
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('입력은 유효하지만 저장 중 서버 오류가 나면 500을 반환한다', async () => {
    insertMock.mockResolvedValue({ error: { message: 'db unavailable' } });

    const response = await POST(buildRequest(validBody));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'INTERNAL_ERROR' });
  });
});
