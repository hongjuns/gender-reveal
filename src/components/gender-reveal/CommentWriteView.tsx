'use client';

import { useState, type ChangeEvent } from 'react';
import { useCreateEventComment } from '@/hooks/useCreateEventComment';

const CONTENT_MAX_LENGTH = 100;
const SENDER_NAME_MAX_LENGTH = 20;

const PRESET_TAGS = ['건강하게 자라렴❤️', '너의 모든 날이 빛나길✨', '세상에 와줘서 고마워!'];

interface CommentWriteViewProps {
  eventId: string;
  babyNickname: string;
  onSubmitted?: (senderName: string) => void;
}

export function CommentWriteView({ eventId, babyNickname, onSubmitted }: CommentWriteViewProps) {
  const [content, setContent] = useState('');
  const [senderName, setSenderName] = useState('');
  const [chipError, setChipError] = useState<string | null>(null);
  const mutation = useCreateEventComment(eventId);

  const submitResult = mutation.data;
  const isBlocked = submitResult?.status === 'not_found' || submitResult?.status === 'expired';
  const canSubmit = content.trim().length > 0 && senderName.trim().length > 0 && !mutation.isPending;

  function handleContentChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setContent(event.target.value.slice(0, CONTENT_MAX_LENGTH));
    setChipError(null);
  }

  function handleSenderNameChange(event: ChangeEvent<HTMLInputElement>) {
    setSenderName(event.target.value.slice(0, SENDER_NAME_MAX_LENGTH));
  }

  function handleChipClick(tag: string) {
    if ((content + tag).length > CONTENT_MAX_LENGTH) {
      setChipError('내용이 100자를 초과해 추가할 수 없어요.');
      return;
    }
    setChipError(null);
    setContent((prev) => prev + tag);
  }

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }
    const trimmedSenderName = senderName.trim();
    const result = await mutation.mutateAsync({
      senderName: trimmedSenderName,
      content: content.trim(),
    });
    if (result.status === 'ok') {
      setContent('');
      setSenderName('');
      onSubmitted?.(trimmedSenderName);
    }
  }

  if (isBlocked) {
    return (
      <div className="flex w-full flex-col items-center gap-2 py-6 text-center">
        <p className="m-0 font-pixel text-base text-ink">
          {submitResult?.status === 'expired' ? '링크가 만료되었어요' : '더 이상 사용할 수 없는 링크예요'}
        </p>
        <p className="m-0 font-pixel text-sm text-ink-muted">덕담을 남길 수 없어요.</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center">
      <p className="m-0 text-center font-pixel text-xl leading-6 text-ink">
        {babyNickname}에게
        <br />
        덕담 한마디
      </p>

      <div className="mt-2 w-full">
        <div className="relative">
          <textarea
            value={content}
            onChange={handleContentChange}
            maxLength={CONTENT_MAX_LENGTH}
            placeholder="곧 만날 아기에게 해주고 싶은 말을 적어주세요 :)"
            className="h-[132px] w-full resize-none rounded border border-[#cdcdcd] p-3 pb-7 font-sans text-base text-ink outline-none placeholder:text-ink-muted sm:text-sm"
          />
          <span className="pointer-events-none absolute bottom-2 right-3 font-pixel text-sm text-ink-muted">
            {content.length}/{CONTENT_MAX_LENGTH}자
          </span>
        </div>
        {chipError && (
          <p className="m-0 mt-1 font-pixel text-xs text-red-600" role="alert">
            {chipError}
          </p>
        )}
      </div>

      <input
        type="text"
        value={senderName}
        onChange={handleSenderNameChange}
        maxLength={SENDER_NAME_MAX_LENGTH}
        placeholder="보내는 사람"
        className="mt-3 h-10 w-full rounded border border-[#cdcdcd] px-3 font-sans text-base text-ink outline-none placeholder:text-ink-muted sm:text-sm"
      />

      <div className="mt-3 flex w-full flex-wrap gap-2">
        {PRESET_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleChipClick(tag)}
            className="cursor-pointer rounded border-0 bg-input-bg px-3 py-2 font-pixel text-xs text-ink-muted"
          >
            {tag}
          </button>
        ))}
      </div>

      {submitResult?.status === 'invalid' && (
        <p className="m-0 mt-3 font-pixel text-sm text-red-600" role="alert">
          {submitResult.message}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="mt-4 h-[61px] w-full cursor-pointer rounded border-0 bg-ink font-pixel text-base text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        완료하기
      </button>
    </div>
  );
}
