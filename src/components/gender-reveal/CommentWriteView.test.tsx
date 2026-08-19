import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { CommentWriteView } from './CommentWriteView';
import { createEventComment } from '@/lib/api/comments';

jest.mock('@/lib/api/comments', () => ({
  createEventComment: jest.fn(),
}));

const createEventCommentMock = createEventComment as jest.Mock;

function renderWithClient(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

beforeEach(() => {
  createEventCommentMock.mockReset();
});

describe('CommentWriteView', () => {
  it('content가 100자를 초과해 입력되면 100자로 잘리고 카운터가 100/100자로 고정된다', async () => {
    const user = userEvent.setup();
    renderWithClient(<CommentWriteView eventId="event-1" babyNickname="콩이" />);

    const textarea = screen.getByPlaceholderText(/곧 만날 아기에게/);
    await user.click(textarea);
    await user.paste('가'.repeat(120));

    expect(textarea).toHaveValue('가'.repeat(100));
    expect(screen.getByText('100/100자')).toBeInTheDocument();
  });

  it('프리셋 칩 클릭 시 문구가 textarea에 삽입된다', async () => {
    const user = userEvent.setup();
    renderWithClient(<CommentWriteView eventId="event-1" babyNickname="콩이" />);

    await user.click(screen.getByRole('button', { name: '건강하게 자라렴❤️' }));

    const textarea = screen.getByPlaceholderText(/곧 만날 아기에게/);
    expect(textarea).toHaveValue('건강하게 자라렴❤️');
  });

  it('칩 삽입 시 100자를 넘기면 삽입하지 않고 안내 문구를 보여준다', async () => {
    const user = userEvent.setup();
    renderWithClient(<CommentWriteView eventId="event-1" babyNickname="콩이" />);

    const textarea = screen.getByPlaceholderText(/곧 만날 아기에게/);
    await user.click(textarea);
    await user.paste('가'.repeat(95));

    await user.click(screen.getByRole('button', { name: '너의 모든 날이 빛나길✨' }));

    expect(textarea).toHaveValue('가'.repeat(95));
    expect(screen.getByText(/100자를 초과/)).toBeInTheDocument();
  });

  it('이름 또는 내용이 비어 있으면 완료하기 버튼이 비활성화된다', async () => {
    const user = userEvent.setup();
    renderWithClient(<CommentWriteView eventId="event-1" babyNickname="콩이" />);

    expect(screen.getByRole('button', { name: '완료하기' })).toBeDisabled();

    await user.click(screen.getByPlaceholderText(/곧 만날 아기에게/));
    await user.paste('축하해요');
    expect(screen.getByRole('button', { name: '완료하기' })).toBeDisabled();

    await user.click(screen.getByPlaceholderText('보내는 사람'));
    await user.paste('지민');
    expect(screen.getByRole('button', { name: '완료하기' })).toBeEnabled();
  });

  it('완료하기 클릭 시 이름/내용을 trim해 등록하고 성공하면 폼을 초기화한다', async () => {
    createEventCommentMock.mockResolvedValue({
      status: 'ok',
      comment: { id: 'c1', senderName: '지민', content: '축하해요', createdAt: '2026-08-09T00:00:00.000Z' },
    });
    const user = userEvent.setup();
    renderWithClient(<CommentWriteView eventId="event-1" babyNickname="콩이" />);

    await user.click(screen.getByPlaceholderText(/곧 만날 아기에게/));
    await user.paste('  축하해요  ');
    await user.click(screen.getByPlaceholderText('보내는 사람'));
    await user.paste('  지민  ');
    await user.click(screen.getByRole('button', { name: '완료하기' }));

    expect(await screen.findByPlaceholderText(/곧 만날 아기에게/)).toHaveValue('');
    expect(createEventCommentMock).toHaveBeenCalledWith('event-1', {
      senderName: '지민',
      content: '축하해요',
    });
  });

  it('완료하기 클릭 시 성공하면 trim된 이름으로 onSubmitted를 호출한다', async () => {
    createEventCommentMock.mockResolvedValue({
      status: 'ok',
      comment: { id: 'c1', senderName: '지민', content: '축하해요', createdAt: '2026-08-09T00:00:00.000Z' },
    });
    const onSubmitted = jest.fn();
    const user = userEvent.setup();
    renderWithClient(<CommentWriteView eventId="event-1" babyNickname="콩이" onSubmitted={onSubmitted} />);

    await user.click(screen.getByPlaceholderText(/곧 만날 아기에게/));
    await user.paste('축하해요');
    await user.click(screen.getByPlaceholderText('보내는 사람'));
    await user.paste('  지민  ');
    await user.click(screen.getByRole('button', { name: '완료하기' }));

    await waitFor(() => expect(onSubmitted).toHaveBeenCalledWith('지민'));
  });

  it.each([
    ['not_found', { status: 'not_found' as const }, '더 이상 사용할 수 없는 링크예요'],
    ['expired', { status: 'expired' as const }, '링크가 만료되었어요'],
  ])('제출 결과가 %s이면 입력 폼 대신 안내 문구가 표시된다', async (_label, result, expectedText) => {
    createEventCommentMock.mockResolvedValue(result);
    const user = userEvent.setup();
    renderWithClient(<CommentWriteView eventId="event-1" babyNickname="콩이" />);

    await user.click(screen.getByPlaceholderText(/곧 만날 아기에게/));
    await user.paste('축하해요');
    await user.click(screen.getByPlaceholderText('보내는 사람'));
    await user.paste('지민');
    await user.click(screen.getByRole('button', { name: '완료하기' }));

    expect(await screen.findByText(expectedText)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/곧 만날 아기에게/)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('보내는 사람')).not.toBeInTheDocument();
  });

  it('babyNickname을 포함한 안내 문구를 보여준다', () => {
    renderWithClient(<CommentWriteView eventId="event-1" babyNickname="콩이" />);

    expect(
      screen.getByText((_, element) => element?.textContent === '콩이에게덕담 한마디'),
    ).toBeInTheDocument();
  });
});
