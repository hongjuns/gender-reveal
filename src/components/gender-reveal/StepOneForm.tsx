'use client';

import { useId, useState, type FormEvent } from 'react';
import { useGenderRevealStore } from '@/stores/genderRevealStore';
import type { BabyGender } from '@/types/genderReveal';
import { parseDateInputValue } from '@/lib/date';

const inputClassName =
  'rounded-[10px] border-0 bg-gray-100 px-3 py-3 text-base text-slate-800 placeholder:text-gray-400 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-slate-400';

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
      className="flex w-[min(420px,100%)] flex-col gap-6 bg-white p-6"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="flex flex-col items-center gap-1">
        <p className="m-0 font-pixel text-sm tracking-wide text-slate-700">Gender-Reveal</p>
        <h1 className="m-0 font-pixel text-3xl text-slate-900">Come on baby</h1>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-slate-800" htmlFor={nicknameId}>
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
        <label className="text-sm font-bold text-slate-800" htmlFor={dueDateId}>
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
        <label className="text-sm font-bold text-slate-800" htmlFor={recipientId}>
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
        <legend className="mb-2 text-sm font-bold text-slate-800">아기 성별</legend>
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
            <span className="flex items-center justify-center rounded-2xl bg-boy-bg py-3 text-base font-bold text-slate-700 transition-all peer-checked:ring-2 peer-checked:ring-slate-800 peer-checked:ring-offset-2 peer-focus-visible:ring-2 peer-focus-visible:ring-slate-400">
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
            <span className="flex items-center justify-center rounded-2xl bg-girl-bg py-3 text-base font-bold text-slate-700 transition-all peer-checked:ring-2 peer-checked:ring-slate-800 peer-checked:ring-offset-2 peer-focus-visible:ring-2 peer-focus-visible:ring-slate-400">
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
        className="flex cursor-pointer items-center justify-center gap-2 rounded-full border-0 bg-slate-900 p-4 text-base font-bold text-white transition hover:bg-slate-800"
      >
        시작하기
        <span aria-hidden="true">›</span>
      </button>
    </form>
  );
}
