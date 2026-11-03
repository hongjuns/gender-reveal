import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MIN_CREATING_VIEW_MS, StepOneForm } from './StepOneForm';

const mutateAsyncMock = jest.fn();
const pushMock = jest.fn();

jest.mock('@/hooks/useCreateGenderRevealEvent', () => ({
  useCreateGenderRevealEvent: () => ({ mutateAsync: mutateAsyncMock, isPending: false }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

const createdResponse = {
  code: 'code-1',
  manageLink: 'http://localhost:3000/gender-reveal/manage/code-1',
  linkExpiresAt: '2026-11-10T00:00:00.000Z',
  events: [],
};

beforeEach(() => {
  mutateAsyncMock.mockReset();
  pushMock.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

function setupUser() {
  return userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
}

async function closeUpdateNotice(user: ReturnType<typeof setupUser>) {
  await user.click(screen.getByRole('button', { name: '닫기' }));
}

async function fillCommonFields(user: ReturnType<typeof setupUser>) {
  await user.type(screen.getByLabelText('아기 태명'), '콩이');
  fireEvent.change(screen.getByLabelText('출산 예정일'), { target: { value: '2026-12-25' } });
  await user.click(screen.getByLabelText('아들'));
}

async function goToRecipients(user: ReturnType<typeof setupUser>) {
  await closeUpdateNotice(user);
  await fillCommonFields(user);
  await user.click(screen.getByRole('button', { name: '받는 사람 입력' }));
}

describe('StepOneForm', () => {
  it('진입 시 업데이트 안내 팝업을 보여주고, 닫기 클릭 시 사라진다', async () => {
    const user = setupUser();
    render(<StepOneForm />);

    expect(screen.getByRole('dialog', { name: '업데이트 안내' })).toBeInTheDocument();
    await closeUpdateNotice(user);
    expect(screen.queryByRole('dialog', { name: '업데이트 안내' })).not.toBeInTheDocument();
  });

  it('받는 사람 칸·패스키 입력이 없고, 버튼 문구는 "받는 사람 입력"이다', () => {
    render(<StepOneForm />);

    expect(screen.queryByLabelText('받는 사람')).not.toBeInTheDocument();
    expect(screen.queryByText('패스키')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '받는 사람 입력' })).toBeInTheDocument();
  });

  it('필수값이 비어 있으면 안내 메시지를 보여주고 받는 사람 화면으로 넘어가지 않는다', async () => {
    const user = setupUser();
    render(<StepOneForm />);
    await closeUpdateNotice(user);

    await user.click(screen.getByRole('button', { name: '받는 사람 입력' }));

    expect(await screen.findByText('정보를 모두 입력해주세요')).toBeInTheDocument();
    expect(screen.queryByLabelText('받는 사람 01')).not.toBeInTheDocument();
  });

  it('필수값을 입력하면 받는 사람 화면으로 넘어가고, 뒤로 가기 시 입력값이 유지된다', async () => {
    const user = setupUser();
    render(<StepOneForm />);
    await goToRecipients(user);

    await user.type(screen.getByLabelText('받는 사람 01'), '할머니');
    await user.click(screen.getByRole('button', { name: '뒤로 가기' }));

    expect(screen.getByLabelText('아기 태명')).toHaveValue('콩이');
    expect(screen.getByLabelText('아들')).toBeChecked();

    await user.click(screen.getByRole('button', { name: '받는 사람 입력' }));
    expect(screen.getByLabelText('받는 사람 01')).toHaveValue('할머니');
  });

  it('생성하면 로딩 화면을 최소 2초 보여준 뒤 관리 화면으로 이동한다', async () => {
    jest.useFakeTimers();
    mutateAsyncMock.mockResolvedValue(createdResponse);
    const user = setupUser();
    render(<StepOneForm />);
    await goToRecipients(user);

    await user.type(screen.getByLabelText('받는 사람 01'), '할머니');
    await user.click(screen.getByRole('button', { name: '받는 사람 추가' }));
    await user.type(screen.getByLabelText('받는 사람 02'), '삼촌');
    await user.click(screen.getByRole('button', { name: '젠더리빌 풍선 만들기' }));

    expect(mutateAsyncMock).toHaveBeenCalledWith({
      babyNickname: '콩이',
      dueDate: '2026-12-25',
      babyGender: 'son',
      recipientNames: ['할머니', '삼촌'],
    });
    expect(screen.getByText('콩이의')).toBeInTheDocument();
    expect(screen.getByText('풍선이 만들어지고 있어요.')).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(MIN_CREATING_VIEW_MS - 1);
    });
    expect(pushMock).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(pushMock).toHaveBeenCalledWith('/gender-reveal/manage/code-1?created');
  });

  it('생성에 실패하면 받는 사람 화면으로 돌아가 입력값을 유지하고 오류를 보여준다', async () => {
    jest.useFakeTimers();
    mutateAsyncMock.mockRejectedValue(new Error('fail'));
    const user = setupUser();
    render(<StepOneForm />);
    await goToRecipients(user);

    await user.type(screen.getByLabelText('받는 사람 01'), '할머니');
    await user.click(screen.getByRole('button', { name: '젠더리빌 풍선 만들기' }));

    await act(async () => {
      jest.advanceTimersByTime(MIN_CREATING_VIEW_MS);
    });

    expect(await screen.findByText('풍선 생성에 실패했어요. 다시 시도해주세요')).toBeInTheDocument();
    expect(screen.getByLabelText('받는 사람 01')).toHaveValue('할머니');
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("성별에서 '아들'과 '딸'은 동시에 선택될 수 없다", async () => {
    const user = setupUser();
    render(<StepOneForm />);

    const sonRadio = screen.getByLabelText('아들') as HTMLInputElement;
    const daughterRadio = screen.getByLabelText('딸') as HTMLInputElement;

    await user.click(sonRadio);
    expect(sonRadio.checked).toBe(true);
    expect(daughterRadio.checked).toBe(false);

    await user.click(daughterRadio);
    expect(sonRadio.checked).toBe(false);
    expect(daughterRadio.checked).toBe(true);
  });
});
