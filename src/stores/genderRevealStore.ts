import { create } from 'zustand';
import type { AppStep, GenderRevealInput } from '@/types/genderReveal';

const TOUCH_TARGET = 10;

export type SetInputResult = { ok: true } | { ok: false; error: 'MISSING_FIELDS' };

interface GenderRevealState {
  step: AppStep;
  input: GenderRevealInput | null;
  touchCount: number;
  isBursting: boolean;
  setInput: (input: GenderRevealInput) => SetInputResult;
  touchBalloon: () => void;
  completeBurstTransition: () => void;
  restart: () => void;
  resetAll: () => void;
}

function isValidInput(input: GenderRevealInput): boolean {
  return (
    input.babyNickname.trim().length > 0 &&
    input.dueDate instanceof Date &&
    !Number.isNaN(input.dueDate.getTime()) &&
    input.recipientName.trim().length > 0 &&
    (input.babyGender === 'son' || input.babyGender === 'daughter')
  );
}

export const useGenderRevealStore = create<GenderRevealState>((set, get) => ({
  step: 'input',
  input: null,
  touchCount: 0,
  isBursting: false,

  setInput: (input) => {
    if (!isValidInput(input)) {
      return { ok: false, error: 'MISSING_FIELDS' };
    }
    set({ input, step: 'interaction', touchCount: 0, isBursting: false });
    return { ok: true };
  },

  touchBalloon: () => {
    const { touchCount, isBursting, step } = get();
    if (step !== 'interaction' || isBursting || touchCount >= TOUCH_TARGET) {
      return;
    }
    const nextCount = touchCount + 1;
    set({
      touchCount: nextCount,
      isBursting: nextCount >= TOUCH_TARGET,
    });
  },

  completeBurstTransition: () => {
    if (!get().isBursting) {
      return;
    }
    set({ step: 'result' });
  },

  restart: () => {
    if (get().step !== 'result') {
      return;
    }
    set({ step: 'interaction', touchCount: 0, isBursting: false });
  },

  resetAll: () => {
    if (get().step !== 'result') {
      return;
    }
    set({ step: 'input', input: null, touchCount: 0, isBursting: false });
  },
}));
