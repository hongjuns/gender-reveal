/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from './route';

const findMaybeSingleMock = jest.fn();
const updateMaybeSingleMock = jest.fn();
const updateMock = jest.fn();
const updateFilters: Array<[string, string, unknown]> = [];

jest.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: () => ({
    from: () => ({
      select: () => {
        const chain = { eq: () => chain, maybeSingle: findMaybeSingleMock };
        return chain;
      },
      update: (values: unknown) => {
        updateMock(values);
        const chain = {
          eq: (column: string, value: unknown) => {
            updateFilters.push(['eq', column, value]);
            return chain;
          },
          select: () => ({ maybeSingle: updateMaybeSingleMock }),
        };
        return chain;
      },
    }),
  }),
}));

const NOW = new Date('2026-11-03T00:00:00.000Z');

function call(code = 'code-1', id = 'a') {
  return POST(new NextRequest(`http://localhost:3000/api/manage/${code}/events/${id}/extend`, { method: 'POST' }), {
    params: { code, id },
  });
}

// 10월 29일 생성 → 기본 만료 11월 5일(생성 + 7일).
const CREATED_AT = '2026-10-29T00:00:00.000Z';

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'a',
    recipient_name: '할머니',
    link_expires_at: '2026-11-05T00:00:00.000Z',
    created_at: CREATED_AT,
    ...overrides,
  };
}

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  findMaybeSingleMock.mockReset();
  updateMaybeSingleMock.mockReset();
  updateMock.mockReset();
  updateFilters.length = 0;
});

afterEach(() => {
  jest.useRealTimers();
});

describe('POST /api/manage/[code]/events/[id]/extend', () => {
  it('만료 전이면 기존 만료 시각 + 7일로 연장하고 갱신된 풍선을 반환한다', async () => {
    findMaybeSingleMock.mockResolvedValue({ data: row(), error: null });
    updateMaybeSingleMock.mockResolvedValue({
      data: row({ link_expires_at: '2026-11-12T00:00:00.000Z' }),
      error: null,
    });

    const response = await call();

    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith({ link_expires_at: '2026-11-12T00:00:00.000Z' });
    // 방금 읽은 만료 시각과 같을 때만 갱신(동시 요청 방지)
    expect(updateFilters).toEqual([
      ['eq', 'id', 'a'],
      ['eq', 'code', 'code-1'],
      ['eq', 'link_expires_at', '2026-11-05T00:00:00.000Z'],
    ]);
    expect(await response.json()).toEqual({
      id: 'a',
      recipientName: '할머니',
      shareLink: 'http://localhost:3000/gender-reveal/a',
      linkExpiresAt: '2026-11-12T00:00:00.000Z',
      isExpired: false,
      canExtend: false,
    });
  });

  it('이미 만료되었으면 연장 시점 + 7일로 연장한다', async () => {
    findMaybeSingleMock.mockResolvedValue({
      data: row({ created_at: '2026-09-24T00:00:00.000Z', link_expires_at: '2026-10-01T00:00:00.000Z' }),
      error: null,
    });
    updateMaybeSingleMock.mockResolvedValue({
      data: row({ created_at: '2026-09-24T00:00:00.000Z', link_expires_at: '2026-11-10T00:00:00.000Z' }),
      error: null,
    });

    const response = await call();

    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ link_expires_at: '2026-11-10T00:00:00.000Z' }),
    );
  });

  it('이미 연장한 풍선(만료 시각 > 생성 + 7일)이면 409를 반환하고 갱신하지 않는다', async () => {
    findMaybeSingleMock.mockResolvedValue({ data: row({ link_expires_at: '2026-11-12T00:00:00.000Z' }), error: null });

    const response = await call();

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'ALREADY_EXTENDED' });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('조건부 갱신이 0행이면(동시 요청에 밀림) 409를 반환한다', async () => {
    findMaybeSingleMock.mockResolvedValue({ data: row(), error: null });
    updateMaybeSingleMock.mockResolvedValue({ data: null, error: null });

    const response = await call();

    expect(response.status).toBe(409);
  });

  it('풍선이 없거나 code가 틀리면 404를 반환한다', async () => {
    findMaybeSingleMock.mockResolvedValue({ data: null, error: null });

    const response = await call('wrong');

    expect(response.status).toBe(404);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('조회 오류면 500을 반환한다', async () => {
    findMaybeSingleMock.mockResolvedValue({ data: null, error: { message: 'db unavailable' } });

    const response = await call();

    expect(response.status).toBe(500);
  });
});
