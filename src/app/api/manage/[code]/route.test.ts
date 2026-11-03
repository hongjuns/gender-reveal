/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from './route';

const orderMock = jest.fn();
const eqMock = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: () => ({
    from: () => ({
      select: () => ({
        eq: (column: string, value: string) => {
          eqMock(column, value);
          return { order: orderMock };
        },
      }),
    }),
  }),
}));

function buildRequest(code: string) {
  return new NextRequest(`http://localhost:3000/api/manage/${code}`);
}

const baseRow = {
  baby_nickname: '콩이',
  due_date: '2026-12-25',
  gender: 'son',
  created_at: '2026-11-03T00:00:00.000Z',
};

beforeEach(() => {
  orderMock.mockReset();
  eqMock.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('GET /api/manage/[code]', () => {
  it('code가 같은 풍선을 생성 순서대로 반환하고 만료·연장 상태를 계산한다', async () => {
    jest.useFakeTimers({ now: new Date('2026-11-12T00:00:00.000Z') });
    orderMock.mockResolvedValue({
      data: [
        // 생성 + 7일 그대로 → 미연장
        { ...baseRow, id: 'a', recipient_name: '할머니', link_expires_at: '2026-11-10T00:00:00.000Z' },
        // 생성 + 14일 → 이미 연장
        { ...baseRow, id: 'b', recipient_name: '삼촌', link_expires_at: '2026-11-17T00:00:00.000Z' },
      ],
      error: null,
    });

    const response = await GET(buildRequest('code-1'), { params: { code: 'code-1' } });
    expect(response.status).toBe(200);
    expect(eqMock).toHaveBeenCalledWith('code', 'code-1');
    expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: true });

    const json = await response.json();
    expect(json).toEqual({
      babyNickname: '콩이',
      dueDate: '2026-12-25',
      babyGender: 'son',
      balloons: [
        {
          id: 'a',
          recipientName: '할머니',
          shareLink: 'http://localhost:3000/gender-reveal/a',
          linkExpiresAt: '2026-11-10T00:00:00.000Z',
          isExpired: true,
          canExtend: true,
        },
        {
          id: 'b',
          recipientName: '삼촌',
          shareLink: 'http://localhost:3000/gender-reveal/b',
          linkExpiresAt: '2026-11-17T00:00:00.000Z',
          isExpired: false,
          canExtend: false,
        },
      ],
    });
    expect(json).not.toHaveProperty('code');
  });

  it('해당 code의 풍선이 없으면 404를 반환한다', async () => {
    orderMock.mockResolvedValue({ data: [], error: null });

    const response = await GET(buildRequest('wrong'), { params: { code: 'wrong' } });
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'NOT_FOUND' });
  });

  it('조회 중 오류가 나면 500을 반환한다', async () => {
    orderMock.mockResolvedValue({ data: null, error: { message: 'db unavailable' } });

    const response = await GET(buildRequest('code-1'), { params: { code: 'code-1' } });
    expect(response.status).toBe(500);
  });
});
