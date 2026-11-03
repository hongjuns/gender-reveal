import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteBalloonConfirmModal } from './DeleteBalloonConfirmModal';

describe('DeleteBalloonConfirmModal', () => {
  it('받는 사람 이름과 댓글 삭제 안내를 보여준다', () => {
    render(<DeleteBalloonConfirmModal recipientName="삼촌들" onConfirm={jest.fn()} onCancel={jest.fn()} />);

    const dialog = screen.getByRole('alertdialog', { name: '풍선 삭제 확인' });
    expect(dialog).toHaveTextContent("'삼촌들'에게 보낸 풍선을 삭제할까요?");
    expect(dialog).toHaveTextContent('댓글도 함께 사라지고');
  });

  it('확인과 취소 버튼이 각각 콜백을 호출한다', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    render(<DeleteBalloonConfirmModal recipientName="삼촌들" onConfirm={onConfirm} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: '삭제' }));
    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('삭제 중에는 버튼이 비활성화된다', () => {
    render(
      <DeleteBalloonConfirmModal recipientName="삼촌들" isDeleting onConfirm={jest.fn()} onCancel={jest.fn()} />,
    );

    expect(screen.getByRole('button', { name: '삭제 중...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '취소' })).toBeDisabled();
  });
});
