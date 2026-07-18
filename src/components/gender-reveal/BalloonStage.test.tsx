import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BalloonStage } from './BalloonStage';
import { useGenderRevealStore } from '@/stores/genderRevealStore';

function seedInteractionState() {
  useGenderRevealStore.setState(
    {
      step: 'interaction',
      input: {
        babyNickname: '콩이',
        dueDate: new Date('2026-12-25'),
        recipientName: '지민',
        babyGender: 'son',
      },
      touchCount: 0,
      isBursting: false,
    },
    false,
  );
}

beforeEach(() => {
  jest.useFakeTimers({ legacyFakeTimers: false });
  seedInteractionState();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('BalloonStage', () => {
  it('태명이 반영된 안내 문구와 풍선 이미지를 보여준다', () => {
    render(<BalloonStage />);

    expect(
      screen.getByText("'콩이'은 아들일까요? 딸일까요?"),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /풍선/ })).toBeInTheDocument();
  });

  it('터치할 때마다 touchCount가 증가한다', async () => {
    const user = userEvent.setup({ delay: null });
    render(<BalloonStage />);

    const balloon = screen.getByRole('button', { name: /풍선/ });
    await user.click(balloon);

    expect(useGenderRevealStore.getState().touchCount).toBe(1);
  });

  it('정확히 10번째 터치에서 터짐 이펙트 후 result 단계로 전환한다', async () => {
    const user = userEvent.setup({ delay: null });
    render(<BalloonStage />);

    const balloon = screen.getByRole('button', { name: /풍선/ });
    for (let i = 0; i < 10; i += 1) {
      await user.click(balloon);
    }

    expect(useGenderRevealStore.getState().touchCount).toBe(10);
    expect(useGenderRevealStore.getState().isBursting).toBe(true);
    expect(useGenderRevealStore.getState().step).toBe('interaction');

    jest.runAllTimers();

    expect(useGenderRevealStore.getState().step).toBe('result');
  });

  it('빠르게 20번 이상 연타해도 정확히 10번째에서만 전환된다', async () => {
    const user = userEvent.setup({ delay: null });
    render(<BalloonStage />);

    const balloon = screen.getByRole('button', { name: /풍선/ });
    for (let i = 0; i < 25; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await user.click(balloon);
    }

    expect(useGenderRevealStore.getState().touchCount).toBe(10);

    jest.runAllTimers();
    expect(useGenderRevealStore.getState().step).toBe('result');
  });
});
