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
  const message = `${recipientName}님! '${babyNickname}'이는 '${genderLabel}'이에요!\n${formatKstDate(
    dueDate,
  )}에 건강하게 만나요!`;

  return (
    <section className="flex w-[min(420px,100%)] animate-fadeIn flex-col items-center gap-6 rounded-[20px] bg-white p-8 px-6 text-center shadow-[0_10px_30px_rgba(45,212,191,0.25)]">
      <Image
        src={imageSrc}
        alt={imageAlt}
        width={280}
        height={280}
        className="h-auto w-[min(220px,60vw)]"
      />
      <p className="m-0 whitespace-pre-line text-lg font-bold leading-relaxed text-slate-700">
        {message}
      </p>
      <button
        type="button"
        className="cursor-pointer rounded-full border-0 bg-gradient-to-r from-pink-400 to-teal-500 px-6 py-3 text-base font-bold text-white hover:brightness-105"
        onClick={restart}
      >
        다시 시작하기
      </button>
    </section>
  );
}
