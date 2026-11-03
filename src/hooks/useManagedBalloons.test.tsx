import { renderHook, waitFor } from '@testing-library/react';
import { managedBalloonsQueryKey, useManagedBalloons } from './useManagedBalloons';
import { getManagedGroup } from '@/lib/api/manage';
import { buildBalloon, buildGroup, createQueryWrapper } from './managedBalloonTestUtils';

jest.mock('@/lib/api/manage', () => ({ getManagedGroup: jest.fn() }));

const getManagedGroupMock = getManagedGroup as jest.Mock;

beforeEach(() => {
  getManagedGroupMock.mockReset();
});

describe('useManagedBalloons', () => {
  it("['managed-balloons', code] 키로 묶음을 조회한다", async () => {
    const group = buildGroup([buildBalloon()]);
    getManagedGroupMock.mockResolvedValue(group);
    const { Wrapper, queryClient } = createQueryWrapper();

    const { result } = renderHook(() => useManagedBalloons('code-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getManagedGroupMock).toHaveBeenCalledWith('code-1');
    expect(queryClient.getQueryData(managedBalloonsQueryKey('code-1'))).toEqual(group);
  });

  it('code가 비어 있으면 조회하지 않는다', () => {
    const { Wrapper } = createQueryWrapper();

    renderHook(() => useManagedBalloons(''), { wrapper: Wrapper });

    expect(getManagedGroupMock).not.toHaveBeenCalled();
  });
});
