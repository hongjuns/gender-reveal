import { listEventComments, createEventComment } from './comments';
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

describe('listEventComments', () => {
  it('200 응답을 ok 상태로 매핑한다', async () => {
    const comments = [{ id: 'c1', senderName: '지민', content: '축하해요', createdAt: '2026-08-09T00:00:00.000Z' }];
    getMock.mockResolvedValue({ status: 200, data: { comments } });

    const result = await listEventComments('event-1');

    expect(result).toEqual({ status: 'ok', comments });
  });

  it('404 응답을 not_found 상태로 매핑한다', async () => {
    getMock.mockResolvedValue({ status: 404, data: { error: 'NOT_FOUND' } });

    const result = await listEventComments('missing');

    expect(result).toEqual({ status: 'not_found' });
  });

  it('410 응답을 expired 상태로 매핑한다', async () => {
    getMock.mockResolvedValue({ status: 410, data: { error: 'LINK_EXPIRED' } });

    const result = await listEventComments('event-1');

    expect(result).toEqual({ status: 'expired' });
  });
});

describe('createEventComment', () => {
  const input = { senderName: '지민', content: '축하해요' };

  it('201 응답을 ok 상태로 매핑한다', async () => {
    const comment = { id: 'c1', senderName: '지민', content: '축하해요', createdAt: '2026-08-09T00:00:00.000Z' };
    postMock.mockResolvedValue({ status: 201, data: comment });

    const result = await createEventComment('event-1', input);

    expect(result).toEqual({ status: 'ok', comment });
  });

  it('400 응답을 invalid 상태로 매핑한다', async () => {
    postMock.mockResolvedValue({ status: 400, data: { error: 'INVALID_INPUT' } });

    const result = await createEventComment('event-1', input);

    expect(result).toEqual({ status: 'invalid', message: expect.any(String) });
  });

  it('404 응답을 not_found 상태로 매핑한다', async () => {
    postMock.mockResolvedValue({ status: 404, data: { error: 'NOT_FOUND' } });

    const result = await createEventComment('missing', input);

    expect(result).toEqual({ status: 'not_found' });
  });

  it('410 응답을 expired 상태로 매핑한다', async () => {
    postMock.mockResolvedValue({ status: 410, data: { error: 'LINK_EXPIRED' } });

    const result = await createEventComment('event-1', input);

    expect(result).toEqual({ status: 'expired' });
  });
});
