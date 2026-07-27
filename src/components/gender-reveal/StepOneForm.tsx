'use client';

import { useId, useState, type FormEvent } from 'react';
import { useCreateGenderRevealEvent } from '@/hooks/useCreateGenderRevealEvent';
import type { BabyGender } from '@/types/genderReveal';
import { parseDateInputValue } from '@/lib/date';
import { LinkGeneratedModal } from './LinkGeneratedModal';

const inputClassName =
  'h-12 w-full appearance-none rounded border bg-input-bg px-3 text-base text-ink placeholder:text-ink-muted focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-slate-400';

type FieldErrors = {
  babyNickname: boolean;
  dueDate: boolean;
  recipientName: boolean;
  babyGender: boolean;
};

const initialFieldErrors: FieldErrors = {
  babyNickname: false,
  dueDate: false,
  recipientName: false,
  babyGender: false,
};

function fieldBorderClassName(hasError: boolean) {
  return hasError ? 'border-red-500' : 'border-transparent';
}

export function StepOneForm() {
  const createEvent = useCreateGenderRevealEvent();
  const nicknameId = useId();
  const dueDateId = useId();
  const recipientId = useId();

  const [babyNickname, setBabyNickname] = useState('');
  const [dueDateValue, setDueDateValue] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [babyGender, setBabyGender] = useState<BabyGender | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(initialFieldErrors);
  const [generatedShareLink, setGeneratedShareLink] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const dueDate = parseDateInputValue(dueDateValue);
    const isBabyNicknameEmpty = babyNickname.trim().length === 0;
    const isDueDateInvalid = dueDate === null;
    const isRecipientNameEmpty = recipientName.trim().length === 0;

    setFieldErrors({
      babyNickname: isBabyNicknameEmpty,
      dueDate: isDueDateInvalid,
      recipientName: isRecipientNameEmpty,
      babyGender: babyGender === '',
    });

    if (isBabyNicknameEmpty || isDueDateInvalid || isRecipientNameEmpty || babyGender === '') {
      setError('정보를 모두 입력해주세요');
      return;
    }

    setError(null);
    createEvent.mutate(
      {
        babyNickname: babyNickname.trim(),
        dueDate: dueDateValue,
        recipientName: recipientName.trim(),
        babyGender,
      },
      {
        onSuccess: (data) => {
          setGeneratedShareLink(data.shareLink);
        },
        onError: () => {
          setError('링크 생성에 실패했어요. 다시 시도해주세요');
        },
      },
    );
  }

  return (
    <>
      <form
        className="flex w-[min(420px,100%)] flex-col bg-white p-5"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="flex flex-col items-center gap-0.5">
          <p className="m-0 font-pixel text-[22px] tracking-wide text-ink">Gender-Reveal</p>
          <h1 className="m-0 font-pixel text-4xl text-ink">Come on baby</h1>
        </div>

        <div className="mt-16 flex flex-col gap-3">
          <label className="font-pixel text-base text-ink" htmlFor={nicknameId}>
            아기 태명
          </label>
          <input
            id={nicknameId}
            type="text"
            className={`${inputClassName} ${fieldBorderClassName(fieldErrors.babyNickname)}`}
            value={babyNickname}
            onChange={(event) => {
              setBabyNickname(event.target.value);
              setFieldErrors((prev) => ({ ...prev, babyNickname: false }));
            }}
            placeholder="예시: 깡총이"
          />
        </div>

        <div className="mt-[30px] flex flex-col gap-3">
          <label className="font-pixel text-base text-ink" htmlFor={dueDateId}>
            출산 예정일
          </label>
          <div className="relative">
            <input
              id={dueDateId}
              type="date"
              className={`${inputClassName} text-left ${fieldBorderClassName(fieldErrors.dueDate)} ${dueDateValue ? '' : 'text-transparent'}`}
              value={dueDateValue}
              onChange={(event) => {
                setDueDateValue(event.target.value);
                setFieldErrors((prev) => ({ ...prev, dueDate: false }));
              }}
            />
            {!dueDateValue && (
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-ink-muted">
                연.월.일
              </span>
            )}
          </div>
        </div>

        <div className="mt-[30px] flex flex-col gap-3">
          <label className="font-pixel text-base text-ink" htmlFor={recipientId}>
            받는 사람
          </label>
          <input
            id={recipientId}
            type="text"
            className={`${inputClassName} ${fieldBorderClassName(fieldErrors.recipientName)}`}
            value={recipientName}
            onChange={(event) => {
              setRecipientName(event.target.value);
              setFieldErrors((prev) => ({ ...prev, recipientName: false }));
            }}
            placeholder="예시: 할머니, 할아버지"
          />
        </div>

        <fieldset className="mt-6 border-0 p-0">
          <legend className="mb-3 font-pixel text-base text-ink">아기 성별</legend>
          <div
            className={`flex gap-2.5 rounded ${fieldErrors.babyGender ? 'outline outline-2 outline-offset-2 outline-red-500' : ''}`}
          >
            <label className="relative flex-1 cursor-pointer">
              <input
                type="radio"
                name="babyGender"
                value="son"
                checked={babyGender === 'son'}
                onChange={() => {
                  setBabyGender('son');
                  setFieldErrors((prev) => ({ ...prev, babyGender: false }));
                }}
                className="peer sr-only"
              />
              <span className="flex h-[50px] items-center justify-center rounded bg-boy-bg font-pixel text-base text-ink transition-all peer-checked:ring-2 peer-checked:ring-ink peer-checked:ring-offset-2 peer-focus-visible:ring-2 peer-focus-visible:ring-slate-400">
                아들
              </span>
            </label>
            <label className="relative flex-1 cursor-pointer">
              <input
                type="radio"
                name="babyGender"
                value="daughter"
                checked={babyGender === 'daughter'}
                onChange={() => {
                  setBabyGender('daughter');
                  setFieldErrors((prev) => ({ ...prev, babyGender: false }));
                }}
                className="peer sr-only"
              />
              <span className="flex h-[50px] items-center justify-center rounded bg-girl-bg font-pixel text-base text-ink transition-all peer-checked:ring-2 peer-checked:ring-ink peer-checked:ring-offset-2 peer-focus-visible:ring-2 peer-focus-visible:ring-slate-400">
                딸
              </span>
            </label>
          </div>
        </fieldset>

        {error && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={createEvent.isPending}
          className="mt-3 flex h-[60px] cursor-pointer items-center justify-center gap-2 rounded border-0 bg-ink font-pixel text-base text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {createEvent.isPending ? '링크 생성 중...' : '젠더리빌 풍선 만들기'}
          <span aria-hidden="true">›</span>
        </button>
      </form>

      {generatedShareLink && (
        <LinkGeneratedModal
          shareLink={generatedShareLink}
          onClose={() => setGeneratedShareLink(null)}
        />
      )}
    </>
  );
}
