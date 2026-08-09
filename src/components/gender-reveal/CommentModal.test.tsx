import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommentModal } from './CommentModal';

describe('CommentModal', () => {
  it('isOpen이 false면 아무것도 렌더링하지 않는다', () => {
    render(
      <CommentModal isOpen={false} view="write" onClose={jest.fn()}>
        <p>내용</p>
      </CommentModal>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('isOpen이 true면 children을 렌더링한다', () => {
    render(
      <CommentModal isOpen view="write" onClose={jest.fn()}>
        <p>작성 폼</p>
      </CommentModal>,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('작성 폼')).toBeInTheDocument();
  });

  it('X 버튼 클릭 시 onClose를 호출한다', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(
      <CommentModal isOpen view="write" onClose={onClose}>
        <p>작성 폼</p>
      </CommentModal>,
    );

    await user.click(screen.getByRole('button', { name: '닫기' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('view에 따라 aria-label이 달라진다', () => {
    const { rerender } = render(
      <CommentModal isOpen view="write" onClose={jest.fn()}>
        <p>작성 폼</p>
      </CommentModal>,
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', '덕담 작성');

    rerender(
      <CommentModal isOpen view="list" onClose={jest.fn()}>
        <p>목록</p>
      </CommentModal>,
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', '덕담 목록');
  });
});
