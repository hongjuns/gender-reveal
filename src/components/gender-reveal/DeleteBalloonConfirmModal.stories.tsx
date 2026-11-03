import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { DeleteBalloonConfirmModal } from './DeleteBalloonConfirmModal';

const meta: Meta<typeof DeleteBalloonConfirmModal> = {
  title: 'GenderReveal/DeleteBalloonConfirmModal',
  component: DeleteBalloonConfirmModal,
  parameters: { layout: 'fullscreen' },
  args: { recipientName: '삼촌들', onConfirm: fn(), onCancel: fn() },
};

export default meta;

type Story = StoryObj<typeof DeleteBalloonConfirmModal>;

export const Default: Story = { name: '기본' };

export const Deleting: Story = { name: '삭제 중', args: { isDeleting: true } };
