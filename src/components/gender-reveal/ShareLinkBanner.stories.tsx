import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ShareLinkBanner } from './ShareLinkBanner';

const meta: Meta<typeof ShareLinkBanner> = {
  title: 'GenderReveal/ShareLinkBanner',
  component: ShareLinkBanner,
  parameters: { layout: 'centered' },
  args: {
    shareLink: 'https://come-on-baby.example.com/gender-reveal/8f14e45f-ceea-467e',
  },
};

export default meta;

type Story = StoryObj<typeof ShareLinkBanner>;

export const Default: Story = {
  name: '기본',
};

export const CopyInteraction: Story = {
  name: '복사 버튼 클릭',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await user.click(canvas.getByRole('button', { name: '복사' }));

    // 실제 클립보드 권한은 브라우저/환경마다 달라 성공/실패 문구 중 하나가 노출되는지만 확인한다
    await expect(canvas.getByRole('status')).toBeInTheDocument();
  },
};
