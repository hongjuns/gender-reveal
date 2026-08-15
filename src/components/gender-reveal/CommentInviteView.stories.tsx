import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CommentInviteView } from './CommentInviteView';

const meta: Meta<typeof CommentInviteView> = {
  title: 'GenderReveal/CommentInviteView',
  component: CommentInviteView,
  parameters: { layout: 'centered' },
  args: {
    babyNickname: '콩이',
    onWriteClick: () => {},
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

type Story = StoryObj<typeof CommentInviteView>;

export const Default: Story = {
  name: '기본',
};
