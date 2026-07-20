import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultReveal } from './ResultReveal';
import { useGenderRevealStore } from '@/stores/genderRevealStore';

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

describe('ResultReveal', () => {
  it("성별이 '아들'이면 남아 이미지와 문구를 노출한다", () => {
    seedResultState('son');
    render(<ResultReveal />);

    expect(screen.getByAltText('남아 일러스트')).toHaveAttribute(
      'src',
      expect.stringContaining('002.png'),
    );
    expect(screen.getByTestId('result-message')).toHaveTextContent(
      "지민님! '콩이'이는 '아들'이에요!2026년 12월 25일에 건강하게 만나요!",
    );
  });

  it("성별이 '딸'이면 여아 이미지와 문구를 노출한다", () => {
    seedResultState('daughter');
    render(<ResultReveal />);

    expect(screen.getByAltText('여아 일러스트')).toHaveAttribute(
      'src',
      expect.stringContaining('003.png'),
    );
    expect(screen.getByTestId('result-message')).toHaveTextContent(
      "지민님! '콩이'이는 '딸'이에요!2026년 12월 25일에 건강하게 만나요!",
    );
  });

  it("'다시 시작하기' 클릭 시 입력값은 유지된 채 interaction 단계로 되돌아간다", async () => {
    seedResultState('son');
    const user = userEvent.setup();
    render(<ResultReveal />);

    await user.click(screen.getByRole('button', { name: '다시 시작하기' }));

    const state = useGenderRevealStore.getState();
    expect(state.step).toBe('interaction');
    expect(state.touchCount).toBe(0);
    expect(state.input?.babyNickname).toBe('콩이');
  });
});
