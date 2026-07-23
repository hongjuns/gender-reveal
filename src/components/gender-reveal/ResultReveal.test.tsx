import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toPng } from 'html-to-image';
import { ResultReveal } from './ResultReveal';
import { useGenderRevealStore } from '@/stores/genderRevealStore';

jest.mock('html-to-image', () => ({
  toPng: jest.fn(),
}));

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
    render(<ResultReveal />);

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

  it("'뒤로가기' 클릭 시 입력값은 유지된 채 interaction 단계로 되돌아간다", async () => {
    seedResultState('son');
    const user = userEvent.setup();
    render(<ResultReveal />);

    await user.click(screen.getByRole('button', { name: /뒤로가기/ }));

    const state = useGenderRevealStore.getState();
    expect(state.step).toBe('interaction');
    expect(state.touchCount).toBe(0);
    expect(state.input?.babyNickname).toBe('콩이');
  });

  it("'젠더리빌 새로 만들기' 클릭 시 입력값까지 초기화되고 input 단계로 되돌아간다", async () => {
    seedResultState('son');
    const user = userEvent.setup();
    render(<ResultReveal />);

    await user.click(screen.getByRole('button', { name: '젠더리빌 새로 만들기' }));

    const state = useGenderRevealStore.getState();
    expect(state.step).toBe('input');
    expect(state.input).toBeNull();
  });

  it("'결과 저장하기' 클릭 시 결과 화면을 이미지로 캡처해 다운로드한다", async () => {
    seedResultState('son');
    const user = userEvent.setup();
    (toPng as jest.Mock).mockResolvedValue('data:image/png;base64,fake');
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<ResultReveal />);

    await user.click(screen.getByRole('button', { name: '결과 저장하기' }));
    await screen.findByRole('button', { name: '결과 저장하기' });

    expect(toPng).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    clickSpy.mockRestore();
  });
});
