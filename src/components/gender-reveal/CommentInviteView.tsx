'use client';

import Image from 'next/image';

interface CommentInviteViewProps {
  babyNickname: string;
  onWriteClick: () => void;
}

export function CommentInviteView({ babyNickname, onWriteClick }: CommentInviteViewProps) {
  return (
    <div className="flex w-full flex-col items-center">
      <p className="m-0 text-center font-pixel text-xl leading-6 text-ink">
        아직 도착한
        <br />
        덕담이 없어요
      </p>

      <Image
        src="/img/comments/comment-invite-envelope.png"
        alt=""
        width={576}
        height={372}
        unoptimized
        className="mt-8 h-auto w-[192px]"
      />

      <p className="mt-8 whitespace-pre-line text-center font-sans text-sm leading-[18px] text-ink">
        {`${babyNickname}를 기다리는 마음을\n따뜻한 한마디로 남겨주세요 💗`}
      </p>

      <button
        type="button"
        onClick={onWriteClick}
        className="mt-6 h-[61px] w-full cursor-pointer rounded border-0 bg-ink font-pixel text-base text-white transition hover:bg-ink/90"
      >
        덕담 남기기
      </button>
    </div>
  );
}
