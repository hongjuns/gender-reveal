import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, userEvent, within } from 'storybook/test';
import { CommentWriteView } from './CommentWriteView';

const meta: Meta<typeof CommentWriteView> = {
  title: 'GenderReveal/CommentWriteView',
  component: CommentWriteView,
  parameters: { layout: 'centered' },
  args: {
    eventId: '8f14e45f-ceea-467e-8f14-e45fceea467e',
    onViewList: () => {},
  },
  decorators: [
    (Story) => {
      const queryClient = new QueryClient();
      return (
        <QueryClientProvider client={queryClient}>
          <div className="w-[350px] rounded-[10px] bg-white p-5">
            <Story />
          </div>
        </QueryClientProvider>
      );
    },
  ],
};

export default meta;

type Story = StoryObj<typeof CommentWriteView>;

export const Empty: Story = {
  name: '빈 상태',
};

export const NearLimit: Story = {
  name: '글자수 임계치 근접',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await user.click(canvas.getByPlaceholderText(/곧 만날 아기에게/));
    await user.paste('가'.repeat(95));

    await expect(canvas.getByText('95/100자')).toBeInTheDocument();
  },
};

export const ValidationError: Story = {
  name: '검증 에러',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await user.click(canvas.getByPlaceholderText(/곧 만날 아기에게/));
    await user.paste('가'.repeat(95));
    await user.click(canvas.getByRole('button', { name: '#행복하길 바라' }));

    await expect(canvas.getByText(/100자를 초과/)).toBeInTheDocument();
  },
};
