import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StepOneForm } from './StepOneForm';
import { useGenderRevealStore } from '@/stores/genderRevealStore';

function resetStore() {
  useGenderRevealStore.setState(
    { step: 'input', input: null, touchCount: 0, isBursting: false },
    false,
  );
}

beforeEach(() => {
  resetStore();
});

describe('StepOneForm', () => {
  it('필수값이 비어 있는 채로 제출하면 안내 메시지를 노출하고 전환하지 않는다', async () => {
    const user = userEvent.setup();
    render(<StepOneForm />);

    await user.click(screen.getByRole('button', { name: '시작하기' }));

    expect(await screen.findByText('정보를 모두 입력해주세요')).toBeInTheDocument();
    expect(useGenderRevealStore.getState().step).toBe('input');
  });

  it('4개 필드를 모두 입력하고 제출하면 store가 갱신되고 interaction 단계로 전환한다', async () => {
    const user = userEvent.setup();
    render(<StepOneForm />);

    await user.type(screen.getByLabelText('아기 태명'), '콩이');
    fireEvent.change(screen.getByLabelText('출산 예정일'), {
      target: { value: '2026-12-25' },
    });
    await user.type(screen.getByLabelText('받는 사람'), '지민');
    await user.click(screen.getByLabelText('아들'));
    await user.click(screen.getByRole('button', { name: '시작하기' }));

    const state = useGenderRevealStore.getState();
    expect(state.step).toBe('interaction');
    expect(state.input?.babyNickname).toBe('콩이');
    expect(state.input?.recipientName).toBe('지민');
    expect(state.input?.babyGender).toBe('son');
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
