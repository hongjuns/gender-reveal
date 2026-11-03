import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { BalloonCreatingView } from './BalloonCreatingView';

const meta: Meta<typeof BalloonCreatingView> = {
  title: 'GenderReveal/BalloonCreatingView',
  component: BalloonCreatingView,
  parameters: { layout: 'centered' },
  args: { babyNickname: '깡총이' },
};

export default meta;

type Story = StoryObj<typeof BalloonCreatingView>;

export const Default: Story = {
  name: '기본',
};
