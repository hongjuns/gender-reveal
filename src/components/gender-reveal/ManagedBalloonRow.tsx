'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatRecipientNumber } from '@/lib/recipients';
import type { ManagedBalloon } from '@/types/genderReveal';

interface ManagedBalloonRowProps {
  index: number;
  balloon: ManagedBalloon;
  isBusy?: boolean;
  onCopied?: () => void;
  onDelete: (balloon: ManagedBalloon) => void;
}

export function ManagedBalloonRow({ index, balloon, isBusy = false, onCopied, onDelete }: ManagedBalloonRowProps) {
  const [copyFailed, setCopyFailed] = useState(false);
  const number = formatRecipientNumber(index);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(balloon.shareLink);
      setCopyFailed(false);
      onCopied?.();
    } catch {
      setCopyFailed(true);
    }
  }

  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="font-pixel text-base text-ink">받는 사람 {number}</span>
        <button
          type="button"
          onClick={() => onDelete(balloon)}
          disabled={isBusy}
          aria-label={`받는 사람 ${number} ${balloon.recipientName} 삭제`}
          className="mr-[23px] cursor-pointer border-0 bg-transparent p-0 text-[10px] font-medium text-ink-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          삭제
        </button>
      </div>

      <div className="flex h-12 items-center justify-between gap-3 rounded bg-input-bg pl-[15px] pr-[23px]">
        <span className="truncate text-base text-ink">{balloon.recipientName}</span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`${balloon.recipientName} 링크 복사하기`}
          className="flex shrink-0 cursor-pointer items-center gap-[5px] border-0 bg-transparent p-0 text-[10px] font-medium text-ink"
        >
          링크 복사하기
          <Image src="/img/manage/copy-icon.svg" alt="" width={12.5} height={15} />
        </button>
      </div>

      {copyFailed && (
        <div role="alert" className="mt-2 flex flex-col gap-1 text-sm">
          <p className="m-0 text-red-600">복사에 실패했어요. 링크를 직접 선택해 복사해주세요</p>
          <p className="m-0 select-all break-all text-ink-muted">{balloon.shareLink}</p>
        </div>
      )}
    </li>
  );
}
