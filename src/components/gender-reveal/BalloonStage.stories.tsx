import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { userEvent, within } from 'storybook/test';
import { BalloonStage } from './BalloonStage';
import { useGenderRevealStore } from '@/stores/genderRevealStore';

function seedState(touchCount: number, isBursting: boolean) {
  useGenderRevealStore.setState(
    {
      step: 'interaction',
      input: {
        babyNickname: '콩이',
        dueDate: new Date('2026-12-25'),
        recipientName: '지민',
        babyGender: 'son',
      },
      touchCount,
      isBursting,
    },
    false,
  );
}

const meta: Meta<typeof BalloonStage> = {
  title: 'GenderReveal/BalloonStage',
  component: BalloonStage,
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof BalloonStage>;

export const TouchZero: Story = {
  name: '터치 0회',
  play: async () => {
    seedState(0, false);
  },
};

export const TouchFive: Story = {
  name: '터치 5회',
  play: async () => {
    seedState(5, false);
  },
};

export const TouchNine: Story = {
  name: '터치 9회',
  play: async () => {
    seedState(9, false);
  },
};

export const Bursting: Story = {
  name: '터짐 이펙트',
  play: async () => {
    seedState(10, true);
  },
};

export const ClickInteraction: Story = {
  name: '클릭 인터랙션',
  play: async ({ canvasElement }) => {
    seedState(0, false);
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    const balloon = canvas.getByRole('button', { name: /풍선/ });
    await user.click(balloon);
    await user.click(balloon);
    await user.click(balloon);
  },
};
