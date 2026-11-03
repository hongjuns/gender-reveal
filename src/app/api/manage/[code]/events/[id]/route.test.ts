/**
 * @jest-environment node
 */
import { DELETE } from './route';

const selectMock = jest.fn();
const eqCalls: Array<[string, string]> = [];

jest.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: () => ({
    from: () => ({
      delete: () => {
        const chain = {
          eq: (column: string, value: string) => {
            eqCalls.push([column, value]);
            return chain;
          },
          select: selectMock,
        };
        return chain;
      },
    }),
  }),
}));

function call(code: string, id: string) {
  return DELETE(new Request(`http://localhost:3000/api/manage/${code}/events/${id}`, { method: 'DELETE' }), {
    params: { code, id },
  });
}

beforeEach(() => {
  selectMock.mockReset();
  eqCalls.length = 0;
});

describe('DELETE /api/manage/[code]/events/[id]', () => {
  it('id와 code가 모두 일치하는 조건으로 삭제하고 204를 반환한다', async () => {
    selectMock.mockResolvedValue({ data: [{ id: 'a' }], error: null });

    const response = await call('code-1', 'a');

    expect(response.status).toBe(204);
    expect(eqCalls).toEqual([
      ['id', 'a'],
      ['code', 'code-1'],
    ]);
  });

  it('삭제된 행이 없으면(코드 불일치 또는 없음) 404를 반환한다', async () => {
    selectMock.mockResolvedValue({ data: [], error: null });

    const response = await call('wrong', 'a');

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'NOT_FOUND' });
  });

  it('오류가 나면 500을 반환한다', async () => {
    selectMock.mockResolvedValue({ data: null, error: { message: 'db unavailable' } });

    const response = await call('code-1', 'a');

    expect(response.status).toBe(500);
  });
});
