import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ManagePage from './page';
import { useManagedBalloons } from '@/hooks/useManagedBalloons';
import { buildBalloon, buildGroup } from '@/hooks/managedBalloonTestUtils';

const pushMock = jest.fn();
const replaceMock = jest.fn();
const notFoundMock = jest.fn();
const deleteMutateAsyncMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
  notFound: () => notFoundMock(),
}));

jest.mock('@/hooks/useManagedBalloons');
jest.mock('@/hooks/useDeleteBalloon', () => ({
  useDeleteBalloon: () => ({ mutateAsync: deleteMutateAsyncMock, isPending: false }),
}));

const mockedUseManagedBalloons = useManagedBalloons as jest.Mock;

function renderPage(searchParams: { created?: string } = {}) {
  render(<ManagePage params={{ code: 'code-1' }} searchParams={searchParams} />);
}

beforeEach(() => {
  pushMock.mockReset();
  replaceMock.mockReset();
  notFoundMock.mockReset();
  deleteMutateAsyncMock.mockReset();
  mockedUseManagedBalloons.mockReset();
  mockedUseManagedBalloons.mockReturnValue({
    data: buildGroup([buildBalloon({ id: 'a', recipientName: '할머니' })]),
    isPending: false,
    isError: false,
  });
});

describe('관리 페이지 /gender-reveal/manage/[code]', () => {
  it('?created로 진입하면 관리 링크 모달을 자동으로 띄운다', () => {
    renderPage({ created: '' });

    expect(screen.getByRole('dialog', { name: '관리 링크 보관 안내' })).toBeInTheDocument();
    expect(screen.getByLabelText('관리 링크')).toHaveValue('http://localhost/gender-reveal/manage/code-1');
  });

  it('관리 링크로 재접속하면(쿼리 없음) 모달을 띄우지 않는다', () => {
    renderPage();

    expect(screen.queryByRole('dialog', { name: '관리 링크 보관 안내' })).not.toBeInTheDocument();
    expect(screen.getByText('할머니')).toBeInTheDocument();
  });

  it('모달에서 링크를 복사하면 모달이 사라지고 URL에서 created를 제거한다', async () => {
    const user = userEvent.setup();
    jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    renderPage({ created: '' });

    await user.click(screen.getByRole('button', { name: '링크 복사하기' }));

    expect(screen.queryByRole('dialog', { name: '관리 링크 보관 안내' })).not.toBeInTheDocument();
    expect(replaceMock).toHaveBeenCalledWith('/gender-reveal/manage/code-1');
  });

  it('존재하지 않는 code면 notFound를 호출한다', () => {
    mockedUseManagedBalloons.mockReturnValue({ data: { status: 'not_found' }, isPending: false, isError: false });

    renderPage();

    expect(notFoundMock).toHaveBeenCalled();
  });

  it('삭제 확인 시 삭제 뮤테이션을 호출하고, 이미 삭제된 풍선이면 안내한다', async () => {
    const user = userEvent.setup();
    deleteMutateAsyncMock.mockResolvedValue({ status: 'not_found' });
    renderPage();

    await user.click(screen.getByRole('button', { name: '받는 사람 01 할머니 삭제' }));
    await user.click(screen.getByRole('button', { name: '삭제' }));

    expect(deleteMutateAsyncMock).toHaveBeenCalledWith('a');
    expect(await screen.findByText('이미 삭제된 풍선이에요')).toBeInTheDocument();
  });

  it('연장 버튼은 보여주지 않는다', () => {
    renderPage();

    expect(screen.queryByRole('button', { name: /연장/ })).not.toBeInTheDocument();
  });
});
