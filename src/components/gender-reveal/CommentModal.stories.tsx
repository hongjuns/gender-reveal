import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CommentModal } from './CommentModal';

const meta: Meta<typeof CommentModal> = {
  title: 'GenderReveal/CommentModal',
  component: CommentModal,
  parameters: { layout: 'centered' },
  args: {
    isOpen: true,
    onClose: () => {},
  },
};

export default meta;

type Story = StoryObj<typeof CommentModal>;

export const WriteView: Story = {
  name: '작성 뷰',
  args: {
    view: 'write',
    children: <p className="m-0 font-pixel text-sm text-ink">작성 뷰 콘텐츠 영역</p>,
  },
};

export const ListView: Story = {
  name: '목록 뷰',
  args: {
    view: 'list',
    children: <p className="m-0 font-pixel text-sm text-ink">목록 뷰 콘텐츠 영역</p>,
  },
};
