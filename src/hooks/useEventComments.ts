import { useQuery } from '@tanstack/react-query';
import { listEventComments } from '@/lib/api/comments';
import { eventCommentsQueryKey } from './useCreateEventComment';

export function useEventComments(eventId: string) {
  return useQuery({
    queryKey: eventCommentsQueryKey(eventId),
    queryFn: () => listEventComments(eventId),
    retry: false,
  });
}
