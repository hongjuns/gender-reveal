'use client';

import { useId, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { MAX_RECIPIENTS, formatRecipientNumber } from '@/lib/recipients';

const inputClassName =
  'h-12 w-full appearance-none rounded border bg-input-bg pl-[15px] pr-11 text-base text-ink placeholder:text-ink-muted focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-slate-400';

interface RecipientField {
  key: number;
  value: string;
}

interface RecipientListFormProps {
  initialNames?: string[];
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onBack: (names: string[]) => void;
  onSubmit: (names: string[]) => void;
}

function toFields(names: string[]): RecipientField[] {
  const source = names.length > 0 ? names : [''];
  return source.map((value, index) => ({ key: index, value }));
}

export function RecipientListForm({
  initialNames = [],
  isSubmitting = false,
  errorMessage = null,
  onBack,
  onSubmit,
}: RecipientListFormProps) {
  const idPrefix = useId();
  const [fields, setFields] = useState<RecipientField[]>(() => toFields(initialNames));
  const [nextKey, setNextKey] = useState(() => Math.max(initialNames.length, 1));
  const [emptyKeys, setEmptyKeys] = useState<Set<number>>(new Set());

  const canAdd = fields.length < MAX_RECIPIENTS;
  const names = fields.map((field) => field.value);

  function updateField(key: number, value: string) {
    setFields((prev) => prev.map((field) => (field.key === key ? { ...field, value } : field)));
    setEmptyKeys((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  function addField() {
    if (!canAdd) return;
    setFields((prev) => [...prev, { key: nextKey, value: '' }]);
    setNextKey((prev) => prev + 1);
  }

  function removeField(key: number) {
    setFields((prev) => (prev.length <= 1 ? prev : prev.filter((field) => field.key !== key)));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const empty = new Set(fields.filter((field) => field.value.trim().length === 0).map((field) => field.key));
    setEmptyKeys(empty);
    if (empty.size > 0) return;

    onSubmit(fields.map((field) => field.value.trim()));
  }

  const showEmptyError = emptyKeys.size > 0;

  return (
    <form
      className="flex w-[min(420px,100%)] flex-col bg-white p-5"
      onSubmit={handleSubmit}
      noValidate
    >
      <button
        type="button"
        onClick={() => onBack(names)}
        aria-label="뒤로 가기"
        className="flex size-10 cursor-pointer items-center justify-center rounded-3xl border border-solid border-[#f8f8f8] bg-[rgba(245,245,245,0.2)] p-0"
      >
        <Image src="/img/recipients/back-arrow.svg" alt="" width={17} height={14} />
      </button>

      <ul className="m-0 mt-[21px] flex list-none flex-col gap-[30px] p-0">
        {fields.map((field, index) => {
          const inputId = `${idPrefix}-recipient-${field.key}`;
          const number = formatRecipientNumber(index);
          const isEmpty = emptyKeys.has(field.key);
          return (
            <li key={field.key} className="flex flex-col gap-3">
              <label className="font-pixel text-base text-ink" htmlFor={inputId}>
                받는 사람 {number}
              </label>
              <div className="relative">
                <input
                  id={inputId}
                  type="text"
                  className={`${inputClassName} ${isEmpty ? 'border-red-500' : 'border-transparent'}`}
                  value={field.value}
                  onChange={(event) => updateField(field.key, event.target.value)}
                  placeholder="예시: 할머니, 할아버지"
                  aria-invalid={isEmpty || undefined}
                />
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => removeField(field.key)}
                    aria-label={`받는 사람 ${number} 삭제`}
                    className="absolute right-[15px] top-1/2 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center border-0 bg-transparent p-0"
                  >
                    <span className="inline-flex rotate-45">
                      <Image src="/img/recipients/remove-icon.svg" alt="" width={14} height={14} />
                    </span>
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={addField}
        disabled={!canAdd}
        aria-label="받는 사람 추가"
        className="relative mx-auto mt-[76px] flex size-16 cursor-pointer items-center justify-center border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Image
          src="/img/recipients/add-circle.svg"
          alt=""
          width={64}
          height={64}
          className="absolute inset-0"
        />
        <Image src="/img/recipients/add-plus.svg" alt="" width={20} height={20} className="relative" />
      </button>
      {!canAdd && (
        <p className="m-0 mt-2 text-center text-sm text-ink-muted">
          받는 사람은 최대 {MAX_RECIPIENTS}명까지 추가할 수 있어요
        </p>
      )}

      {(showEmptyError || errorMessage) && (
        <p className="m-0 mt-6 text-sm text-red-600" role="alert">
          {showEmptyError ? '받는 사람을 모두 입력해주세요' : errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="relative mt-[76px] flex h-[60px] cursor-pointer items-center justify-center rounded border-0 bg-ink font-pixel text-base text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        젠더리빌 풍선 만들기
        <span aria-hidden="true" className="absolute right-[15px] text-lg">
          &gt;
        </span>
      </button>
    </form>
  );
}
