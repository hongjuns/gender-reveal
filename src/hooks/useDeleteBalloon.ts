import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteBalloon } from '@/lib/api/manage';
import type { GetManagedGroupResult } from '@/types/genderReveal';
import { managedBalloonsQueryKey } from './useManagedBalloons';

export function useDeleteBalloon(code: string) {
  const queryClient = useQueryClient();
  const queryKey = managedBalloonsQueryKey(code);

  return useMutation({
    mutationFn: (id: string) => deleteBalloon(code, id),
    onSuccess: (result, id) => {
      if (result.status === 'ok') {
        // 같은 화면에서는 빈 목록(남은 풍선 없음)을 보여줄 수 있도록 캐시에서 바로 제거한다.
        queryClient.setQueryData<GetManagedGroupResult>(queryKey, (prev) =>
          prev?.status === 'ok'
            ? { ...prev, group: { ...prev.group, balloons: prev.group.balloons.filter((b) => b.id !== id) } }
            : prev,
        );
        return;
      }
      // 이미 삭제된 풍선 등: 서버 상태로 다시 맞춘다.
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
