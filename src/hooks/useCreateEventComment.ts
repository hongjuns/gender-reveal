import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEventComment, type CreateEventCommentInput } from '@/lib/api/comments';
import type { ListCommentsResult } from '@/types/genderReveal';

export function eventCommentsQueryKey(eventId: string) {
  return ['event-comments', eventId] as const;
}

export function useCreateEventComment(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEventCommentInput) => createEventComment(eventId, input),
    onSuccess: (result) => {
      if (result.status !== 'ok') {
        return;
      }
      queryClient.setQueryData<ListCommentsResult>(eventCommentsQueryKey(eventId), (previous) => {
        if (!previous || previous.status !== 'ok') {
          return { status: 'ok', comments: [result.comment] };
        }
        return { status: 'ok', comments: [result.comment, ...previous.comments] };
      });
    },
  });
}
