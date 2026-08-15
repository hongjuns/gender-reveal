'use client';

import Image from 'next/image';

interface CommentSuccessViewProps {
  babyNickname: string;
  senderName: string;
  onViewComments: () => void;
}

export function CommentSuccessView({ babyNickname, senderName, onViewComments }: CommentSuccessViewProps) {
  return (
    <div className="flex w-full flex-col items-center">
      <p className="m-0 text-center font-pixel text-xl leading-6 text-ink">
        {`${babyNickname}가 ${senderName}님의`}
        <br />
        마음을 받았어요💗
      </p>

      <Image
        src="/img/comments/comment-success-baby.png"
        alt=""
        width={435}
        height={552}
        unoptimized
        className="mt-6 h-[184px] w-auto object-contain"
      />

      <button
        type="button"
        onClick={onViewComments}
        className="mt-8 h-[61px] w-full cursor-pointer rounded border-0 bg-ink font-pixel text-base text-white transition hover:bg-ink/90"
      >
        덕담 보러가기
      </button>
    </div>
  );
}
