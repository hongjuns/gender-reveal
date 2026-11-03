import { createGenderRevealEvent, getGenderRevealEvent } from './events';
import { apiClient } from './client';

jest.mock('./client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

const getMock = apiClient.get as jest.Mock;
const postMock = apiClient.post as jest.Mock;

beforeEach(() => {
  getMock.mockReset();
  postMock.mockReset();
});

describe('createGenderRevealEvent', () => {
  it('받는 사람 목록을 담아 /events로 POST하고 응답 본문을 반환한다', async () => {
    const response = {
      code: 'code-1',
      manageLink: 'http://localhost/gender-reveal/manage/code-1',
      linkExpiresAt: '2026-11-10T00:00:00.000Z',
      events: [{ id: 'a', recipientName: '할머니', shareLink: 'http://localhost/gender-reveal/a' }],
    };
    postMock.mockResolvedValue({ data: response });
    const input = {
      babyNickname: '콩이',
      dueDate: '2026-12-25',
      babyGender: 'son' as const,
      recipientNames: ['할머니'],
    };

    await expect(createGenderRevealEvent(input)).resolves.toEqual(response);
    expect(postMock).toHaveBeenCalledWith('/events', input);
  });
});

describe('getGenderRevealEvent', () => {
  it('200 응답을 ok 상태로 매핑한다', async () => {
    const event = { id: 'abc-123', babyNickname: '콩이' };
    getMock.mockResolvedValue({ status: 200, data: event });

    const result = await getGenderRevealEvent('abc-123');

    expect(result).toEqual({ status: 'ok', event });
  });

  it('404 응답을 not_found 상태로 매핑한다', async () => {
    getMock.mockResolvedValue({ status: 404, data: { error: 'NOT_FOUND' } });

    const result = await getGenderRevealEvent('missing');

    expect(result).toEqual({ status: 'not_found' });
  });

  it('410 응답을 expired 상태로 매핑한다', async () => {
    getMock.mockResolvedValue({ status: 410, data: { error: 'LINK_EXPIRED' } });

    const result = await getGenderRevealEvent('abc-123');

    expect(result).toEqual({ status: 'expired' });
  });
});
