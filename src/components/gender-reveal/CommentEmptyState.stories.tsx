import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CommentEmptyState } from './CommentEmptyState';

const meta: Meta<typeof CommentEmptyState> = {
  title: 'GenderReveal/CommentEmptyState',
  component: CommentEmptyState,
  parameters: { layout: 'centered' },
  args: {
    babyNickname: '콩이',
    onViewWrite: () => {},
  },
  decorators: [
    (Story) => (
      <div className="w-[350px] rounded-[10px] bg-white p-5">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof CommentEmptyState>;

export const Default: Story = {
  name: '기본',
};
