import { useQuery } from '@tanstack/react-query';
import { getGenderRevealEvent } from '@/lib/api/events';

export function useGenderRevealEvent(id: string) {
  return useQuery({
    queryKey: ['gender-reveal-event', id],
    queryFn: () => getGenderRevealEvent(id),
    retry: false,
  });
}
