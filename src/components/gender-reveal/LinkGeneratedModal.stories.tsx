import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { LinkGeneratedModal } from './LinkGeneratedModal';

const meta: Meta<typeof LinkGeneratedModal> = {
  title: 'GenderReveal/LinkGeneratedModal',
  component: LinkGeneratedModal,
  parameters: { layout: 'fullscreen' },
  args: {
    shareLink: 'https://come-on-baby.example.com/gender-reveal/8f14e45f-ceea-467e',
    onClose: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof LinkGeneratedModal>;

export const Default: Story = {
  name: '기본',
};

export const CopyInteraction: Story = {
  name: '공유 링크 복사 클릭',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await user.click(canvas.getByRole('button', { name: '공유 링크 복사' }));

    await expect(await canvas.findByText('복사가 완료 되었습니다.')).toBeInTheDocument();
  },
};
