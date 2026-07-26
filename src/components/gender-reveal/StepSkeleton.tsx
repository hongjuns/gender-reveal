export function StepSkeleton() {
  return (
    <div
      className="flex w-[min(420px,100%)] flex-col gap-3"
      role="status"
      aria-label="화면을 준비하고 있어요"
    >
      <div className="h-12 animate-pulseSoft rounded-xl bg-slate-400/25" />
      <div className="h-12 animate-pulseSoft rounded-xl bg-slate-400/25" />
      <div className="h-6 w-3/5 animate-pulseSoft rounded-xl bg-slate-400/25" />
    </div>
  );
}
