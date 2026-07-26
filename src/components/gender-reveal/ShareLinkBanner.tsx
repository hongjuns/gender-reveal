'use client';

import { useState } from 'react';

interface ShareLinkBannerProps {
  shareLink: string;
}

export function ShareLinkBanner({ shareLink }: ShareLinkBannerProps) {
  const [copyState, setCopyState] = useState<'idle' | 'success' | 'error'>('idle');

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopyState('success');
    } catch {
      setCopyState('error');
    }
  }

  return (
    <div className="flex w-full flex-col gap-2 rounded bg-input-bg p-3" role="status">
      <p className="m-0 font-pixel text-sm text-ink">공유 링크가 생성됐어요</p>
      <div className="flex items-center gap-2">
        <p className="m-0 flex-1 truncate text-sm text-ink-muted">{shareLink}</p>
        <button
          type="button"
          onClick={handleCopy}
          className="h-9 shrink-0 cursor-pointer rounded border-0 bg-ink px-3 font-pixel text-sm text-white transition hover:bg-ink/90"
        >
          복사
        </button>
      </div>
      {copyState === 'success' && (
        <p className="m-0 text-sm text-ink-muted">링크를 복사했어요</p>
      )}
      {copyState === 'error' && (
        <p className="m-0 text-sm text-red-600" role="alert">
          복사에 실패했어요. 링크를 직접 선택해 복사해주세요
        </p>
      )}
    </div>
  );
}
