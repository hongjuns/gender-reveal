import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ResultReveal } from './ResultReveal';
import { useGenderRevealStore } from '@/stores/genderRevealStore';

function seedState(babyGender: 'son' | 'daughter') {
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

const meta: Meta<typeof ResultReveal> = {
  title: 'GenderReveal/ResultReveal',
  component: ResultReveal,
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof ResultReveal>;

export const SonResult: Story = {
  name: '아들 결과',
  play: async () => {
    seedState('son');
  },
};

export const DaughterResult: Story = {
  name: '딸 결과',
  play: async () => {
    seedState('daughter');
  },
};
