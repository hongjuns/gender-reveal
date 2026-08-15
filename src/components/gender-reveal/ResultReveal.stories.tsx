import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ResultReveal } from './ResultReveal';
import { useGenderRevealStore } from '@/stores/genderRevealStore';

function QueryClientDecorator(Story: () => ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <Story />
    </QueryClientProvider>
  );
}

function seedState(babyGender: 'son' | 'daughter') {
  useGenderRevealStore.setState(
    {
      step: 'result',
      input: {
        babyNickname: '콩이',
        dueDate: new Date(2026, 11, 25),
        recipientName: '지민',
        babyGender,
      },
      touchCount: 10,
      isBursting: false,
    },
    false,
  );
}

const meta: Meta<typeof ResultReveal> = {
  title: 'GenderReveal/ResultReveal',
  component: ResultReveal,
  parameters: { layout: 'centered' },
  decorators: [QueryClientDecorator],
};

export default meta;

type Story = StoryObj<typeof ResultReveal>;

export const SonResult: Story = {
  name: '아들 결과',
  play: async () => {
    seedState('son');
  },
};

export const DaughterResult: Story = {
  name: '딸 결과',
  play: async () => {
    seedState('daughter');
  },
};

export const WithCommentModal: Story = {
  name: '댓글 모달 오픈 (댓글 0건 - 안내 → 작성)',
  args: {
    eventId: '8f14e45f-ceea-467e-8f14-e45fceea467e',
  },
  play: async ({ canvasElement }) => {
    seedState('son');
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    const heartButton = await canvas.findByRole('button', { name: '덕담 남기기' });
    await user.click(heartButton);

    const dialog = await canvas.findByRole('dialog', { name: '덕담 안내' });
    await user.click(within(dialog).getByRole('button', { name: '덕담 남기기' }));

    await expect(canvas.getByRole('dialog', { name: '덕담 작성' })).toBeInTheDocument();
  },
};
