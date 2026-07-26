'use client';

import { useEffect, useState } from 'react';
import { useGenderRevealStore } from '@/stores/genderRevealStore';
import { StepOneForm } from '@/components/gender-reveal/StepOneForm';
import { BalloonStage } from '@/components/gender-reveal/BalloonStage';
import { ResultReveal } from '@/components/gender-reveal/ResultReveal';
import { StepSkeleton } from '@/components/gender-reveal/StepSkeleton';

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
