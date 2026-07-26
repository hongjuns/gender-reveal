import { getGenderRevealEvent } from './events';
import { apiClient } from './client';

jest.mock('./client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

const getMock = apiClient.get as jest.Mock;

beforeEach(() => {
  getMock.mockReset();
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
