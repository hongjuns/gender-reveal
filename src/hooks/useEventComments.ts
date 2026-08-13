import { useQuery } from '@tanstack/react-query';
import { listEventComments } from '@/lib/api/comments';
import { eventCommentsQueryKey } from './useCreateEventComment';

export function useEventComments(eventId: string, enabled = true) {
  return useQuery({
    queryKey: eventCommentsQueryKey(eventId),
    queryFn: () => listEventComments(eventId),
    enabled,
    retry: false,
  });
}
