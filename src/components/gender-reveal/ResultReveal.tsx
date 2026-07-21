'use client';

import Image from 'next/image';
import { useGenderRevealStore } from '@/stores/genderRevealStore';
import { formatKstDate } from '@/lib/date';

export function ResultReveal() {
  const input = useGenderRevealStore((state) => state.input);
  const restart = useGenderRevealStore((state) => state.restart);
  const resetAll = useGenderRevealStore((state) => state.resetAll);

  if (!input) {
    return null;
  }

  const { babyNickname, dueDate, recipientName, babyGender } = input;
  const isSon = babyGender === 'son';
  const genderLabel = isSon ? '아들' : '딸';
  const imageSrc = isSon ? '/img/step3/baby-son.png' : '/img/step3/baby-daughter.png';
  const bubbleSrc = isSon ? '/img/step3/bubble-son.png' : '/img/step3/bubble-daughter.png';
  const imageAlt = isSon ? '남아 일러스트' : '여아 일러스트';
  const pointColorClassName = isSon ? 'text-boy-point' : 'text-girl-point';
  const dateText = formatKstDate(dueDate);

  return (
    <section className="flex w-[min(420px,100%)] animate-fadeIn flex-col items-center bg-white p-6 text-center">
      <p
        data-testid="result-message"
        className="m-0 whitespace-pre-line font-pixel text-[22px] leading-[29px] text-ink"
      >
        {`'${babyNickname}'이는\n귀엽고 사랑스러운\n`}
        <span className={pointColorClassName}>{`'${genderLabel}'이에요!`}</span>
      </p>

      <Image
        src={bubbleSrc}
        alt=""
        width={931}
        height={771}
        aria-hidden="true"
        className="mt-6 h-auto w-[min(70px,18vw)]"
      />

      <Image
        src={imageSrc}
        alt={imageAlt}
        width={500}
        height={500}
        className="-mt-1 h-auto w-[92%]"
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

      <div className="mt-10 flex w-full gap-2.5">
        <button
          type="button"
          className="h-[60px] flex-1 cursor-pointer rounded border-0 bg-ink font-pixel text-base text-white transition hover:bg-ink/90"
          onClick={restart}
        >
          {'<  뒤로가기'}
        </button>
        <button
          type="button"
          className="h-[60px] flex-1 cursor-pointer rounded border-0 bg-ink font-pixel text-base text-white transition hover:bg-ink/90"
        >
          결과 저장하기
        </button>
      </div>

      <button
        type="button"
        className="mt-6 cursor-pointer border-0 bg-transparent p-0 font-pixel text-sm text-ink-muted underline decoration-1 underline-offset-4"
        onClick={resetAll}
      >
        젠더리빌 새로 만들기
      </button>
      
    </section>
  );
}
