'use client';

import { useId, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateGenderRevealEvent } from '@/hooks/useCreateGenderRevealEvent';
import type { BabyGender } from '@/types/genderReveal';
import { parseDateInputValue } from '@/lib/date';
import { UpdateNoticeModal } from './UpdateNoticeModal';
import { RecipientListForm } from './RecipientListForm';
import { BalloonCreatingView } from './BalloonCreatingView';

// 저장이 빨리 끝나도 생성 중 화면을 최소 이 시간만큼 보여준다(spec FR-004a).
export const MIN_CREATING_VIEW_MS = 2000;

const inputClassName =
  'h-12 w-full appearance-none rounded border bg-input-bg px-3 text-base text-ink placeholder:text-ink-muted focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-slate-400';

type FieldErrors = {
  babyNickname: boolean;
  dueDate: boolean;
  babyGender: boolean;
};

const initialFieldErrors: FieldErrors = {
  babyNickname: false,
  dueDate: false,
  babyGender: false,
};

type Stage = 'common' | 'recipients' | 'creating';

function fieldBorderClassName(hasError: boolean) {
  return hasError ? 'border-red-500' : 'border-transparent';
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function StepOneForm() {
  const router = useRouter();
  const createEvent = useCreateGenderRevealEvent();
  const nicknameId = useId();
  const dueDateId = useId();

  const [stage, setStage] = useState<Stage>('common');
  const [babyNickname, setBabyNickname] = useState('');
  const [dueDateValue, setDueDateValue] = useState('');
  const [babyGender, setBabyGender] = useState<BabyGender | ''>('');
  const [recipientNames, setRecipientNames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(initialFieldErrors);
  const [isUpdateNoticeOpen, setIsUpdateNoticeOpen] = useState(true);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const dueDate = parseDateInputValue(dueDateValue);
    const isBabyNicknameEmpty = babyNickname.trim().length === 0;
    const isDueDateInvalid = dueDate === null;

    setFieldErrors({
      babyNickname: isBabyNicknameEmpty,
      dueDate: isDueDateInvalid,
      babyGender: babyGender === '',
    });

    if (isBabyNicknameEmpty || isDueDateInvalid || babyGender === '') {
      setError('정보를 모두 입력해주세요');
      return;
    }

    setError(null);
    setStage('recipients');
  }

  async function handleCreate(names: string[]) {
    if (babyGender === '') {
      setStage('common');
      return;
    }

    setRecipientNames(names);
    setCreateError(null);
    setStage('creating');

    try {
      const [result] = await Promise.all([
        createEvent.mutateAsync({
          babyNickname: babyNickname.trim(),
          dueDate: dueDateValue,
          babyGender,
          recipientNames: names,
        }),
        wait(MIN_CREATING_VIEW_MS),
      ]);
      router.push(`/gender-reveal/manage/${result.code}?created`);
    } catch {
      setCreateError('풍선 생성에 실패했어요. 다시 시도해주세요');
      setStage('recipients');
    }
  }

  if (stage === 'creating') {
    return <BalloonCreatingView babyNickname={babyNickname.trim()} />;
  }

  if (stage === 'recipients') {
    return (
      <RecipientListForm
        initialNames={recipientNames}
        errorMessage={createError}
        isSubmitting={createEvent.isPending}
        onBack={(names) => {
          setRecipientNames(names);
          setCreateError(null);
          setStage('common');
        }}
        onSubmit={handleCreate}
      />
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

        <fieldset className="mt-[30px] border-0 p-0">
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
          className="relative mt-[60px] flex h-[60px] cursor-pointer items-center justify-center rounded border-0 bg-ink font-pixel text-base text-white transition hover:bg-ink/90"
        >
          받는 사람 입력
          <span aria-hidden="true" className="absolute right-[15px] text-lg">
            &gt;
          </span>
        </button>
      </form>

      {isUpdateNoticeOpen && (
        <UpdateNoticeModal onClose={() => setIsUpdateNoticeOpen(false)} />
      )}
    </>
  );
}
