import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import html2canvas from 'html2canvas';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import { ResultReveal } from './ResultReveal';
import { useGenderRevealStore } from '@/stores/genderRevealStore';
import { listEventComments } from '@/lib/api/comments';

jest.mock('html2canvas', () => jest.fn());
jest.mock('@/lib/api/comments', () => ({
  listEventComments: jest.fn(),
}));

const listEventCommentsMock = listEventComments as jest.Mock;

function renderResultReveal(props: ComponentProps<typeof ResultReveal> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ResultReveal {...props} />
    </QueryClientProvider>,
  );
}

function mockCanvasSuccess() {
  (html2canvas as jest.Mock).mockResolvedValue({
    toDataURL: () => 'data:image/png;base64,fake',
  });
  global.fetch = jest
    .fn()
    .mockResolvedValue({ blob: () => Promise.resolve(new Blob(['fake'], { type: 'image/png' })) }) as jest.Mock;
}

// jsdom never actually loads <img> sources, so the component's image-load wait
// would hang forever in tests unless we fire the load event ourselves.
function resolveAllImageLoads() {
  document.body.querySelectorAll('img').forEach((img) => {
    fireEvent.load(img);
  });
}

function seedResultState(babyGender: 'son' | 'daughter') {
  useGenderRevealStore.setState(
    {
      step: 'result',
      input: {
        babyNickname: '콩이',
        dueDate: new Date(2026, 11, 25),
        recipientName: '지민',
        babyGender,
      },
      touchCount: 10,
      isBursting: false,
    },
    false,
  );
}

// Renders and waits for the component's automatic on-mount image preparation
// (html2canvas capture) to finish, i.e. until the save button is enabled.
async function renderAndWaitUntilReady() {
  renderResultReveal();
  resolveAllImageLoads();
  return screen.findByRole('button', { name: '결과 저장하기' });
}

describe('ResultReveal', () => {
  beforeEach(() => {
    listEventCommentsMock.mockReset();
    listEventCommentsMock.mockResolvedValue({ status: 'ok', comments: [] });
  });

  it("성별이 '아들'이면 남아 이미지와 문구를 노출한다", () => {
    seedResultState('son');
    mockCanvasSuccess();
    renderResultReveal();

    expect(screen.getByAltText('남아 일러스트')).toHaveAttribute(
      'src',
      expect.stringContaining('baby-son.png'),
    );
    expect(screen.getByTestId('result-message')).toHaveTextContent(
      "'콩이'이는 귀엽고 사랑스러운 '아들'이에요!",
    );
    expect(screen.getByTestId('result-closing')).toHaveTextContent(
      '지민님! 2026년 12월 25일에 건강하게 만나요 :)',
    );
  });

  it("성별이 '딸'이면 여아 이미지와 문구를 노출한다", () => {
    seedResultState('daughter');
    mockCanvasSuccess();
    renderResultReveal();

    expect(screen.getByAltText('여아 일러스트')).toHaveAttribute(
      'src',
      expect.stringContaining('baby-daughter.png'),
    );
    expect(screen.getByTestId('result-message')).toHaveTextContent(
      "'콩이'이는 귀엽고 사랑스러운 '딸'이에요!",
    );
    expect(screen.getByTestId('result-closing')).toHaveTextContent(
      '지민님! 2026년 12월 25일에 건강하게 만나요 :)',
    );
  });

  it('결과 화면 진입 시 저장 버튼은 이미지 준비가 끝날 때까지 비활성 상태다', () => {
    seedResultState('son');
    mockCanvasSuccess();
    renderResultReveal();

    expect(screen.getByRole('button', { name: '이미지 준비 중...' })).toBeDisabled();
  });

  it("'뒤로가기' 클릭 시 입력값은 유지된 채 interaction 단계로 되돌아간다", async () => {
    seedResultState('son');
    mockCanvasSuccess();
    const user = userEvent.setup();
    renderResultReveal();

    await user.click(screen.getByRole('button', { name: /뒤로가기/ }));

    const state = useGenderRevealStore.getState();
    expect(state.step).toBe('interaction');
    expect(state.touchCount).toBe(0);
    expect(state.input?.babyNickname).toBe('콩이');
  });

  it("'젠더리빌 새로 만들기' 클릭 시 입력값까지 초기화되고 input 단계로 되돌아간다", async () => {
    seedResultState('son');
    mockCanvasSuccess();
    const user = userEvent.setup();
    renderResultReveal();

    await user.click(screen.getByRole('button', { name: '젠더리빌 새로 만들기' }));

    const state = useGenderRevealStore.getState();
    expect(state.step).toBe('input');
    expect(state.input).toBeNull();
  });

  it("onCreateNew prop이 주어지면 '젠더리빌 새로 만들기' 클릭 시 resetAll 대신 해당 콜백을 호출한다", async () => {
    seedResultState('son');
    mockCanvasSuccess();
    const user = userEvent.setup();
    const onCreateNew = jest.fn();
    renderResultReveal({ onCreateNew });

    await user.click(screen.getByRole('button', { name: '젠더리빌 새로 만들기' }));

    expect(onCreateNew).toHaveBeenCalledTimes(1);
    const state = useGenderRevealStore.getState();
    expect(state.step).toBe('result');
    expect(state.input).not.toBeNull();
  });

  it("'결과 저장하기' 클릭 시 공유 API를 지원하지 않으면 파일을 다운로드한다", async () => {
    seedResultState('son');
    mockCanvasSuccess();
    const user = userEvent.setup();
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const saveButton = await renderAndWaitUntilReady();
    await user.click(saveButton);

    expect(html2canvas).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    clickSpy.mockRestore();
  });

  it('eventId가 없으면 하트/벨 아이콘(덕담 남기기, 댓글보기 버튼)이 렌더링되지 않는다', () => {
    seedResultState('son');
    mockCanvasSuccess();
    renderResultReveal();

    expect(screen.queryByRole('button', { name: '덕담 남기기' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '댓글보기' })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('eventId가 있으면 하트 아이콘 클릭 시 작성 뷰로 CommentModal이 열린다', async () => {
    seedResultState('son');
    mockCanvasSuccess();
    const user = userEvent.setup();
    renderResultReveal({ eventId: 'event-1' });

    await user.click(screen.getByRole('button', { name: '덕담 남기기' }));

    expect(screen.getByRole('dialog', { name: '덕담 작성' })).toBeInTheDocument();
  });

  it('벨 아이콘 클릭 시 목록 뷰로 CommentModal이 열린다', async () => {
    seedResultState('son');
    mockCanvasSuccess();
    listEventCommentsMock.mockResolvedValue({ status: 'ok', comments: [] });
    const user = userEvent.setup();
    renderResultReveal({ eventId: 'event-1' });

    await user.click(await screen.findByRole('button', { name: '댓글보기' }));

    expect(screen.getByRole('dialog', { name: '덕담 목록' })).toBeInTheDocument();
  });

  it('댓글이 없으면 알림 dot이 노출되지 않는다', async () => {
    seedResultState('son');
    mockCanvasSuccess();
    listEventCommentsMock.mockResolvedValue({ status: 'ok', comments: [] });
    renderResultReveal({ eventId: 'event-1' });

    const bellButton = await screen.findByRole('button', { name: '댓글보기' });

    expect(bellButton.querySelector('img[src*="bell.svg"]')).toBeInTheDocument();
    await waitFor(() => expect(listEventCommentsMock).toHaveBeenCalledWith('event-1'));
    expect(bellButton.querySelector('img[src*="bell-dot.svg"]')).not.toBeInTheDocument();
  });

  it.each(['son', 'daughter'] as const)(
    '댓글이 있으면 성별(%s)에 상관없이 벨 아이콘에 알림 dot이 노출된다',
    async (babyGender) => {
      seedResultState(babyGender);
      mockCanvasSuccess();
      listEventCommentsMock.mockResolvedValue({
        status: 'ok',
        comments: [{ id: 'c1', senderName: '지민', content: '축하해요', createdAt: '2026-08-09T00:00:00.000Z' }],
      });
      renderResultReveal({ eventId: 'event-1' });

      const bellButton = await screen.findByRole('button', { name: '댓글보기' });

      expect(bellButton.querySelector('img[src*="bell.svg"]')).toBeInTheDocument();
      await waitFor(() => expect(bellButton.querySelector('img[src*="bell-dot.svg"]')).toBeInTheDocument());
    },
  );

  it("'결과 저장하기' 클릭 시 공유 API를 지원하면(iOS 등) 다운로드 대신 공유 시트를 띄운다", async () => {
    seedResultState('son');
    mockCanvasSuccess();
    const user = userEvent.setup();
    const canShare = jest.fn().mockReturnValue(true);
    const share = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { canShare, share });
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const saveButton = await renderAndWaitUntilReady();
    await user.click(saveButton);

    expect(share).toHaveBeenCalledTimes(1);
    expect(clickSpy).not.toHaveBeenCalled();

    clickSpy.mockRestore();
    Reflect.deleteProperty(navigator, 'canShare');
    Reflect.deleteProperty(navigator, 'share');
  });

  it('이미지 준비(캡처)가 끝나지 않고 멈추면 시간 초과 후 에러를 보여주고 버튼을 되돌린다', async () => {
    jest.useFakeTimers({ legacyFakeTimers: false });
    try {
      seedResultState('son');
      (html2canvas as jest.Mock).mockReturnValue(new Promise(() => {}));

      renderResultReveal();
      resolveAllImageLoads();

      await act(async () => {
        await jest.advanceTimersByTimeAsync(12000);
      });

      expect(await screen.findByRole('alert')).toHaveTextContent('이미지 캡처 시간이 초과되었습니다.');
      expect(screen.getByRole('button', { name: '결과 저장하기' })).toBeEnabled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('준비 실패 후 저장 버튼을 다시 누르면 이미지를 재준비하고, 한 번 더 누르면 저장된다', async () => {
    seedResultState('son');
    const user = userEvent.setup();
    (html2canvas as jest.Mock).mockRejectedValueOnce(new Error('첫 시도 실패'));
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    renderResultReveal();
    resolveAllImageLoads();

    expect(await screen.findByRole('alert')).toHaveTextContent('첫 시도 실패');
    const saveButton = screen.getByRole('button', { name: '결과 저장하기' });
    expect(saveButton).toBeEnabled();

    mockCanvasSuccess();
    await user.click(saveButton);
    resolveAllImageLoads();
    await screen.findByRole('button', { name: '결과 저장하기' });

    expect(clickSpy).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '결과 저장하기' }));

    expect(clickSpy).toHaveBeenCalledTimes(1);

    clickSpy.mockRestore();
  });
});
