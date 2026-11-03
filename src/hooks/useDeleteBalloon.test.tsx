import { renderHook, waitFor } from '@testing-library/react';
import { useDeleteBalloon } from './useDeleteBalloon';
import { managedBalloonsQueryKey } from './useManagedBalloons';
import { deleteBalloon } from '@/lib/api/manage';
import { buildBalloon, buildGroup, createQueryWrapper } from './managedBalloonTestUtils';

jest.mock('@/lib/api/manage', () => ({ deleteBalloon: jest.fn() }));

const deleteBalloonMock = deleteBalloon as jest.Mock;
const key = managedBalloonsQueryKey('code-1');

beforeEach(() => {
  deleteBalloonMock.mockReset();
});

describe('useDeleteBalloon', () => {
  it('성공하면 캐시 목록에서 해당 풍선을 제거한다', async () => {
    deleteBalloonMock.mockResolvedValue({ status: 'ok' });
    const { Wrapper, queryClient } = createQueryWrapper();
    queryClient.setQueryData(key, buildGroup([buildBalloon({ id: 'a' }), buildBalloon({ id: 'b' })]));

    const { result } = renderHook(() => useDeleteBalloon('code-1'), { wrapper: Wrapper });
    result.current.mutate('a');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteBalloonMock).toHaveBeenCalledWith('code-1', 'a');
    expect(queryClient.getQueryData(key)).toEqual(buildGroup([buildBalloon({ id: 'b' })]));
  });

  it('not_found면 목록을 다시 불러오도록 무효화한다', async () => {
    deleteBalloonMock.mockResolvedValue({ status: 'not_found' });
    const { Wrapper, queryClient } = createQueryWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteBalloon('code-1'), { wrapper: Wrapper });
    result.current.mutate('a');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: key });
  });
});
