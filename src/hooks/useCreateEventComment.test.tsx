import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useCreateEventComment, eventCommentsQueryKey } from './useCreateEventComment';
import { createEventComment } from '@/lib/api/comments';

jest.mock('@/lib/api/comments', () => ({
  createEventComment: jest.fn(),
}));

const createEventCommentMock = createEventComment as jest.Mock;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { Wrapper, queryClient };
}

beforeEach(() => {
  createEventCommentMock.mockReset();
});

describe('useCreateEventComment', () => {
  it('성공하면 mutate 결과가 ok 상태로 반환된다', async () => {
    const comment = { id: 'c1', senderName: '지민', content: '축하해요', createdAt: '2026-08-09T00:00:00.000Z' };
    createEventCommentMock.mockResolvedValue({ status: 'ok', comment });
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateEventComment('event-1'), { wrapper: Wrapper });
    result.current.mutate({ senderName: '지민', content: '축하해요' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ status: 'ok', comment });
  });

  it('성공 시 event-comments 쿼리 캐시 맨 앞에 새 댓글을 반영한다', async () => {
    const comment = { id: 'c2', senderName: '민수', content: '축하!', createdAt: '2026-08-09T01:00:00.000Z' };
    createEventCommentMock.mockResolvedValue({ status: 'ok', comment });
    const { Wrapper, queryClient } = createWrapper();
    const existing = { id: 'c1', senderName: '지민', content: '축하해요', createdAt: '2026-08-09T00:00:00.000Z' };
    queryClient.setQueryData(eventCommentsQueryKey('event-1'), { status: 'ok', comments: [existing] });

    const { result } = renderHook(() => useCreateEventComment('event-1'), { wrapper: Wrapper });
    result.current.mutate({ senderName: '민수', content: '축하!' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(eventCommentsQueryKey('event-1'))).toEqual({
      status: 'ok',
      comments: [comment, existing],
    });
  });

  it('invalid/expired/not_found 결과를 그대로 반환하고 캐시는 변경하지 않는다', async () => {
    createEventCommentMock.mockResolvedValue({ status: 'not_found' });
    const { Wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useCreateEventComment('event-1'), { wrapper: Wrapper });
    result.current.mutate({ senderName: '지민', content: '축하해요' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ status: 'not_found' });
    expect(queryClient.getQueryData(eventCommentsQueryKey('event-1'))).toBeUndefined();
  });
});
