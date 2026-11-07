import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManagedBalloonRow } from './ManagedBalloonRow';
import { buildBalloon } from '@/hooks/managedBalloonTestUtils';

function renderRow(props: Partial<React.ComponentProps<typeof ManagedBalloonRow>> = {}) {
  const onDelete = jest.fn();
  const onCopied = jest.fn();
  const balloon = props.balloon ?? buildBalloon({ linkExpiresAt: '2026-11-10T03:00:00.000Z' });
  render(
    <ul>
      <ManagedBalloonRow index={1} balloon={balloon} onDelete={onDelete} onCopied={onCopied} {...props} />
    </ul>,
  );
  return { onDelete, onCopied, balloon };
}

describe('ManagedBalloonRow', () => {
  it('받는 사람 번호와 이름을 보여준다', () => {
    renderRow();

    expect(screen.getByText('받는 사람 02')).toBeInTheDocument();
    expect(screen.getByText('할머니')).toBeInTheDocument();
  });

  it('링크 복사하기를 누르면 공유 링크를 복사하고 onCopied를 호출한다', async () => {
    const user = userEvent.setup();
    const writeText = jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    const { onCopied, balloon } = renderRow();

    await user.click(screen.getByRole('button', { name: '할머니 링크 복사하기' }));

    expect(writeText).toHaveBeenCalledWith(balloon.shareLink);
    expect(onCopied).toHaveBeenCalled();
  });

  it('복사에 실패하면 오류와 함께 직접 복사할 수 있는 링크를 보여준다', async () => {
    const user = userEvent.setup();
    jest.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
    const { onCopied, balloon } = renderRow();

    await user.click(screen.getByRole('button', { name: '할머니 링크 복사하기' }));

    expect(screen.getByRole('alert')).toHaveTextContent('복사에 실패했어요');
    expect(screen.getByText(balloon.shareLink)).toBeInTheDocument();
    expect(onCopied).not.toHaveBeenCalled();
  });

  it('삭제를 누르면 onDelete에 풍선을 넘긴다', async () => {
    const user = userEvent.setup();
    const { onDelete, balloon } = renderRow();

    await user.click(screen.getByRole('button', { name: '받는 사람 02 할머니 삭제' }));

    expect(onDelete).toHaveBeenCalledWith(balloon);
  });

  it('만료일과 연장 버튼은 보여주지 않는다', () => {
    renderRow({ balloon: buildBalloon({ linkExpiresAt: '2026-11-10T03:00:00.000Z', isExpired: true }) });

    expect(screen.queryByText(/까지/)).not.toBeInTheDocument();
    expect(screen.queryByText('만료됨')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /연장/ })).not.toBeInTheDocument();
  });

  it('처리 중이면 삭제 버튼이 비활성화된다', () => {
    renderRow({ isBusy: true });

    expect(screen.getByRole('button', { name: /삭제/ })).toBeDisabled();
  });
});
