'use client';

import { useEffect, type ReactNode } from 'react';
import Image from 'next/image';

interface CommentModalProps {
  isOpen: boolean;
  view: 'invite' | 'write' | 'success' | 'list';
  onClose: () => void;
  children: ReactNode;
}

const VIEW_LABELS: Record<CommentModalProps['view'], string> = {
  invite: '덕담 안내',
  write: '덕담 작성',
  success: '덕담 전달 완료',
  list: '덕담 목록',
};

export function CommentModal({ isOpen, view, onClose, children }: CommentModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={VIEW_LABELS[view]}
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

        {children}
      </div>
    </div>
  );
}
