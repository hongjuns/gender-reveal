const CONTACT_ADMIN_URL = 'https://blog.naver.com/hyundgn/224387559374';

export function ExpiredLinkNotice() {
  return (
    <section className="flex w-[min(420px,100%)] flex-col items-center gap-3 bg-white p-6 text-center">
      <p className="m-0 font-pixel text-2xl text-ink">링크가 만료되었어요</p>
      <p className="m-0 whitespace-pre-line text-base text-ink-muted">
        {'이 링크는 생성 후 7일이 지나 더 이상 사용할 수 없어요.\n 링크 연장이 필요하다면 관리자에게 문의해주세요.'}
      </p>
      <a
        href={CONTACT_ADMIN_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex h-[50px] w-full max-w-[280px] cursor-pointer items-center justify-center rounded border-0 bg-ink font-pixel text-base text-white transition hover:bg-ink/90"
      >
        관리자에게 문의하기
      </a>
    </section>
  );
}
