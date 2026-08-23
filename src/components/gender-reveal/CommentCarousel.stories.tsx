import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CommentCarousel } from './CommentCarousel';
import { eventCommentsQueryKey } from '@/hooks/useCreateEventComment';
import type { GenderRevealCommentRecord } from '@/types/genderReveal';

const EVENT_ID = '8f14e45f-ceea-467e-8f14-e45fceea467e';

function CommentCarouselPreview({ comments }: { comments: GenderRevealCommentRecord[] }) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    client.setQueryData(eventCommentsQueryKey(EVENT_ID), { status: 'ok', comments });
    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-[350px] rounded-[10px] bg-white p-5">
        <CommentCarousel eventId={EVENT_ID} babyNickname="콩이" onViewWrite={() => {}} />
      </div>
    </QueryClientProvider>
  );
}

const meta: Meta<typeof CommentCarouselPreview> = {
  title: 'GenderReveal/CommentCarousel',
  component: CommentCarouselPreview,
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof CommentCarouselPreview>;

export const SingleComment: Story = {
  name: '댓글 1개',
  args: {
    comments: [
      { id: 'c1', senderName: '할머니', content: '건강하게 자라렴', createdAt: '2026-08-09T00:00:00.000Z' },
    ],
  },
};

export const ManyComments: Story = {
  name: '댓글 여러 개(최대 길이 근접 포함)',
  args: {
    comments: [
      { id: 'c1', senderName: '할머니', content: '건강하게 자라렴', createdAt: '2026-08-09T00:00:00.000Z' },
      { id: 'c2', senderName: '삼촌', content: '행복하길 바라', createdAt: '2026-08-09T01:00:00.000Z' },
      {
        id: 'c3',
        senderName: '이모',
        content: '깡총아 세상에 온 걸 환영한다! 엄마랑 맛있는 거 많이 먹고 무럭무럭 건강하게 자라서 만나자. 할머니가 많이 사랑해',
        createdAt: '2026-08-09T02:00:00.000Z',
      },
    ],
  },
};
