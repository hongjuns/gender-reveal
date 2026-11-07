'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ManagedBalloon } from '@/types/genderReveal';
import { ManagedBalloonRow } from './ManagedBalloonRow';
import { DeleteBalloonConfirmModal } from './DeleteBalloonConfirmModal';

interface BalloonManagerProps {
  balloons: ManagedBalloon[];
  busyId?: string | null;
  notice?: string | null;
  onDelete: (id: string) => Promise<unknown> | void;
  onExtend?: (id: string) => void;
  onCreateNew: () => void;
}

export function BalloonManager({
  balloons,
  busyId = null,
  notice = null,
  onDelete,
  onExtend,
  onCreateNew,
}: BalloonManagerProps) {
  const [deleteTarget, setDeleteTarget] = useState<ManagedBalloon | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  useEffect(() => {
    if (!showCopiedToast) return;
    const timer = setTimeout(() => setShowCopiedToast(false), 2400);
    return () => clearTimeout(timer);
  }, [showCopiedToast]);

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteTarget.id);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <section className="flex w-[min(420px,100%)] flex-col bg-white px-5 pb-10 pt-[85px]">
      <div className="text-center font-pixel text-ink">
        <h1 className="m-0 text-xl font-normal">풍선이 생성되었어요!</h1>
        <p className="m-0 mt-1 text-sm">링크를 복사하여 풍선 이벤트를 선물하세요.</p>
      </div>

      <Image
        src="/img/manage/gift-balloon.png"
        alt=""
        width={240}
        height={277}
        priority
        className="mx-auto mt-[25px]"
      />

      {notice && (
        <p className="m-0 mt-6 text-center text-sm text-red-600" role="alert">
          {notice}
        </p>
      )}

      {balloons.length > 0 ? (
        <ul className="m-0 mt-[34px] flex list-none flex-col gap-[30px] p-0">
          {balloons.map((balloon, index) => (
            <ManagedBalloonRow
              key={balloon.id}
              index={index}
              balloon={balloon}
              isBusy={busyId === balloon.id}
              onCopied={() => setShowCopiedToast(true)}
              onDelete={setDeleteTarget}
              onExtend={onExtend ? (target) => onExtend(target.id) : undefined}
            />
          ))}
        </ul>
      ) : (
        <div className="mt-11 flex flex-col items-center gap-4 text-center">
          <p className="m-0 font-pixel text-base text-ink">남은 풍선이 없어요</p>
          <button
            type="button"
            onClick={onCreateNew}
            className="relative flex h-[60px] w-full cursor-pointer items-center justify-center rounded border-0 bg-ink font-pixel text-base text-white transition hover:bg-ink/90"
          >
            새 풍선 만들기
            <span aria-hidden="true" className="absolute right-[15px] text-lg">
              &gt;
            </span>
          </button>
        </div>
      )}

      {deleteTarget && (
        <DeleteBalloonConfirmModal
          recipientName={deleteTarget.recipientName}
          isDeleting={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {showCopiedToast && (
        <div role="status" className="fixed inset-x-0 top-8 z-[60] flex justify-center px-4">
          <p className="m-0 rounded bg-ink px-4 py-2 font-pixel text-sm text-white shadow-lg">
            복사가 완료 되었습니다.
          </p>
        </div>
      )}
    </section>
  );
}
