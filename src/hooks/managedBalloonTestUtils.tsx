import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { GetManagedGroupResult, ManagedBalloon } from '@/types/genderReveal';

export function buildBalloon(overrides: Partial<ManagedBalloon> = {}): ManagedBalloon {
  return {
    id: 'a',
    recipientName: '할머니',
    shareLink: 'http://localhost/gender-reveal/a',
    linkExpiresAt: '2999-01-01T00:00:00.000Z',
    isExpired: false,
    canExtend: true,
    ...overrides,
  };
}

export function buildGroup(balloons: ManagedBalloon[]): GetManagedGroupResult {
  return {
    status: 'ok',
    group: { babyNickname: '콩이', dueDate: '2026-12-25', babyGender: 'son', balloons },
  };
}

export function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { Wrapper, queryClient };
}
