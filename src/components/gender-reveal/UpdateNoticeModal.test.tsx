import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UpdateNoticeModal } from './UpdateNoticeModal';

describe('UpdateNoticeModal', () => {
  it('업데이트 안내 다이얼로그와 링크를 노출한다', () => {
    render(<UpdateNoticeModal onClose={jest.fn()} />);

    expect(screen.getByRole('dialog', { name: '업데이트 안내' })).toBeInTheDocument();

    const link = screen.getByRole('link', { name: '업데이트 과정 보러가기' });
    expect(link).toHaveAttribute('href', 'https://blog.naver.com/hyundgn/224365769203');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('오늘은 그만 보기 버튼을 노출하지 않는다', () => {
    render(<UpdateNoticeModal onClose={jest.fn()} />);

    expect(screen.queryByText('오늘은 그만 보기')).not.toBeInTheDocument();
  });

  it('X 버튼 클릭 시 onClose를 호출한다', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(<UpdateNoticeModal onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: '닫기' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('배경 클릭 시 onClose를 호출하지만 팝업 내부 클릭은 닫지 않는다', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(<UpdateNoticeModal onClose={onClose} />);

    await user.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole('dialog').parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
