'use client';

import { useEffect } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { useGenderRevealEvent } from '@/hooks/useGenderRevealEvent';
import { useGenderRevealStore } from '@/stores/genderRevealStore';
import { BalloonStage } from '@/components/gender-reveal/BalloonStage';
import { ResultReveal } from '@/components/gender-reveal/ResultReveal';
import { ShareLinkBanner } from '@/components/gender-reveal/ShareLinkBanner';
import { ExpiredLinkNotice } from '@/components/gender-reveal/ExpiredLinkNotice';
import { StepSkeleton } from '@/components/gender-reveal/StepSkeleton';

interface SharedGenderRevealPageProps {
  params: { id: string };
  searchParams: { created?: string };
}

export default function SharedGenderRevealPage({ params, searchParams }: SharedGenderRevealPageProps) {
  const router = useRouter();
  const { id } = params;
  const isCreated = searchParams.created !== undefined;

  const { data, isPending, isError } = useGenderRevealEvent(id);
  const hydrateFromEvent = useGenderRevealStore((state) => state.hydrateFromEvent);
  const step = useGenderRevealStore((state) => state.step);

  const event = data?.status === 'ok' ? data.event : undefined;

  useEffect(() => {
    if (event) {
      hydrateFromEvent(event);
    }
    // 참여자가 창을 다시 포커스해 재조회가 일어나도 진행 중인 풍선 터치 카운트가
    // 초기화되지 않도록, id가 바뀔 때만(최초 진입 시) 하이드레이션한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id]);

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

  if (isError) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-white p-6">
        <section className="flex w-[min(420px,100%)] flex-col items-center gap-2 bg-white p-6 text-center">
          <p className="m-0 font-pixel text-2xl text-ink">일시적인 오류가 발생했어요</p>
          <p className="m-0 text-base text-ink-muted">잠시 후 다시 시도해주세요</p>
        </section>
      </main>
    );
  }

  if (data?.status === 'expired') {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-white p-6">
        <ExpiredLinkNotice />
      </main>
    );
  }

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-white p-6">
      {isCreated && event && (
        <div className="w-[min(420px,100%)]">
          <ShareLinkBanner shareLink={event.shareLink} />
        </div>
      )}
      {step === 'interaction' && <BalloonStage />}
      {step === 'result' && <ResultReveal onCreateNew={() => router.push('/gender-reveal')} />}
    </main>
  );
}
