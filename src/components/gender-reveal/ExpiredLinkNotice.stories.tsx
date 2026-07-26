import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ExpiredLinkNotice } from './ExpiredLinkNotice';

const meta: Meta<typeof ExpiredLinkNotice> = {
  title: 'GenderReveal/ExpiredLinkNotice',
  component: ExpiredLinkNotice,
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof ExpiredLinkNotice>;

export const Default: Story = {
  name: '기본',
};
