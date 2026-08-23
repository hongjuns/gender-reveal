import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StepOneForm } from './StepOneForm';

const mutateMock = jest.fn();

jest.mock('@/hooks/useCreateGenderRevealEvent', () => ({
  useCreateGenderRevealEvent: () => ({ mutate: mutateMock, isPending: false }),
}));

beforeEach(() => {
  mutateMock.mockReset();
});

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('아기 태명'), '콩이');
  fireEvent.change(screen.getByLabelText('출산 예정일'), {
    target: { value: '2026-12-25' },
  });
  await user.type(screen.getByLabelText('받는 사람'), '지민');
  await user.click(screen.getByLabelText('아들'));
}

describe('StepOneForm', () => {
  it('진입 시 업데이트 안내 팝업을 보여주고, 닫기 클릭 시 사라진다', async () => {
    const user = userEvent.setup();
    render(<StepOneForm />);

    expect(screen.getByRole('dialog', { name: '업데이트 안내' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '닫기' }));

    expect(screen.queryByRole('dialog', { name: '업데이트 안내' })).not.toBeInTheDocument();
  });

  it('필수값이 비어 있는 채로 제출하면 안내 메시지를 노출하고 API를 호출하지 않는다', async () => {
    const user = userEvent.setup();
    render(<StepOneForm />);

    await user.click(screen.getByRole('button', { name: '젠더리빌 풍선 만들기' }));

    expect(await screen.findByText('정보를 모두 입력해주세요')).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it('4개 필드를 모두 입력하고 제출하면 링크 생성 뮤테이션을 호출하고, 성공 시 링크 생성 팝업을 보여준다', async () => {
    mutateMock.mockImplementation((input, { onSuccess }) => {
      onSuccess({
        id: 'abc-123',
        shareLink: 'http://localhost:3000/gender-reveal/abc-123',
        linkExpiresAt: '2026-08-01T00:00:00.000Z',
      });
    });

    const user = userEvent.setup();
    render(<StepOneForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: '젠더리빌 풍선 만들기' }));

    expect(mutateMock).toHaveBeenCalledWith(
      {
        babyNickname: '콩이',
        dueDate: '2026-12-25',
        recipientName: '지민',
        babyGender: 'son',
      },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
    expect(await screen.findByRole('dialog', { name: '풍선이 완성되었어요' })).toBeInTheDocument();
    expect(screen.getByText('🎈 풍선이 완성되었어요!')).toBeInTheDocument();
  });

  it('링크 생성에 실패하면 에러 메시지를 노출하고 팝업은 뜨지 않는다', async () => {
    mutateMock.mockImplementation((input, { onError }) => {
      onError(new Error('network error'));
    });

    const user = userEvent.setup();
    render(<StepOneForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: '젠더리빌 풍선 만들기' }));

    expect(await screen.findByText('링크 생성에 실패했어요. 다시 시도해주세요')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: '풍선이 완성되었어요' })).not.toBeInTheDocument();
  });

  it("성별에서 '아들'과 '딸'은 동시에 선택될 수 없다", async () => {
    const user = userEvent.setup();
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
