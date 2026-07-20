import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { HeartParticles } from './HeartParticles';

const meta: Meta<typeof HeartParticles> = {
  title: 'GenderReveal/HeartParticles',
  component: HeartParticles,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="relative h-[320px] w-[240px] bg-white">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof HeartParticles>;

export const Default: Story = {
  name: '풍선 주변 하트 파티클',
};
