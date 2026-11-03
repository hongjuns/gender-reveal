import { renderHook, waitFor } from '@testing-library/react';
import { useExtendBalloon } from './useExtendBalloon';
import { managedBalloonsQueryKey } from './useManagedBalloons';
import { extendBalloon } from '@/lib/api/manage';
import { buildBalloon, buildGroup, createQueryWrapper } from './managedBalloonTestUtils';

jest.mock('@/lib/api/manage', () => ({ extendBalloon: jest.fn() }));

const extendBalloonMock = extendBalloon as jest.Mock;
const key = managedBalloonsQueryKey('code-1');

beforeEach(() => {
  extendBalloonMock.mockReset();
});

describe('useExtendBalloon', () => {
  it('성공하면 캐시의 해당 풍선을 응답 값으로 교체한다', async () => {
    const extended = buildBalloon({
      id: 'a',
      linkExpiresAt: '2999-01-08T00:00:00.000Z',
      canExtend: false,
    });
    extendBalloonMock.mockResolvedValue({ status: 'ok', balloon: extended });
    const { Wrapper, queryClient } = createQueryWrapper();
    queryClient.setQueryData(key, buildGroup([buildBalloon({ id: 'a' }), buildBalloon({ id: 'b' })]));

    const { result } = renderHook(() => useExtendBalloon('code-1'), { wrapper: Wrapper });
    result.current.mutate('a');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(extendBalloonMock).toHaveBeenCalledWith('code-1', 'a');
    expect(queryClient.getQueryData(key)).toEqual(buildGroup([extended, buildBalloon({ id: 'b' })]));
  });

  it.each(['already_extended', 'not_found'])('%s면 목록을 다시 불러오도록 무효화한다', async (status) => {
    extendBalloonMock.mockResolvedValue({ status });
    const { Wrapper, queryClient } = createQueryWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useExtendBalloon('code-1'), { wrapper: Wrapper });
    result.current.mutate('a');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: key });
  });
});
