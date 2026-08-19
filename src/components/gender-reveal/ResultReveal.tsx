'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import html2canvas from 'html2canvas';
import { useGenderRevealStore } from '@/stores/genderRevealStore';
import { useEventComments } from '@/hooks/useEventComments';
import { formatKstDate } from '@/lib/date';
import { CommentModal } from './CommentModal';
import { CommentWriteView } from './CommentWriteView';
import { CommentCarousel } from './CommentCarousel';
import { CommentInviteView } from './CommentInviteView';
import { CommentSuccessView } from './CommentSuccessView';

const SHARE_TIMEOUT_MS = 15000;
const CAPTURE_TIMEOUT_MS = 12000;

function raceWithTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    }),
  ]);
}

function waitForImagesToLoad(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  return Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => resolve(), { once: true });
      });
    }),
  ).then(() => undefined);
}

interface PreparedImage {
  dataUrl: string;
  file: File;
}

interface ResultRevealProps {
  onCreateNew?: () => void;
  eventId?: string;
}

export function ResultReveal({ onCreateNew, eventId }: ResultRevealProps = {}) {
  const input = useGenderRevealStore((state) => state.input);
  const restart = useGenderRevealStore((state) => state.restart);
  const resetAll = useGenderRevealStore((state) => state.resetAll);
  const handleCreateNew = onCreateNew ?? resetAll;

  const captureRef = useRef<HTMLDivElement>(null);
  const heartIconRef = useRef<HTMLImageElement>(null);
  const bubbleWrapRef = useRef<HTMLDivElement>(null);
  const [preparedImage, setPreparedImage] = useState<PreparedImage | null>(null);
  const [isPreparing, setIsPreparing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentModalView, setCommentModalView] = useState<'invite' | 'write' | 'success' | 'list'>('invite');
  const [commentSenderName, setCommentSenderName] = useState('');
  const { data: commentsData } = useEventComments(eventId ?? '', Boolean(eventId));
  const hasComments = commentsData?.status === 'ok' && commentsData.comments.length > 0;

  const babyGender = input?.babyGender;

  // The comment bubble's "덕담 한마디..." text is only ever rasterized by
  // html2canvas correctly by accident — any text baked into that canvas is at
  // the mercy of html2canvas's own re-layout (it re-implements CSS layout in
  // JS rather than using the real browser engine, and is known to be
  // inconsistent, especially on WebKit/Safari). So for the capture itself, the
  // bubble is swapped for a plain heart icon with no text to mis-position.
  // This is done via a direct, synchronous DOM mutation (not React state) so
  // there's no render/commit timing to race against the html2canvas call that
  // immediately follows — React state updates aren't guaranteed to reach the
  // DOM before the next line of code runs, which is exactly what caused this
  // to intermittently still capture the text bubble on iOS Safari.
  function showHeartForCapture() {
    if (heartIconRef.current) {
      heartIconRef.current.style.display = 'block';
    }
    if (bubbleWrapRef.current) {
      bubbleWrapRef.current.style.display = 'none';
    }
  }

  function restoreBubbleAfterCapture() {
    if (heartIconRef.current) {
      heartIconRef.current.style.display = 'none';
    }
    if (bubbleWrapRef.current) {
      bubbleWrapRef.current.style.display = '';
    }
  }

  async function prepareImage(babyGenderValue: string, isCancelled: () => boolean) {
    if (!captureRef.current) {
      return;
    }
    setIsPreparing(true);
    setSaveError(null);
    try {
      await waitForImagesToLoad(captureRef.current);
      if (document.fonts?.ready) {
        // Without this, html2canvas can capture before the custom pixel font
        // finishes loading (font-display: swap renders a fallback font first),
        // which has different line-height metrics and throws off text positioning.
        await document.fonts.ready;
      }

      showHeartForCapture();
      // The heart icon is `priority`-loaded so it should already be ready by
      // now, but confirm rather than assume — it's hidden by default, and a
      // hidden/zero-size image can't rely on lazy-load viewport intersection.
      await waitForImagesToLoad(captureRef.current);
      let canvas: HTMLCanvasElement;
      try {
        canvas = await raceWithTimeout(
          html2canvas(captureRef.current as HTMLElement, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: false,
            imageTimeout: 8000,
          }),
          CAPTURE_TIMEOUT_MS,
          '이미지 캡처 시간이 초과되었습니다.',
        );
      } finally {
        restoreBubbleAfterCapture();
      }
      if (isCancelled()) {
        return;
      }
      const dataUrl = canvas.toDataURL('image/png');
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `gender-reveal-${babyGenderValue}.png`, { type: 'image/png' });
      if (!isCancelled()) {
        setPreparedImage({ dataUrl, file });
      }
    } catch (error) {
      if (isCancelled()) {
        return;
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error('결과 이미지를 준비하지 못했습니다.', error);
      setSaveError(message);
    } finally {
      if (!isCancelled()) {
        setIsPreparing(false);
      }
    }
  }

  // Pre-render the result card into an image as soon as it's shown, rather than
  // at click-time: iOS Safari only allows navigator.share() while the click's
  // "user activation" is still fresh, and the multi-second html2canvas capture
  // was consuming that window, causing share() to reject with NotAllowedError.
  useEffect(() => {
    if (!babyGender) {
      return undefined;
    }
    let cancelled = false;
    prepareImage(babyGender, () => cancelled);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [babyGender]);

  if (!input) {
    return null;
  }

  const { babyNickname, dueDate, recipientName, babyGender: currentBabyGender } = input;
  const isSon = babyGender === 'son';
  const genderLabel = isSon ? '아들' : '딸';
  const imageSrc = isSon ? '/img/step3/baby-son.png' : '/img/step3/baby-daughter.png';
  const imageAlt = isSon ? '남아 일러스트' : '여아 일러스트';
  const pointColorClassName = isSon ? 'text-boy-point' : 'text-girl-point';
  const dateText = formatKstDate(dueDate);
  const imageDimensions = isSon
    ? { width: 243, height: 335, sizeClassName: 'w-[min(168px,43vw)]' }
    : { width: 298, height: 347, sizeClassName: 'w-[min(200px,51vw)]' };
  const heartIconSrc = isSon ? '/img/step2/heart-blue.png' : '/img/step2/heart-pink.png';

  async function handleSaveResult() {
    if (isPreparing || isSaving) {
      return;
    }
    if (!preparedImage) {
      // A previous prepare attempt failed (e.g. timed out) — retry on this click
      // rather than leaving the button permanently dead. The user taps again
      // once it succeeds to actually share/download.
      await prepareImage(currentBabyGender, () => false);
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const { dataUrl, file } = preparedImage;

      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        await raceWithTimeout(
          navigator.share({ files: [file], title: '젠더리빌 결과' }),
          SHARE_TIMEOUT_MS,
          '공유 시트 응답 시간이 초과되었습니다.',
        );
        return;
      }

      const link = document.createElement('a');
      link.download = file.name;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error('결과 이미지 저장에 실패했습니다.', error);
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="relative flex w-[min(420px,100%)] animate-fadeIn flex-col items-center bg-white text-center">
      <div ref={captureRef} className="flex w-full flex-col items-center bg-white p-6">
        <p
          data-testid="result-message"
          className="m-0 whitespace-pre-line font-pixel text-[22px] leading-[29px] text-ink"
        >
          {`${babyNickname}는\n귀엽고 사랑스러운\n`}
          <span className={pointColorClassName}>{`'${genderLabel}'이에요!`}</span>
        </p>

        <div
          className={`relative mt-6 flex w-full justify-center ${isPreparing ? '' : 'animate-float'}`}
          style={{ animationDelay: '0.3s' }}
        >
          {/* Hidden by default; shown only for the brief html2canvas capture via a
              direct ref mutation in prepareImage (see showHeartForCapture). */}
          <Image
            ref={heartIconRef}
            src={heartIconSrc}
            alt=""
            width={141}
            height={126}
            aria-hidden="true"
            unoptimized
            priority
            style={{ display: 'none' }}
            className="h-auto w-[min(70px,18vw)]"
          />
          <div ref={bubbleWrapRef} className="relative aspect-[588/219] w-[min(196px,50vw)]">
            {eventId ? (
              <button
                type="button"
                aria-label="덕담 남기기"
                className="absolute inset-0 block w-full cursor-pointer border-0 bg-transparent p-0"
                onClick={() => {
                  setCommentModalView(hasComments ? 'list' : 'invite');
                  setIsCommentModalOpen(true);
                }}
              >
                <Image
                  src="/img/step3/comment-bubble.png"
                  alt=""
                  width={588}
                  height={219}
                  unoptimized
                  className="h-auto w-full"
                />
                <div className="pointer-events-none absolute inset-x-0 top-0 flex h-[70%] items-center justify-center">
                  <span className="whitespace-nowrap font-pixel text-sm tracking-[-0.7px] text-ink">
                    덕담 한마디 남겨 주세요♥
                  </span>
                </div>
              </button>
            ) : (
              <>
                <Image
                  src="/img/step3/comment-bubble.png"
                  alt=""
                  width={588}
                  height={219}
                  aria-hidden="true"
                  unoptimized
                  className="h-auto w-full"
                />
                <div className="pointer-events-none absolute inset-x-0 top-0 flex h-[70%] items-center justify-center">
                  <span className="whitespace-nowrap font-pixel text-sm tracking-[-0.7px] text-ink">
                    덕담 한마디 남겨 주세요♥
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <Image
          src={imageSrc}
          alt={imageAlt}
          width={imageDimensions.width}
          height={imageDimensions.height}
          unoptimized
          className={`mt-3 h-auto ${imageDimensions.sizeClassName} ${isPreparing ? '' : 'animate-float'}`}
          style={{ animationDelay: '0.3s' }}
        />

        <p
          data-testid="result-closing"
          className="m-0 mt-4 whitespace-pre-line font-pixel leading-[30px] text-ink"
        >
          <span className="text-lg">{`${recipientName}!`}</span>
          {'\n'}
          <span className={`text-2xl ${pointColorClassName}`}>{`${dateText}에`}</span>
          {'\n'}
          <span className="text-lg">건강하게 만나요 :)</span>
        </p>
      </div>

      <div className="flex w-full flex-col items-center px-6 pb-6">
        <div className="mt-0 flex w-full gap-2.5">
          <button
            type="button"
            className="h-[60px] flex-1 cursor-pointer rounded border-0 bg-input-bg font-pixel text-base text-ink transition hover:bg-input-bg/70"
            onClick={restart}
          >
            {'<  뒤로가기'}
          </button>
          <button
            type="button"
            className="h-[60px] flex-1 cursor-pointer rounded border-0 bg-ink font-pixel text-base text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleSaveResult}
            disabled={isPreparing || isSaving}
          >
            {isSaving ? '저장 중...' : isPreparing ? '이미지 준비 중...' : '결과 저장하기'}
          </button>
        </div>

        {saveError && (
          <p className="m-0 mt-3 whitespace-pre-line font-pixel text-sm text-red-600" role="alert">
            {`저장에 실패했어요: ${saveError}`}
          </p>
        )}

        <button
          type="button"
          className="mt-[30px] cursor-pointer border-0 bg-transparent p-0 font-pixel text-sm text-ink-muted underline decoration-1 underline-offset-4"
          onClick={handleCreateNew}
        >
          젠더리빌 새로 만들기
        </button>
      </div>

      {eventId && (
        <CommentModal
          isOpen={isCommentModalOpen}
          view={commentModalView}
          onClose={() => setIsCommentModalOpen(false)}
        >
          {commentModalView === 'invite' ? (
            <CommentInviteView babyNickname={babyNickname} onWriteClick={() => setCommentModalView('write')} />
          ) : commentModalView === 'write' ? (
            <CommentWriteView
              eventId={eventId}
              babyNickname={babyNickname}
              onSubmitted={(senderName) => {
                setCommentSenderName(senderName);
                setCommentModalView('success');
              }}
            />
          ) : commentModalView === 'success' ? (
            <CommentSuccessView
              babyNickname={babyNickname}
              senderName={commentSenderName}
              onViewComments={() => setCommentModalView('list')}
            />
          ) : (
            <CommentCarousel
              eventId={eventId}
              babyNickname={babyNickname}
              onViewWrite={() => setCommentModalView('write')}
            />
          )}
        </CommentModal>
      )}
    </section>
  );
}
