'use client';

import { useState } from 'react';

interface ManageLinkModalProps {
  manageLink: string;
  onCopied: () => void;
}

/**
 * 관리 링크 보관 모달(Figma 278-112). 닫기 버튼·바깥 클릭·Esc로 닫히지 않고,
 * 링크 복사에 성공해야 사라진다. 클립보드가 막힌 환경에서는 직접 복사 후 닫을 수 있다.
 */
export function ManageLinkModal({ manageLink, onCopied }: ManageLinkModalProps) {
  const [copyFailed, setCopyFailed] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(manageLink);
      onCopied();
    } catch {
      setCopyFailed(true);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="관리 링크 보관 안내"
        className="flex w-[350px] max-w-full flex-col items-center rounded-[10px] bg-white px-5 pb-6 pt-[68px]"
      >
        <div className="text-center font-pixel text-sm leading-[18px] text-ink">
          <p className="m-0">현재 페이지로</p>
          <p className="m-0">돌아오기 위해 아래 링크를 복사하여</p>
          <p className="m-0">별도 보관해주세요.</p>
        </div>

        <input
          type="text"
          readOnly
          value={manageLink}
          aria-label="관리 링크"
          onFocus={(event) => event.currentTarget.select()}
          className="mt-[43px] h-12 w-full truncate rounded border-0 bg-input-bg px-5 text-base text-ink-muted focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-slate-400"
        />

        <button
          type="button"
          onClick={handleCopy}
          className="mt-[14px] flex h-[61px] w-full cursor-pointer items-center justify-center rounded border-0 bg-ink font-pixel text-base text-white transition hover:bg-ink/90"
        >
          링크 복사하기
        </button>

        {copyFailed && (
          <>
            <p className="m-0 mt-3 text-center text-sm text-red-600" role="alert">
              복사에 실패했어요. 위 링크를 직접 선택해 복사해주세요
            </p>
            <button
              type="button"
              onClick={onCopied}
              className="mt-2 cursor-pointer border-0 bg-transparent p-0 text-sm text-ink-muted underline underline-offset-2"
            >
              직접 보관했어요
            </button>
          </>
        )}
      </div>
    </div>
  );
}
