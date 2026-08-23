import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { UpdateNoticeModal } from './UpdateNoticeModal';

const meta: Meta<typeof UpdateNoticeModal> = {
  title: 'GenderReveal/UpdateNoticeModal',
  component: UpdateNoticeModal,
  parameters: { layout: 'fullscreen' },
  args: {
    onClose: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof UpdateNoticeModal>;

export const Default: Story = {
  name: '기본',
};
