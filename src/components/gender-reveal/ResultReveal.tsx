'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import html2canvas from 'html2canvas';
import { useGenderRevealStore } from '@/stores/genderRevealStore';
import { formatKstDate } from '@/lib/date';

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

export function ResultReveal() {
  const input = useGenderRevealStore((state) => state.input);
  const restart = useGenderRevealStore((state) => state.restart);
  const resetAll = useGenderRevealStore((state) => state.resetAll);

  const captureRef = useRef<HTMLDivElement>(null);
  const [preparedImage, setPreparedImage] = useState<PreparedImage | null>(null);
  const [isPreparing, setIsPreparing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const babyGender = input?.babyGender;

  async function prepareImage(babyGenderValue: string, isCancelled: () => boolean) {
    if (!captureRef.current) {
      return;
    }
    setIsPreparing(true);
    setSaveError(null);
    try {
      await waitForImagesToLoad(captureRef.current);
      const canvas = await raceWithTimeout(
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
  const bubbleSrc = isSon ? '/img/step3/bubble-son.png' : '/img/step3/bubble-daughter.png';
  const imageAlt = isSon ? '남아 일러스트' : '여아 일러스트';
  const pointColorClassName = isSon ? 'text-boy-point' : 'text-girl-point';
  const dateText = formatKstDate(dueDate);
  const imageDimensions = isSon
    ? { width: 243, height: 335, sizeClassName: 'w-[min(168px,43vw)]' }
    : { width: 298, height: 347, sizeClassName: 'w-[min(200px,51vw)]' };

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
    <section className="flex w-[min(420px,100%)] animate-fadeIn flex-col items-center bg-white text-center">
      <div ref={captureRef} className="flex w-full flex-col items-center bg-white p-6">
        <p
          data-testid="result-message"
          className="m-0 whitespace-pre-line font-pixel text-[22px] leading-[29px] text-ink"
        >
          {`${babyNickname}는\n귀엽고 사랑스러운\n`}
          <span className={pointColorClassName}>{`'${genderLabel}'이에요!`}</span>
        </p>

        <Image
          src={bubbleSrc}
          alt=""
          width={931}
          height={771}
          aria-hidden="true"
          unoptimized
          className={`mt-6 h-auto w-[min(70px,18vw)] ${isPreparing ? '' : 'animate-float'}`}
        />

        <Image
          src={imageSrc}
          alt={imageAlt}
          width={imageDimensions.width}
          height={imageDimensions.height}
          unoptimized
          className={`-mt-1 h-auto ${imageDimensions.sizeClassName} ${isPreparing ? '' : 'animate-float'}`}
          style={{ animationDelay: '0.3s' }}
        />

        <p
          data-testid="result-closing"
          className="m-0 mt-4 whitespace-pre-line font-pixel leading-[30px] text-ink"
        >
          <span className="text-lg">{`${recipientName}님!`}</span>
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
            className="h-[60px] flex-1 cursor-pointer rounded border-0 bg-ink font-pixel text-base text-white transition hover:bg-ink/90"
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
          className="mt-3 cursor-pointer border-0 bg-transparent p-0 font-pixel text-sm text-ink-muted underline decoration-1 underline-offset-4"
          onClick={resetAll}
        >
          젠더리빌 새로 만들기
        </button>
      </div>
    </section>
  );
}
