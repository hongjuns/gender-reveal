import { useMutation, useQueryClient } from '@tanstack/react-query';
import { extendBalloon } from '@/lib/api/manage';
import type { GetManagedGroupResult } from '@/types/genderReveal';
import { managedBalloonsQueryKey } from './useManagedBalloons';

export function useExtendBalloon(code: string) {
  const queryClient = useQueryClient();
  const queryKey = managedBalloonsQueryKey(code);

  return useMutation({
    mutationFn: (id: string) => extendBalloon(code, id),
    onSuccess: (result) => {
      if (result.status === 'ok') {
        queryClient.setQueryData<GetManagedGroupResult>(queryKey, (prev) =>
          prev?.status === 'ok'
            ? {
                ...prev,
                group: {
                  ...prev.group,
                  balloons: prev.group.balloons.map((b) => (b.id === result.balloon.id ? result.balloon : b)),
                },
              }
            : prev,
        );
        return;
      }
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
