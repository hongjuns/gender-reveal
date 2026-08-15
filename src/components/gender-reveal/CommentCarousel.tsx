'use client';

import { useRef, useState, type PointerEvent } from 'react';
import Image from 'next/image';
import { useEventComments } from '@/hooks/useEventComments';
import { CommentEmptyState } from './CommentEmptyState';

const SWIPE_THRESHOLD_PX = 40;

const RANDOM_ILLUSTRATIONS = [
  { src: '/img/step3/random_1.png', width: 482, height: 536 },
  { src: '/img/step3/random_2.png', width: 466, height: 445 },
  { src: '/img/step3/random_3.png', width: 287, height: 415 },
];

function pickRandomIllustrationIndex(excludeIndex: number): number {
  if (RANDOM_ILLUSTRATIONS.length <= 1) {
    return 0;
  }
  let index = excludeIndex;
  while (index === excludeIndex) {
    index = Math.floor(Math.random() * RANDOM_ILLUSTRATIONS.length);
  }
  return index;
}

interface CommentCarouselProps {
  eventId: string;
  babyNickname: string;
  onViewWrite: () => void;
}

export function CommentCarousel({ eventId, babyNickname, onViewWrite }: CommentCarouselProps) {
  const { data, isPending } = useEventComments(eventId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [illustrationIndex, setIllustrationIndex] = useState(0);
  const pointerStartX = useRef<number | null>(null);

  if (isPending) {
    return (
      <div className="flex w-full items-center justify-center py-10">
        <p className="m-0 font-pixel text-sm text-ink-muted">불러오는 중...</p>
      </div>
    );
  }

  if (!data || data.status !== 'ok' || data.comments.length === 0) {
    return <CommentEmptyState babyNickname={babyNickname} onViewWrite={onViewWrite} />;
  }

  const comments = data.comments;
  const activeIndex = Math.min(currentIndex, comments.length - 1);
  const current = comments[activeIndex];
  const illustration = RANDOM_ILLUSTRATIONS[illustrationIndex];
  const canSlide = comments.length > 1;

  function goToIndex(index: number) {
    const clamped = Math.max(0, Math.min(index, comments.length - 1));
    if (clamped === activeIndex) {
      return;
    }
    setCurrentIndex(clamped);
    setIllustrationIndex((prev) => pickRandomIllustrationIndex(prev));
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    pointerStartX.current = event.clientX;
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (pointerStartX.current === null) {
      return;
    }
    const deltaX = event.clientX - pointerStartX.current;
    pointerStartX.current = null;

    if (deltaX <= -SWIPE_THRESHOLD_PX) {
      goToIndex(activeIndex + 1);
    } else if (deltaX >= SWIPE_THRESHOLD_PX) {
      goToIndex(activeIndex - 1);
    }
  }

  return (
    <div className="flex w-full flex-col items-center">
      <p className="m-0 text-center font-pixel text-xl leading-6 text-ink">
        {babyNickname}아 세상에
        <br />
        온 걸 환영한다!
      </p>

      <div className="relative w-full">
        {canSlide && (
          <button
            type="button"
            aria-label="이전 댓글"
            onClick={() => goToIndex(activeIndex - 1)}
            className="absolute left-0 top-1/2 z-10 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center border-0 bg-transparent p-0"
          >
            <Image src="/img/comments/carousel-arrow.svg" alt="" width={15} height={8} className="rotate-90" />
          </button>
        )}

        <div
          className="flex w-full touch-pan-y select-none flex-col items-center px-8"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <Image
            key={illustration.src}
            data-testid="carousel-illustration"
            src={illustration.src}
            alt=""
            width={illustration.width}
            height={illustration.height}
            unoptimized
            draggable={false}
            className="mt-6 h-[116px] w-auto animate-fadeIn object-contain"
          />

          <div className="mt-6 flex min-h-[90px] w-full flex-col items-center justify-center gap-3">
            <p className="m-0 whitespace-pre-line text-center font-pixel text-sm leading-[18px] text-ink-muted">
              {current.content}
            </p>
            <p className="m-0 text-center font-pixel text-base text-ink">{`From. ${current.senderName}`}</p>
          </div>
        </div>

        {canSlide && (
          <button
            type="button"
            aria-label="다음 댓글"
            onClick={() => goToIndex(activeIndex + 1)}
            className="absolute right-0 top-1/2 z-10 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center border-0 bg-transparent p-0"
          >
            <Image src="/img/comments/carousel-arrow.svg" alt="" width={15} height={8} className="-rotate-90" />
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center gap-1.5">
        {comments.map((comment, index) => (
          <button
            key={comment.id}
            type="button"
            aria-label={`${index + 1}번째 댓글로 이동`}
            aria-current={index === activeIndex}
            onClick={() => goToIndex(index)}
            className={`size-2 cursor-pointer rounded-full border-0 p-0 ${
              index === activeIndex ? 'bg-ink' : 'bg-input-bg'
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onViewWrite}
        className="mt-6 h-[61px] w-full cursor-pointer rounded border-0 bg-ink font-pixel text-base text-white transition hover:bg-ink/90"
      >
        덕담 남기기
      </button>
    </div>
  );
}
