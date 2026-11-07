import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BalloonManager } from './BalloonManager';
import { buildBalloon } from '@/hooks/managedBalloonTestUtils';

const balloons = [
  buildBalloon({ id: 'a', recipientName: '할아버지, 할머니' }),
  buildBalloon({ id: 'b', recipientName: '삼촌들' }),
];

function renderManager(props: Partial<React.ComponentProps<typeof BalloonManager>> = {}) {
  const onDelete = jest.fn().mockResolvedValue(undefined);
  const onCreateNew = jest.fn();
  render(<BalloonManager balloons={balloons} onDelete={onDelete} onCreateNew={onCreateNew} {...props} />);
  return { onDelete, onCreateNew };
}

describe('BalloonManager', () => {
  it('헤더와 받는 사람 목록을 순서대로 보여준다', () => {
    renderManager();

    expect(screen.getByRole('heading', { name: '풍선이 생성되었어요!' })).toBeInTheDocument();
    expect(screen.getByText('링크를 복사하여 풍선 이벤트를 선물하세요.')).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(within(items[0]).getByText('받는 사람 01')).toBeInTheDocument();
    expect(within(items[0]).getByText('할아버지, 할머니')).toBeInTheDocument();
    expect(within(items[1]).getByText('받는 사람 02')).toBeInTheDocument();
  });

  it('링크를 복사하면 복사 완료 안내를 보여준다', async () => {
    const user = userEvent.setup();
    jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    renderManager();

    await user.click(screen.getByRole('button', { name: '삼촌들 링크 복사하기' }));

    expect(await screen.findByText('복사가 완료 되었습니다.')).toBeInTheDocument();
  });

  it('삭제를 누르면 확인 팝업을 띄우고, 확인 시 onDelete를 호출한다', async () => {
    const user = userEvent.setup();
    const { onDelete } = renderManager();

    await user.click(screen.getByRole('button', { name: '받는 사람 02 삼촌들 삭제' }));
    const dialog = screen.getByRole('alertdialog', { name: '풍선 삭제 확인' });
    expect(dialog).toHaveTextContent("'삼촌들'에게 보낸 풍선을 삭제할까요?");

    await user.click(within(dialog).getByRole('button', { name: '삭제' }));

    expect(onDelete).toHaveBeenCalledWith('b');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('삭제 확인에서 취소하면 삭제하지 않는다', async () => {
    const user = userEvent.setup();
    const { onDelete } = renderManager();

    await user.click(screen.getByRole('button', { name: '받는 사람 01 할아버지, 할머니 삭제' }));
    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('남은 풍선이 없으면 빈 상태와 새 풍선 만들기 버튼을 보여준다', async () => {
    const user = userEvent.setup();
    const { onCreateNew } = renderManager({ balloons: [] });

    expect(screen.getByText('남은 풍선이 없어요')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '새 풍선 만들기' }));
    expect(onCreateNew).toHaveBeenCalled();
  });

  it('notice가 있으면 안내 문구를 보여준다', () => {
    renderManager({ notice: '이미 삭제된 풍선이에요' });

    expect(screen.getByRole('alert')).toHaveTextContent('이미 삭제된 풍선이에요');
  });
});
