import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useEventComments } from './useEventComments';
import { listEventComments } from '@/lib/api/comments';

jest.mock('@/lib/api/comments', () => ({
  listEventComments: jest.fn(),
}));

const listEventCommentsMock = listEventComments as jest.Mock;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

beforeEach(() => {
  listEventCommentsMock.mockReset();
});

describe('useEventComments', () => {
  it('ok 응답을 그대로 반환한다', async () => {
    const comments = [{ id: 'c1', senderName: '지민', content: '축하해요', createdAt: '2026-08-09T00:00:00.000Z' }];
    listEventCommentsMock.mockResolvedValue({ status: 'ok', comments });

    const { result } = renderHook(() => useEventComments('event-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ status: 'ok', comments });
  });

  it('not_found 응답을 그대로 반환한다', async () => {
    listEventCommentsMock.mockResolvedValue({ status: 'not_found' });

    const { result } = renderHook(() => useEventComments('missing'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ status: 'not_found' });
  });

  it('expired 응답을 그대로 반환한다', async () => {
    listEventCommentsMock.mockResolvedValue({ status: 'expired' });

    const { result } = renderHook(() => useEventComments('event-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ status: 'expired' });
  });
});
