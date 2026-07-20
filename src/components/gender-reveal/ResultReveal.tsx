'use client';

import Image from 'next/image';
import { useGenderRevealStore } from '@/stores/genderRevealStore';
import { formatKstDate } from '@/lib/date';

export function ResultReveal() {
  const input = useGenderRevealStore((state) => state.input);
  const restart = useGenderRevealStore((state) => state.restart);

  if (!input) {
    return null;
  }

  const { babyNickname, dueDate, recipientName, babyGender } = input;
  const isSon = babyGender === 'son';
  const genderLabel = isSon ? '아들' : '딸';
  const imageSrc = isSon ? '/img/002.png' : '/img/003.png';
  const imageAlt = isSon ? '남아 일러스트' : '여아 일러스트';
  const pointColorClassName = isSon ? 'text-boy-point' : 'text-girl-point';
  const dateText = formatKstDate(dueDate);

  return (
    <section className="flex w-[min(420px,100%)] animate-fadeIn flex-col items-center gap-6 bg-white p-6 text-center">
      <Image
        src={imageSrc}
        alt={imageAlt}
        width={280}
        height={280}
        className="h-auto w-[min(220px,60vw)]"
      />
      <p
        data-testid="result-message"
        className="m-0 font-pixel text-lg leading-relaxed text-slate-800"
      >
        {recipientName}님! &apos;{babyNickname}&apos;이는{' '}
        <span className={pointColorClassName}>&apos;{genderLabel}&apos;이에요!</span>
        <br />
        <span className={pointColorClassName}>{dateText}</span>에 건강하게 만나요!
      </p>
      <button
        type="button"
        className="cursor-pointer rounded-full border-0 bg-slate-900 px-6 py-3 text-base font-bold text-white transition hover:bg-slate-800"
        onClick={restart}
      >
        다시 시작하기
      </button>
    </section>
  );
}
