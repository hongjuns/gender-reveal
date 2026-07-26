import { useMutation } from '@tanstack/react-query';
import { createGenderRevealEvent } from '@/lib/api/events';

export function useCreateGenderRevealEvent() {
  return useMutation({
    mutationFn: createGenderRevealEvent,
  });
}
