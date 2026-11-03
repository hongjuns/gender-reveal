import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { BalloonManager } from './BalloonManager';
import type { ManagedBalloon } from '@/types/genderReveal';

function balloon(id: string, recipientName: string, overrides: Partial<ManagedBalloon> = {}): ManagedBalloon {
  return {
    id,
    recipientName,
    shareLink: `https://baby.example.com/gender-reveal/${id}`,
    linkExpiresAt: '2026-11-10T00:00:00.000Z',
    isExpired: false,
    canExtend: true,
    ...overrides,
  };
}

const meta: Meta<typeof BalloonManager> = {
  title: 'GenderReveal/BalloonManager',
  component: BalloonManager,
  parameters: { layout: 'fullscreen' },
  args: {
    balloons: [
      balloon('a', '할아버지, 할머니'),
      balloon('b', '삼촌들'),
      balloon('c', '이모들아'),
      balloon('d', '아빠!'),
    ],
    onDelete: fn(),
    onExtend: fn(),
    onCreateNew: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof BalloonManager>;

export const Default: Story = { name: '받는 사람 4명' };

export const Single: Story = {
  name: '받는 사람 1명',
  args: { balloons: [balloon('a', '할아버지, 할머니')] },
};

export const WithExpired: Story = {
  name: '만료·연장 포함',
  args: {
    balloons: [
      balloon('a', '할아버지, 할머니', { isExpired: true, linkExpiresAt: '2026-10-01T00:00:00.000Z' }),
      balloon('b', '삼촌들', { canExtend: false }),
    ],
  },
};

export const Empty: Story = {
  name: '남은 풍선 없음',
  args: { balloons: [] },
};
