import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { CommentCarousel } from './CommentCarousel';
import { listEventComments } from '@/lib/api/comments';

jest.mock('@/lib/api/comments', () => ({
  listEventComments: jest.fn(),
}));

const listEventCommentsMock = listEventComments as jest.Mock;

function renderWithClient(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const comments = [
  { id: 'c1', senderName: '지민', content: '축하해요', createdAt: '2026-08-09T00:00:00.000Z' },
  { id: 'c2', senderName: '민수', content: '축하합니다', createdAt: '2026-08-09T01:00:00.000Z' },
];

beforeEach(() => {
  listEventCommentsMock.mockReset();
});

describe('CommentCarousel', () => {
  it('댓글이 있으면 첫 번째 댓글의 내용과 From을 보여준다', async () => {
    listEventCommentsMock.mockResolvedValue({ status: 'ok', comments });
    renderWithClient(
      <CommentCarousel eventId="event-1" babyNickname="콩이" onViewWrite={jest.fn()} />,
    );

    expect(await screen.findByText('축하해요')).toBeInTheDocument();
    expect(screen.getByText('From. 지민')).toBeInTheDocument();
  });

  it('dot 클릭으로 다음 댓글로 이동한다', async () => {
    listEventCommentsMock.mockResolvedValue({ status: 'ok', comments });
    const user = userEvent.setup();
    renderWithClient(
      <CommentCarousel eventId="event-1" babyNickname="콩이" onViewWrite={jest.fn()} />,
    );

    await screen.findByText('축하해요');
    await user.click(screen.getByRole('button', { name: '2번째 댓글로 이동' }));

    expect(screen.getByText('축하합니다')).toBeInTheDocument();
    expect(screen.getByText('From. 민수')).toBeInTheDocument();
  });

  it('덕담 남기기 클릭 시 onViewWrite를 호출한다', async () => {
    listEventCommentsMock.mockResolvedValue({ status: 'ok', comments });
    const onViewWrite = jest.fn();
    const user = userEvent.setup();
    renderWithClient(
      <CommentCarousel eventId="event-1" babyNickname="콩이" onViewWrite={onViewWrite} />,
    );

    await screen.findByText('축하해요');
    await user.click(screen.getByRole('button', { name: '덕담 남기기' }));

    expect(onViewWrite).toHaveBeenCalledTimes(1);
  });

  it('댓글이 0개면 CommentEmptyState가 렌더링된다', async () => {
    listEventCommentsMock.mockResolvedValue({ status: 'ok', comments: [] });
    renderWithClient(
      <CommentCarousel eventId="event-1" babyNickname="콩이" onViewWrite={jest.fn()} />,
    );

    expect(await screen.findByText('아직 남겨진 덕담이 없어요')).toBeInTheDocument();
  });
});
