import { render, screen } from '@testing-library/react';
import SharedGenderRevealPage from './page';
import { useGenderRevealStore } from '@/stores/genderRevealStore';
import { useGenderRevealEvent } from '@/hooks/useGenderRevealEvent';

const pushMock = jest.fn();
const notFoundMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  notFound: () => notFoundMock(),
}));

jest.mock('@/hooks/useGenderRevealEvent');

const mockedUseGenderRevealEvent = useGenderRevealEvent as jest.Mock;

const event = {
  id: 'abc-123',
  babyNickname: '콩이',
  dueDate: '2026-12-25',
  recipientName: '지민',
  babyGender: 'son' as const,
  shareLink: 'http://localhost:3000/gender-reveal/abc-123',
  createdAt: '2026-07-18T00:00:00.000Z',
  linkExpiresAt: '2999-01-01T00:00:00.000Z',
};

function resetStore() {
  useGenderRevealStore.setState(
    { step: 'input', input: null, touchCount: 0, isBursting: false },
    false,
  );
}

beforeEach(() => {
  pushMock.mockReset();
  notFoundMock.mockReset();
  mockedUseGenderRevealEvent.mockReset();
  resetStore();
});

describe('SharedGenderRevealPage', () => {
  it('유효한 이벤트를 조회하면 서버 값으로 하이드레이션되어 step2 화면을 보여주고 step1 필드는 노출하지 않는다', () => {
    mockedUseGenderRevealEvent.mockReturnValue({
      data: { status: 'ok', event },
      isPending: false,
    });

    render(<SharedGenderRevealPage params={{ id: 'abc-123' }} searchParams={{}} />);

    expect(screen.getByText(/콩이는/)).toBeInTheDocument();
    expect(screen.queryByLabelText('아기 태명')).not.toBeInTheDocument();
    expect(useGenderRevealStore.getState().step).toBe('interaction');
  });

  it('존재하지 않는 링크면 Next.js notFound()를 호출한다', () => {
    mockedUseGenderRevealEvent.mockReturnValue({
      data: { status: 'not_found' },
      isPending: false,
    });

    render(<SharedGenderRevealPage params={{ id: 'missing' }} searchParams={{}} />);

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it('created 쿼리 파라미터가 있으면 공유 링크 배너와 step2 화면(BalloonStage)이 함께 노출된다 (User Story 1 Acceptance #4, US1↔US2 결합 지점)', () => {
    mockedUseGenderRevealEvent.mockReturnValue({
      data: { status: 'ok', event },
      isPending: false,
    });

    render(<SharedGenderRevealPage params={{ id: 'abc-123' }} searchParams={{ created: '1' }} />);

    expect(screen.getByText(event.shareLink)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /풍선 터치하기/ })).toBeInTheDocument();
  });

  it('created 쿼리 파라미터가 없으면 공유 링크 배너를 노출하지 않는다', () => {
    mockedUseGenderRevealEvent.mockReturnValue({
      data: { status: 'ok', event },
      isPending: false,
    });

    render(<SharedGenderRevealPage params={{ id: 'abc-123' }} searchParams={{}} />);

    expect(screen.queryByText(event.shareLink)).not.toBeInTheDocument();
  });

  it('만료된 링크면 ExpiredLinkNotice를 보여준다', () => {
    mockedUseGenderRevealEvent.mockReturnValue({
      data: { status: 'expired' },
      isPending: false,
    });

    render(<SharedGenderRevealPage params={{ id: 'abc-123' }} searchParams={{}} />);

    expect(screen.getByText('만료된 링크예요')).toBeInTheDocument();
  });

  it('조회 중 서버 오류가 나면 에러 안내를 보여준다(빈 화면 방지)', () => {
    mockedUseGenderRevealEvent.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
    });

    render(<SharedGenderRevealPage params={{ id: 'abc-123' }} searchParams={{}} />);

    expect(screen.getByText('일시적인 오류가 발생했어요')).toBeInTheDocument();
  });

  it('조회 중에는 스켈레톤을 보여준다', () => {
    mockedUseGenderRevealEvent.mockReturnValue({ data: undefined, isPending: true });

    render(<SharedGenderRevealPage params={{ id: 'abc-123' }} searchParams={{}} />);

    expect(screen.getByRole('status', { name: '화면을 준비하고 있어요' })).toBeInTheDocument();
  });
});
