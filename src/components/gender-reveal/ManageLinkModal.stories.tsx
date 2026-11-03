import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { ManageLinkModal } from './ManageLinkModal';

const meta: Meta<typeof ManageLinkModal> = {
  title: 'GenderReveal/ManageLinkModal',
  component: ManageLinkModal,
  parameters: { layout: 'fullscreen' },
  args: {
    manageLink: 'https://baby.bunnyverse.app/gender-reveal/manage/8f14e45f-ceea-467e-9c5f-1d2b3c4d5e6f',
    onCopied: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof ManageLinkModal>;

export const Default: Story = { name: '기본' };
