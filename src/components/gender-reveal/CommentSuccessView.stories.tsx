import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CommentSuccessView } from './CommentSuccessView';

const meta: Meta<typeof CommentSuccessView> = {
  title: 'GenderReveal/CommentSuccessView',
  component: CommentSuccessView,
  parameters: { layout: 'centered' },
  args: {
    babyNickname: '콩이',
    senderName: '지민',
    isSon: true,
    onViewComments: () => {},
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

type Story = StoryObj<typeof CommentSuccessView>;

export const Default: Story = {
  name: '기본 (아들)',
};

export const Daughter: Story = {
  name: '딸',
  args: {
    isSon: false,
  },
};
