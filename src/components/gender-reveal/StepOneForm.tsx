'use client';

import { useId, useState, type FormEvent } from 'react';
import { useGenderRevealStore } from '@/stores/genderRevealStore';
import type { BabyGender } from '@/types/genderReveal';
import { parseDateInputValue } from '@/lib/date';

const inputClassName =
  'rounded-[10px] border border-teal-200 px-3 py-2.5 text-base focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-teal-400';

export function StepOneForm() {
  const setInput = useGenderRevealStore((state) => state.setInput);
  const nicknameId = useId();
  const dueDateId = useId();
  const recipientId = useId();

  const [babyNickname, setBabyNickname] = useState('');
  const [dueDateValue, setDueDateValue] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [babyGender, setBabyGender] = useState<BabyGender | ''>('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const dueDate = parseDateInputValue(dueDateValue);

    if (
      babyNickname.trim().length === 0 ||
      dueDate === null ||
      recipientName.trim().length === 0 ||
      babyGender === ''
    ) {
      setError('정보를 모두 입력해주세요');
      return;
    }

    const result = setInput({
      babyNickname: babyNickname.trim(),
      dueDate,
      recipientName: recipientName.trim(),
      babyGender,
    });

    if (!result.ok) {
      setError('정보를 모두 입력해주세요');
      return;
    }

    setError(null);
  }

  return (
    <form
      className="flex w-[min(420px,100%)] flex-col gap-5 rounded-[20px] bg-white p-8 px-6 shadow-[0_10px_30px_rgba(244,114,182,0.15)]"
      onSubmit={handleSubmit}
      noValidate
    >
      <h1 className="m-0 text-center text-xl font-bold text-slate-700"> 우리 아기 Gender-Reveal 🎉  </h1>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-600" htmlFor={nicknameId}>
          아기 태명
        </label>
        <input
          id={nicknameId}
          type="text"
          className={inputClassName}
          value={babyNickname}
          onChange={(event) => setBabyNickname(event.target.value)}
          placeholder="예: 콩이"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-600" htmlFor={dueDateId}>
          출산 예정일
        </label>
        <input
          id={dueDateId}
          type="date"
          className={inputClassName}
          value={dueDateValue}
          onChange={(event) => setDueDateValue(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-600" htmlFor={recipientId}>
          받는 사람
        </label>
        <input
          id={recipientId}
          type="text"
          className={inputClassName}
          value={recipientName}
          onChange={(event) => setRecipientName(event.target.value)}
          placeholder="예: 지민"
        />
      </div>

      <fieldset className="border-0 p-0">
        <legend className="mb-2 text-sm font-semibold text-gray-600">아기 성별</legend>
        <div className="flex gap-3">
          <label className="relative flex-1 cursor-pointer">
            <input
              type="radio"
              name="babyGender"
              value="son"
              checked={babyGender === 'son'}
              onChange={() => setBabyGender('son')}
              className="peer sr-only"
            />
            <span className="flex items-center justify-center rounded-full border-2 border-teal-200 bg-white py-2.5 text-base font-semibold text-gray-500 transition-colors peer-checked:border-teal-500 peer-checked:bg-teal-500 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-teal-300 peer-focus-visible:ring-offset-2">
              아들
            </span>
          </label>
          <label className="relative flex-1 cursor-pointer">
            <input
              type="radio"
              name="babyGender"
              value="daughter"
              checked={babyGender === 'daughter'}
              onChange={() => setBabyGender('daughter')}
              className="peer sr-only"
            />
            <span className="flex items-center justify-center rounded-full border-2 border-pink-200 bg-white py-2.5 text-base font-semibold text-gray-500 transition-colors peer-checked:border-pink-400 peer-checked:bg-pink-400 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-pink-300 peer-focus-visible:ring-offset-2">
              딸
            </span>
          </label>
        </div>
      </fieldset>

      {error && (
        <p className="m-0 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="cursor-pointer rounded-full border-0 bg-gradient-to-r from-pink-400 to-teal-500 p-3 text-base font-bold text-white hover:brightness-105"
      >
        시작하기
      </button>
    </form>
  );
}
