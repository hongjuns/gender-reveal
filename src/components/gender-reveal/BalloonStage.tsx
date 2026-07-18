'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useGenderRevealStore } from '@/stores/genderRevealStore';
import { ConfettiBurst } from './ConfettiBurst';

const BURST_ANIMATION_MS = 600;
const SHAKE_ANIMATION_MS = 400;

export function BalloonStage() {
  const babyNickname = useGenderRevealStore((state) => state.input?.babyNickname ?? '');
  const touchCount = useGenderRevealStore((state) => state.touchCount);
  const isBursting = useGenderRevealStore((state) => state.isBursting);
  const touchBalloon = useGenderRevealStore((state) => state.touchBalloon);
  const completeBurstTransition = useGenderRevealStore(
    (state) => state.completeBurstTransition,
  );

  const [isShaking, setIsShaking] = useState(false);
  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isBursting) {
      return undefined;
    }
    const timer = setTimeout(() => {
      completeBurstTransition();
    }, BURST_ANIMATION_MS);
    return () => clearTimeout(timer);
  }, [isBursting, completeBurstTransition]);

  useEffect(
    () => () => {
      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current);
      }
    },
    [],
  );

  function handleTouch() {
    if (isBursting) {
      return;
    }
    touchBalloon();

    setIsShaking(true);
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current);
    }
    shakeTimeoutRef.current = setTimeout(() => setIsShaking(false), SHAKE_ANIMATION_MS);
  }

  const scale = 1 + Math.min(touchCount, 9) * 0.04;
  const motionClassName = isBursting ? 'animate-burst' : isShaking ? 'animate-shake' : '';

  return (
    <section className="flex w-[min(420px,100%)] flex-col items-center gap-6 text-center">
      <p className="m-0 text-xl font-bold text-slate-700">{`'${babyNickname}'은 아들일까요? 딸일까요?`}</p>

      <div className="relative">
        <button
          type="button"
          className={`cursor-pointer border-0 bg-transparent p-0 [transform:scale(var(--balloon-scale,1))] transition-transform duration-150 ease-out active:[transform:scale(calc(var(--balloon-scale,1)*0.96))_rotate(-2deg)] disabled:cursor-default ${motionClassName}`}
          style={{ '--balloon-scale': scale } as React.CSSProperties}
          onClick={handleTouch}
          aria-label={`풍선 터치하기 (${touchCount}/10)`}
          disabled={isBursting}
        >
          <Image
            src="/img/001.png"
            alt="검정 풍선"
            width={240}
            height={320}
            priority
            className="h-auto w-[min(240px,60vw)]"
          />
        </button>

        {isBursting && <ConfettiBurst />}
      </div>

      <p className="m-0 text-sm text-gray-500">{touchCount} / 10</p>
    </section>
  );
}
