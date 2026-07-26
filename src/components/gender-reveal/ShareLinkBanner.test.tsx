import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShareLinkBanner } from './ShareLinkBanner';

const SHARE_LINK = 'http://localhost:3000/gender-reveal/abc-123';

describe('ShareLinkBanner', () => {
  it('공유 링크를 화면에 노출한다', () => {
    render(<ShareLinkBanner shareLink={SHARE_LINK} />);

    expect(screen.getByText(SHARE_LINK)).toBeInTheDocument();
  });

  it('복사 버튼 클릭 시 클립보드에 링크를 복사하고 성공 메시지를 보여준다', async () => {
    const user = userEvent.setup();
    render(<ShareLinkBanner shareLink={SHARE_LINK} />);
    const writeText = jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    await user.click(screen.getByRole('button', { name: '복사' }));

    expect(writeText).toHaveBeenCalledWith(SHARE_LINK);
    expect(await screen.findByText('링크를 복사했어요')).toBeInTheDocument();
  });

  it('복사에 실패하면 에러 메시지를 보여준다', async () => {
    const user = userEvent.setup();
    render(<ShareLinkBanner shareLink={SHARE_LINK} />);
    jest.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));

    await user.click(screen.getByRole('button', { name: '복사' }));

    expect(await screen.findByText(/복사에 실패했어요/)).toBeInTheDocument();
  });
});
