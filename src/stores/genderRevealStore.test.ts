import { useGenderRevealStore } from './genderRevealStore';
import type { GenderRevealInput } from '@/types/genderReveal';

const validInput: GenderRevealInput = {
  babyNickname: '콩이',
  dueDate: new Date('2026-12-25'),
  recipientName: '지민',
  babyGender: 'son',
};

function resetStore() {
  useGenderRevealStore.setState(
    {
      step: 'input',
      input: null,
      touchCount: 0,
      isBursting: false,
    },
    false,
  );
}

beforeEach(() => {
  resetStore();
});

describe('setInput', () => {
  it('모든 필드가 유효하면 성공하고 interaction 단계로 전환한다', () => {
    const result = useGenderRevealStore.getState().setInput(validInput);

    expect(result).toEqual({ ok: true });
    const state = useGenderRevealStore.getState();
    expect(state.step).toBe('interaction');
    expect(state.input).toEqual(validInput);
    expect(state.touchCount).toBe(0);
    expect(state.isBursting).toBe(false);
  });

  it('태명이 비어 있으면 실패하고 상태를 바꾸지 않는다', () => {
    const result = useGenderRevealStore
      .getState()
      .setInput({ ...validInput, babyNickname: '   ' });

    expect(result).toEqual({ ok: false, error: 'MISSING_FIELDS' });
    expect(useGenderRevealStore.getState().step).toBe('input');
  });

  it('받는 사람 이름이 비어 있으면 실패한다', () => {
    const result = useGenderRevealStore
      .getState()
      .setInput({ ...validInput, recipientName: '' });

    expect(result).toEqual({ ok: false, error: 'MISSING_FIELDS' });
  });

  it('출산 예정일이 유효하지 않으면 실패한다', () => {
    const result = useGenderRevealStore
      .getState()
      .setInput({ ...validInput, dueDate: new Date('invalid') });

    expect(result).toEqual({ ok: false, error: 'MISSING_FIELDS' });
  });
});

describe('touchBalloon', () => {
  beforeEach(() => {
    useGenderRevealStore.getState().setInput(validInput);
  });

  it('터치할 때마다 touchCount가 1씩 증가한다', () => {
    useGenderRevealStore.getState().touchBalloon();
    expect(useGenderRevealStore.getState().touchCount).toBe(1);

    useGenderRevealStore.getState().touchBalloon();
    expect(useGenderRevealStore.getState().touchCount).toBe(2);
  });

  it('정확히 10번째 터치에서 isBursting이 true가 된다', () => {
    for (let i = 0; i < 9; i += 1) {
      useGenderRevealStore.getState().touchBalloon();
    }
    expect(useGenderRevealStore.getState().isBursting).toBe(false);

    useGenderRevealStore.getState().touchBalloon();
    expect(useGenderRevealStore.getState().touchCount).toBe(10);
    expect(useGenderRevealStore.getState().isBursting).toBe(true);
  });

  it('10번을 초과해 연타해도 touchCount가 10을 넘지 않는다', () => {
    for (let i = 0; i < 25; i += 1) {
      useGenderRevealStore.getState().touchBalloon();
    }
    expect(useGenderRevealStore.getState().touchCount).toBe(10);
    expect(useGenderRevealStore.getState().isBursting).toBe(true);
  });

  it('isBursting이 true인 동안에는 추가 터치가 무시된다', () => {
    for (let i = 0; i < 10; i += 1) {
      useGenderRevealStore.getState().touchBalloon();
    }
    useGenderRevealStore.getState().touchBalloon();
    useGenderRevealStore.getState().touchBalloon();

    expect(useGenderRevealStore.getState().touchCount).toBe(10);
  });
});

describe('completeBurstTransition', () => {
  it('isBursting 상태일 때만 step을 result로 전환한다', () => {
    useGenderRevealStore.getState().setInput(validInput);
    for (let i = 0; i < 10; i += 1) {
      useGenderRevealStore.getState().touchBalloon();
    }

    useGenderRevealStore.getState().completeBurstTransition();

    expect(useGenderRevealStore.getState().step).toBe('result');
  });

  it('isBursting이 false이면 아무 것도 하지 않는다', () => {
    useGenderRevealStore.getState().setInput(validInput);

    useGenderRevealStore.getState().completeBurstTransition();

    expect(useGenderRevealStore.getState().step).toBe('interaction');
  });
});

describe('restart', () => {
  it('입력값은 유지한 채 touchCount를 0으로, step을 interaction으로 되돌린다', () => {
    useGenderRevealStore.getState().setInput(validInput);
    for (let i = 0; i < 10; i += 1) {
      useGenderRevealStore.getState().touchBalloon();
    }
    useGenderRevealStore.getState().completeBurstTransition();

    useGenderRevealStore.getState().restart();

    const state = useGenderRevealStore.getState();
    expect(state.step).toBe('interaction');
    expect(state.touchCount).toBe(0);
    expect(state.isBursting).toBe(false);
    expect(state.input).toEqual(validInput);
  });

  it('result 단계가 아니면 아무 것도 하지 않는다', () => {
    useGenderRevealStore.getState().setInput(validInput);
    useGenderRevealStore.getState().touchBalloon();

    useGenderRevealStore.getState().restart();

    expect(useGenderRevealStore.getState().step).toBe('interaction');
    expect(useGenderRevealStore.getState().touchCount).toBe(1);
  });
});

describe('resetAll', () => {
  it('입력값까지 모두 초기화하고 input 단계로 되돌린다', () => {
    useGenderRevealStore.getState().setInput(validInput);
    for (let i = 0; i < 10; i += 1) {
      useGenderRevealStore.getState().touchBalloon();
    }
    useGenderRevealStore.getState().completeBurstTransition();

    useGenderRevealStore.getState().resetAll();

    const state = useGenderRevealStore.getState();
    expect(state.step).toBe('input');
    expect(state.touchCount).toBe(0);
    expect(state.isBursting).toBe(false);
    expect(state.input).toBeNull();
  });

  it('result 단계가 아니면 아무 것도 하지 않는다', () => {
    useGenderRevealStore.getState().setInput(validInput);
    useGenderRevealStore.getState().touchBalloon();

    useGenderRevealStore.getState().resetAll();

    expect(useGenderRevealStore.getState().step).toBe('interaction');
    expect(useGenderRevealStore.getState().input).toEqual(validInput);
  });
});
