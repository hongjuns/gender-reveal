'use client';

interface DeleteBalloonConfirmModalProps {
  recipientName: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteBalloonConfirmModal({
  recipientName,
  isDeleting = false,
  onConfirm,
  onCancel,
}: DeleteBalloonConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="풍선 삭제 확인"
        className="flex w-[350px] max-w-full flex-col items-center rounded-[10px] bg-white px-5 pb-6 pt-[48px]"
      >
        <div className="text-center font-pixel text-sm leading-[18px] text-ink">
          <p className="m-0">&apos;{recipientName}&apos;에게 보낸 풍선을 삭제할까요?</p>
          <p className="m-0 mt-2 text-ink-muted">
            삭제하면 남겨진 댓글도 함께 사라지고
            <br />
            되돌릴 수 없어요.
          </p>
        </div>
        <div className="mt-[30px] flex w-full gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="h-[61px] flex-1 cursor-pointer rounded border-0 bg-input-bg font-pixel text-base text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="h-[61px] flex-1 cursor-pointer rounded border-0 bg-ink font-pixel text-base text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  );
}
