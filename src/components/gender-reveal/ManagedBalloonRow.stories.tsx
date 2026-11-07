import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { ManagedBalloonRow } from './ManagedBalloonRow';

const meta: Meta<typeof ManagedBalloonRow> = {
  title: 'GenderReveal/ManagedBalloonRow',
  component: ManagedBalloonRow,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <ul className="m-0 w-[350px] list-none p-0">
        <Story />
      </ul>
    ),
  ],
  args: {
    index: 0,
    balloon: {
      id: 'a',
      recipientName: '할아버지, 할머니',
      shareLink: 'https://baby.example.com/gender-reveal/a',
      linkExpiresAt: '2026-11-10T00:00:00.000Z',
      isExpired: false,
      canExtend: true,
    },
    onDelete: fn(),
    onCopied: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof ManagedBalloonRow>;

export const Default: Story = { name: '기본' };
