'use client';

import { useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { useManagedBalloons } from '@/hooks/useManagedBalloons';
import { useDeleteBalloon } from '@/hooks/useDeleteBalloon';
import { useExtendBalloon } from '@/hooks/useExtendBalloon';
import { BalloonManager } from '@/components/gender-reveal/BalloonManager';
import { ManageLinkModal } from '@/components/gender-reveal/ManageLinkModal';
import { StepSkeleton } from '@/components/gender-reveal/StepSkeleton';

interface ManagePageProps {
  params: { code: string };
  searchParams: { created?: string };
}

export default function ManagePage({ params, searchParams }: ManagePageProps) {
  const router = useRouter();
  const { code } = params;
  const managePath = `/gender-reveal/manage/${code}`;

  // 생성 직후(?created)에만 관리 링크 보관 모달을 자동으로 띄운다.
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(searchParams.created !== undefined);
  const [notice, setNotice] = useState<string | null>(null);

  const { data, isPending, isError } = useManagedBalloons(code);
  const deleteMutation = useDeleteBalloon(code);
  const extendMutation = useExtendBalloon(code);

  if (isPending) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-white p-6">
        <StepSkeleton />
      </main>
    );
  }

  if (data?.status === 'not_found') {
    notFound();
  }

  if (isError || data?.status !== 'ok') {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-white p-6">
        <section className="flex w-[min(420px,100%)] flex-col items-center gap-2 bg-white p-6 text-center">
          <p className="m-0 font-pixel text-2xl text-ink">일시적인 오류가 발생했어요</p>
          <p className="m-0 text-base text-ink-muted">잠시 후 다시 시도해주세요</p>
        </section>
      </main>
    );
  }

  async function handleDelete(id: string) {
    setNotice(null);
    try {
      const result = await deleteMutation.mutateAsync(id);
      if (result.status === 'not_found') {
        setNotice('이미 삭제된 풍선이에요');
      }
    } catch {
      setNotice('삭제에 실패했어요. 다시 시도해주세요');
    }
  }

  function handleExtend(id: string) {
    setNotice(null);
    extendMutation.mutate(id, {
      onSuccess: (result) => {
        if (result.status === 'already_extended') setNotice('이미 연장한 풍선이에요');
        if (result.status === 'not_found') setNotice('이미 삭제된 풍선이에요');
      },
      onError: () => setNotice('연장에 실패했어요. 다시 시도해주세요'),
    });
  }

  const busyId = deleteMutation.isPending
    ? deleteMutation.variables ?? null
    : extendMutation.isPending
      ? extendMutation.variables ?? null
      : null;

  return (
    <main className="flex min-h-[100dvh] justify-center bg-white">
      <BalloonManager
        balloons={data.group.balloons}
        busyId={busyId}
        notice={notice}
        onDelete={handleDelete}
        onExtend={handleExtend}
        onCreateNew={() => router.push('/gender-reveal')}
      />
      {isLinkModalOpen && (
        <ManageLinkModal
          manageLink={`${typeof window === 'undefined' ? '' : window.location.origin}${managePath}`}
          onCopied={() => {
            setIsLinkModalOpen(false);
            router.replace(managePath);
          }}
        />
      )}
    </main>
  );
}
