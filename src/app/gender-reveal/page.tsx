'use client';

import { useEffect, useState } from 'react';
import { useGenderRevealStore } from '@/stores/genderRevealStore';
import { StepOneForm } from '@/components/gender-reveal/StepOneForm';
import { BalloonStage } from '@/components/gender-reveal/BalloonStage';
import { ResultReveal } from '@/components/gender-reveal/ResultReveal';

function StepSkeleton() {
  return (
    <div
      className="flex w-[min(420px,100%)] flex-col gap-3"
      role="status"
      aria-label="화면을 준비하고 있어요"
    >
      <div className="h-12 animate-pulseSoft rounded-xl bg-slate-400/25" />
      <div className="h-12 animate-pulseSoft rounded-xl bg-slate-400/25" />
      <div className="h-6 w-3/5 animate-pulseSoft rounded-xl bg-slate-400/25" />
    </div>
  );
}

export default function GenderRevealPage() {
  const step = useGenderRevealStore((state) => state.step);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-white p-6">
        <StepSkeleton />
      </main>
    );
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-white p-6">
      {step === 'input' && <StepOneForm />}
      {step === 'interaction' && <BalloonStage />}
      {step === 'result' && <ResultReveal />}
    </main>
  );
}
