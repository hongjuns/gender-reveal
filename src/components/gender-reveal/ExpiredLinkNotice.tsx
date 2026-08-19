export function ExpiredLinkNotice() {
  return (
    <section className="flex w-[min(420px,100%)] flex-col items-center gap-3 bg-white p-6 text-center">
      <p className="m-0 font-pixel text-2xl text-ink">만료된 링크예요</p>
      <p className="m-0 whitespace-pre-line text-base text-ink-muted">
        {'생성된 지 7일이 지나 더 이상 사용할 수 없어요.\n새 링크를 요청해주세요.'}
      </p>
    </section>
  );
}
