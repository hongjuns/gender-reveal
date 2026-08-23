'use client';

import Image from 'next/image';

interface CommentEmptyStateProps {
  babyNickname: string;
  onViewWrite: () => void;
}

export function CommentEmptyState({ babyNickname, onViewWrite }: CommentEmptyStateProps) {
  return (
    <div className="flex w-full flex-col items-center">
      <p className="m-0 text-center font-pixel text-xl leading-6 text-ink">
        {babyNickname}아 세상에
        <br />
        온 걸 환영한다!
      </p>

      <Image
        src="/img/comments/heart-hands.png"
        alt=""
        width={189}
        height={126}
        unoptimized
        className="mt-6 h-auto w-[189px]"
      />

      <p className="mt-6 font-pixel text-sm text-ink-muted">아직 남겨진 덕담이 없어요</p>

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
