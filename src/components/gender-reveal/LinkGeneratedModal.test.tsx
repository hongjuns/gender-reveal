import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LinkGeneratedModal } from './LinkGeneratedModal';

const SHARE_LINK = 'http://localhost:3000/gender-reveal/abc-123';

describe('LinkGeneratedModal', () => {
  it('제목과 안내 문구, 두 개의 액션 버튼을 노출한다', () => {
    render(<LinkGeneratedModal shareLink={SHARE_LINK} onClose={jest.fn()} />);

    expect(screen.getByText('🎈 풍선이 완성되었어요!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '공유 링크 복사' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '풍선 미리보기' })).toBeInTheDocument();
  });

  it('공유 링크 복사 클릭 시 클립보드에 복사하고 완료 토스트를 보여준다', async () => {
    const user = userEvent.setup();
    render(<LinkGeneratedModal shareLink={SHARE_LINK} onClose={jest.fn()} />);
    const writeText = jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    await user.click(screen.getByRole('button', { name: '공유 링크 복사' }));

    expect(writeText).toHaveBeenCalledWith(SHARE_LINK);
    expect(await screen.findByText('복사가 완료 되었습니다.')).toBeInTheDocument();
  });

  it('풍선 미리보기 클릭 시 공유 링크를 새 창으로 연다', async () => {
    const user = userEvent.setup();
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    render(<LinkGeneratedModal shareLink={SHARE_LINK} onClose={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: '풍선 미리보기' }));

    expect(openSpy).toHaveBeenCalledWith(SHARE_LINK, '_blank', 'noopener,noreferrer');
  });

  it('닫기 버튼 클릭 시 onClose를 호출한다', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<LinkGeneratedModal shareLink={SHARE_LINK} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: '닫기' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('배경 클릭 시 onClose를 호출하지만 팝업 내부 클릭은 닫지 않는다', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<LinkGeneratedModal shareLink={SHARE_LINK} onClose={onClose} />);

    await user.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole('dialog').parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
