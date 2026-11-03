import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { RecipientListForm } from './RecipientListForm';
import { MAX_RECIPIENTS } from '@/lib/recipients';

const meta: Meta<typeof RecipientListForm> = {
  title: 'GenderReveal/RecipientListForm',
  component: RecipientListForm,
  parameters: { layout: 'centered' },
  args: {
    onBack: fn(),
    onSubmit: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof RecipientListForm>;

export const Default: Story = {
  name: '기본(1칸)',
};

export const ThreeRecipients: Story = {
  name: '받는 사람 3명',
  args: { initialNames: ['할아버지, 할머니', '삼촌들', '이모들아'] },
};

export const MaxRecipients: Story = {
  name: `상한(${MAX_RECIPIENTS}명)`,
  args: { initialNames: Array.from({ length: MAX_RECIPIENTS }, (_, i) => `받는 사람 ${i + 1}`) },
};

export const WithError: Story = {
  name: '생성 실패',
  args: {
    initialNames: ['할머니'],
    errorMessage: '풍선 생성에 실패했어요. 다시 시도해주세요',
  },
};
