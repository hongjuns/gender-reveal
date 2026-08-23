import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
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

// jsdom has no PointerEvent constructor, so fireEvent.pointerDown/Up would silently
// drop clientX. Dispatch a plain Event with clientX attached instead.
function firePointerEvent(element: HTMLElement, type: 'pointerdown' | 'pointerup', clientX: number) {
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, 'clientX', { value: clientX });
  fireEvent(element, event);
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

  it('이미지 영역을 좌우로 스와이프하면 댓글이 전환된다', async () => {
    listEventCommentsMock.mockResolvedValue({ status: 'ok', comments });
    renderWithClient(
      <CommentCarousel eventId="event-1" babyNickname="콩이" onViewWrite={jest.fn()} />,
    );

    const image = await screen.findByTestId('carousel-illustration');
    const swipeArea = image.parentElement as HTMLElement;

    firePointerEvent(swipeArea, 'pointerdown', 200);
    firePointerEvent(swipeArea, 'pointerup', 120);

    expect(screen.getByText('축하합니다')).toBeInTheDocument();
    expect(screen.getByText('From. 민수')).toBeInTheDocument();

    firePointerEvent(swipeArea, 'pointerdown', 120);
    firePointerEvent(swipeArea, 'pointerup', 200);

    expect(screen.getByText('축하해요')).toBeInTheDocument();
    expect(screen.getByText('From. 지민')).toBeInTheDocument();
  });

  it('다음/이전 슬라이드 버튼 클릭으로 댓글이 전환되고 삽화 이미지가 바뀐다', async () => {
    listEventCommentsMock.mockResolvedValue({ status: 'ok', comments });
    const user = userEvent.setup();
    renderWithClient(<CommentCarousel eventId="event-1" babyNickname="콩이" onViewWrite={jest.fn()} />);

    await screen.findByText('축하해요');
    const beforeSrc = screen.getByTestId('carousel-illustration').getAttribute('src');

    await user.click(screen.getByRole('button', { name: '다음 댓글' }));

    expect(screen.getByText('축하합니다')).toBeInTheDocument();
    const afterNextSrc = screen.getByTestId('carousel-illustration').getAttribute('src');
    expect(afterNextSrc).not.toBe(beforeSrc);

    await user.click(screen.getByRole('button', { name: '이전 댓글' }));

    expect(screen.getByText('축하해요')).toBeInTheDocument();
    const afterPrevSrc = screen.getByTestId('carousel-illustration').getAttribute('src');
    expect(afterPrevSrc).not.toBe(afterNextSrc);
  });

  it('댓글이 1개면 슬라이드 버튼이 렌더링되지 않는다', async () => {
    listEventCommentsMock.mockResolvedValue({ status: 'ok', comments: [comments[0]] });
    renderWithClient(<CommentCarousel eventId="event-1" babyNickname="콩이" onViewWrite={jest.fn()} />);

    await screen.findByText('축하해요');

    expect(screen.queryByRole('button', { name: '다음 댓글' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '이전 댓글' })).not.toBeInTheDocument();
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
