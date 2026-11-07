import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ProductPromoBanner } from './ProductPromoBanner';

const meta: Meta<typeof ProductPromoBanner> = {
  title: 'GenderReveal/ProductPromoBanner',
  component: ProductPromoBanner,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[350px]">
        <Story />
      </div>
    ),
  ],
  args: { babyNickname: '깡총이' },
};

export default meta;

type Story = StoryObj<typeof ProductPromoBanner>;

export const Default: Story = { name: '기본' };

export const LongNickname: Story = {
  name: '긴 태명',
  args: { babyNickname: '우리집귀염둥이깡총이' },
};
