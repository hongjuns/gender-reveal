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
  babyGender: 'son',
  recipientNames: ['할머니', ' 삼촌 ', '이모'],
};

interface InsertedRow {
  id: string;
  code: string;
  share_link: string;
  recipient_name: string;
  baby_nickname: string;
  link_expires_at: string;
  created_at: string;
}

function insertedRows(): InsertedRow[] {
  return insertMock.mock.calls[0][0] as InsertedRow[];
}

beforeEach(() => {
  insertMock.mockReset();
  insertMock.mockResolvedValue({ error: null });
});

describe('POST /api/events (일괄 생성)', () => {
  it('받는 사람 수만큼의 풍선을 한 번의 insert로 같은 code·만료 시각으로 만든다', async () => {
    const response = await POST(buildRequest(validBody));
    expect(response.status).toBe(201);

    expect(insertMock).toHaveBeenCalledTimes(1);
    const rows = insertedRows();
    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.recipient_name)).toEqual(['할머니', '삼촌', '이모']);
    expect(new Set(rows.map((row) => row.code)).size).toBe(1);
    expect(new Set(rows.map((row) => row.link_expires_at)).size).toBe(1);
    rows.forEach((row) => {
      expect(row.share_link).toBe(row.id);
      expect(row.code).not.toBe(row.id);
      expect(row.baby_nickname).toBe('콩이');
    });

    // 입력 순서를 보존하기 위해 created_at이 1ms씩 증가한다.
    const times = rows.map((row) => new Date(row.created_at).getTime());
    expect(times[1] - times[0]).toBe(1);
    expect(times[2] - times[1]).toBe(1);
  });

  it('201 응답에 code·manageLink·linkExpiresAt·events(요청 순서)를 담는다', async () => {
    const response = await POST(buildRequest(validBody));
    const json = await response.json();
    const rows = insertedRows();

    expect(json.code).toBe(rows[0].code);
    expect(json.manageLink).toBe(`http://localhost:3000/gender-reveal/manage/${rows[0].code}`);
    expect(json.linkExpiresAt).toBe(rows[0].link_expires_at);
    expect(json.events).toEqual(
      rows.map((row) => ({
        id: row.id,
        recipientName: row.recipient_name,
        shareLink: `http://localhost:3000/gender-reveal/${row.id}`,
      })),
    );
  });

  it.each([
    ['babyNickname 공백', { ...validBody, babyNickname: '  ' }],
    ['dueDate 형식 오류', { ...validBody, dueDate: 'not-a-date' }],
    ['babyGender 오류', { ...validBody, babyGender: 'unknown' }],
    ['recipientNames 0명', { ...validBody, recipientNames: [] }],
    ['recipientNames 11명', { ...validBody, recipientNames: Array.from({ length: 11 }, () => '이름') }],
    ['recipientNames 빈 이름 포함', { ...validBody, recipientNames: ['할머니', ' '] }],
    ['recipientNames 배열 아님', { ...validBody, recipientNames: '할머니' }],
    [
      '기존 단건 바디(recipientName)',
      { babyNickname: '콩이', dueDate: '2026-12-25', babyGender: 'son', recipientName: '지민' },
    ],
  ])('%s이면 400을 반환하고 insert를 호출하지 않는다', async (_label, body) => {
    const response = await POST(buildRequest(body));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'INVALID_INPUT' });
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('저장 중 서버 오류가 나면 500을 반환한다', async () => {
    insertMock.mockResolvedValue({ error: { message: 'db unavailable' } });

    const response = await POST(buildRequest(validBody));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'INTERNAL_ERROR' });
  });
});
