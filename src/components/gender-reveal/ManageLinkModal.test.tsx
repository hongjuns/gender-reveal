import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManageLinkModal } from './ManageLinkModal';

const manageLink = 'https://baby.example.com/gender-reveal/manage/code-1';

function renderModal() {
  const onCopied = jest.fn();
  render(<ManageLinkModal manageLink={manageLink} onCopied={onCopied} />);
  return { onCopied };
}

describe('ManageLinkModal', () => {
  it('보관 안내 문구와 관리 링크를 보여주고 닫기 버튼은 없다', () => {
    renderModal();

    expect(screen.getByRole('dialog', { name: '관리 링크 보관 안내' })).toBeInTheDocument();
    expect(screen.getByText('돌아오기 위해 아래 링크를 복사하여')).toBeInTheDocument();
    expect(screen.getByLabelText('관리 링크')).toHaveValue(manageLink);
    expect(screen.queryByRole('button', { name: '닫기' })).not.toBeInTheDocument();
  });

  it('바깥 영역 클릭이나 Esc로는 닫히지 않는다', () => {
    const { onCopied } = renderModal();

    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement);

    expect(onCopied).not.toHaveBeenCalled();
  });

  it('링크 복사에 성공하면 관리 링크를 복사하고 onCopied를 호출한다', async () => {
    const user = userEvent.setup();
    const writeText = jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    const { onCopied } = renderModal();

    await user.click(screen.getByRole('button', { name: '링크 복사하기' }));

    expect(writeText).toHaveBeenCalledWith(manageLink);
    expect(onCopied).toHaveBeenCalledTimes(1);
  });

  it('복사에 실패하면 모달을 유지하고, "직접 보관했어요"로만 닫을 수 있다', async () => {
    const user = userEvent.setup();
    jest.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
    const { onCopied } = renderModal();

    await user.click(screen.getByRole('button', { name: '링크 복사하기' }));

    expect(onCopied).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('복사에 실패했어요');

    await user.click(screen.getByRole('button', { name: '직접 보관했어요' }));
    expect(onCopied).toHaveBeenCalledTimes(1);
  });
});
