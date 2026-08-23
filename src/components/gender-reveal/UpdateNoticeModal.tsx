'use client';

import { useEffect } from 'react';
import Image from 'next/image';

interface UpdateNoticeModalProps {
  onClose: () => void;
}

const UPDATE_LOG_URL = 'https://blog.naver.com/hyundgn/224387559374';

export function UpdateNoticeModal({ onClose }: UpdateNoticeModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="업데이트 안내"
        className="relative flex w-[350px] max-w-full flex-col items-center overflow-hidden rounded-[10px] bg-white"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-5 top-[15px] z-10 flex size-[21px] cursor-pointer items-center justify-center border-0 bg-transparent p-0"
        >
          <span className="inline-flex size-[15px] -rotate-45 items-center justify-center">
            <Image src="/img/step1/close-icon.svg" alt="" width={15} height={15} />
          </span>
        </button>

        <div className="relative h-[351px] w-full">
          <Image
            src="/img/step1/update-notice-illustration.jpg"
            alt="덕담 기능 업데이트: 신규 기능 추가, 아기에게 따뜻한 마음을 남겨보세요"
            fill
            className="object-cover object-top"
            priority
          />
        </div>

        <div className="w-full p-5">
          <a
            href={UPDATE_LOG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[61px] w-full cursor-pointer items-center justify-center rounded border-0 bg-ink font-pixel text-base text-white transition hover:bg-ink/90"
          >
            업데이트 과정 보러가기
          </a>
        </div>
      </div>
    </div>
  );
}
