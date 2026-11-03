import { useQuery } from '@tanstack/react-query';
import { getManagedGroup } from '@/lib/api/manage';

export function managedBalloonsQueryKey(code: string) {
  return ['managed-balloons', code] as const;
}

export function useManagedBalloons(code: string) {
  return useQuery({
    queryKey: managedBalloonsQueryKey(code),
    queryFn: () => getManagedGroup(code),
    enabled: Boolean(code),
    retry: false,
  });
}
