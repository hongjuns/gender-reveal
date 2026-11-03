import Image from 'next/image';

interface BalloonCreatingViewProps {
  babyNickname: string;
}

// Figma 258-81 기준 하트 배치(화면 중앙 기준 x 오프셋, top).
const HEARTS = [
  { color: 'blue', width: 58, height: 52, className: 'left-[calc(50%-77px)] top-[160px] [animation-delay:0s]' },
  { color: 'pink', width: 47, height: 43, className: 'left-[calc(50%+32px)] top-[232px] [animation-delay:0.2s]' },
  { color: 'blue', width: 28, height: 25, className: 'left-[calc(50%-19px)] top-[301px] [animation-delay:0.4s]' },
  { color: 'pink', width: 36, height: 33, className: 'left-[calc(50%-79px)] top-[369px] [animation-delay:0.6s]' },
  { color: 'pink', width: 22, height: 20, className: 'left-[calc(50%+45px)] top-[402px] [animation-delay:0.8s]' },
  { color: 'blue', width: 25, height: 22, className: 'left-[calc(50%-4px)] top-[472px] [animation-delay:1s]' },
] as const;

export function BalloonCreatingView({ babyNickname }: BalloonCreatingViewProps) {
  return (
    <section
      role="status"
      aria-live="polite"
      className="relative h-[844px] max-h-[100dvh] w-[min(420px,100%)] bg-white"
    >
      {HEARTS.map((heart, index) => (
        <Image
          key={index}
          src={`/img/step2/heart-${heart.color}.png`}
          alt=""
          width={heart.width}
          height={heart.height}
          className={`absolute animate-heartFloat ${heart.className}`}
        />
      ))}
      <div className="absolute left-1/2 top-[calc(50%+171px)] -translate-x-1/2 whitespace-nowrap text-center font-pixel text-base leading-5 text-ink">
        <p className="m-0">{babyNickname}의</p>
        <p className="m-0">풍선이 만들어지고 있어요.</p>
      </div>
    </section>
  );
}
