import { deleteBalloon, extendBalloon, getManagedGroup } from './manage';
import { apiClient } from './client';

jest.mock('./client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

const getMock = apiClient.get as jest.Mock;
const postMock = apiClient.post as jest.Mock;
const deleteMock = apiClient.delete as jest.Mock;

beforeEach(() => {
  getMock.mockReset();
  postMock.mockReset();
  deleteMock.mockReset();
});

describe('getManagedGroup', () => {
  it('200 응답을 ok로 매핑한다', async () => {
    const group = { babyNickname: '콩이', balloons: [] };
    getMock.mockResolvedValue({ status: 200, data: group });

    await expect(getManagedGroup('code-1')).resolves.toEqual({ status: 'ok', group });
    expect(getMock).toHaveBeenCalledWith('/manage/code-1', expect.any(Object));
  });

  it('404 응답을 not_found로 매핑한다', async () => {
    getMock.mockResolvedValue({ status: 404, data: { error: 'NOT_FOUND' } });

    await expect(getManagedGroup('wrong')).resolves.toEqual({ status: 'not_found' });
  });
});

describe('deleteBalloon', () => {
  it('204 응답을 ok로 매핑한다', async () => {
    deleteMock.mockResolvedValue({ status: 204 });

    await expect(deleteBalloon('code-1', 'a')).resolves.toEqual({ status: 'ok' });
    expect(deleteMock).toHaveBeenCalledWith('/manage/code-1/events/a', expect.any(Object));
  });

  it('404 응답을 not_found로 매핑한다', async () => {
    deleteMock.mockResolvedValue({ status: 404 });

    await expect(deleteBalloon('code-1', 'a')).resolves.toEqual({ status: 'not_found' });
  });
});

describe('extendBalloon', () => {
  it('200 응답을 ok로 매핑한다', async () => {
    const balloon = { id: 'a', canExtend: false };
    postMock.mockResolvedValue({ status: 200, data: balloon });

    await expect(extendBalloon('code-1', 'a')).resolves.toEqual({ status: 'ok', balloon });
    expect(postMock).toHaveBeenCalledWith('/manage/code-1/events/a/extend', undefined, expect.any(Object));
  });

  it('409 응답을 already_extended로 매핑한다', async () => {
    postMock.mockResolvedValue({ status: 409 });

    await expect(extendBalloon('code-1', 'a')).resolves.toEqual({ status: 'already_extended' });
  });

  it('404 응답을 not_found로 매핑한다', async () => {
    postMock.mockResolvedValue({ status: 404 });

    await expect(extendBalloon('code-1', 'a')).resolves.toEqual({ status: 'not_found' });
  });
});
