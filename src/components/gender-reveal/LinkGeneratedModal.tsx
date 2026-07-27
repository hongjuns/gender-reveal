'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface LinkGeneratedModalProps {
  shareLink: string;
  onClose: () => void;
}

const primaryButtonClassName =
  'flex h-[61px] w-full cursor-pointer items-center justify-center rounded border-0 bg-ink font-pixel text-base text-white transition hover:bg-ink/90';

export function LinkGeneratedModal({ shareLink, onClose }: LinkGeneratedModalProps) {
  const [copyError, setCopyError] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 2400);
    return () => clearTimeout(timer);
  }, [showToast]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopyError(false);
      setShowToast(true);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="풍선이 완성되었어요"
        className="relative flex w-[350px] max-w-full flex-col items-center rounded-[10px] bg-white px-5 pb-5 pt-[49px]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-5 top-[29px] flex size-[21px] cursor-pointer items-center justify-center border-0 bg-transparent p-0"
        >
          <span className="inline-flex size-[15px] -rotate-45 items-center justify-center">
            <Image src="/img/step1/close-icon.svg" alt="" width={15} height={15} />
          </span>
        </button>

        <p className="m-0 text-center font-pixel text-base text-ink">🎈 풍선이 완성되었어요!</p>

        <div className="mt-[30px] text-center font-pixel text-sm leading-4 text-ink-muted">
          <p className="m-0">링크를 복사하여 카카오톡이나</p>
          <p className="m-0">문자로 공유해보세요.</p>
        </div>

        <div className="mt-[30px] flex w-full flex-col gap-2">
          <button type="button" onClick={handleCopy} className={primaryButtonClassName}>
            공유 링크 복사
          </button>
        </div>

        {copyError && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            복사에 실패했어요. 링크를 직접 선택해 복사해주세요
          </p>
        )}
      </div>

      {showToast && (
        <div
          role="status"
          className="fixed inset-x-0 top-8 z-[60] flex justify-center px-4"
          onClick={(event) => event.stopPropagation()}
        >
          <p className="m-0 rounded bg-ink px-4 py-2 font-pixel text-sm text-white shadow-lg">
            복사가 완료 되었습니다.
          </p>
        </div>
      )}
    </div>
  );
}
