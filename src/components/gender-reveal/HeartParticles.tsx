import Image from 'next/image';

interface HeartSpot {
  id: number;
  color: 'pink' | 'blue';
  width: number;
  height: number;
  className: string;
  delay: string;
}

// Figma 258-214 기준, 풍선(160×217) 왼쪽 위 모서리에서의 위치.
const HEART_SPOTS: HeartSpot[] = [
  { id: 1, color: 'pink', width: 36, height: 33, className: 'left-[-48px] top-[20px]', delay: '0s' },
  { id: 2, color: 'blue', width: 37, height: 33, className: 'left-[-83px] top-[85px]', delay: '0.3s' },
  { id: 3, color: 'pink', width: 36, height: 33, className: 'left-[-54px] top-[163px]', delay: '0.6s' },
  { id: 4, color: 'blue', width: 37, height: 33, className: 'left-[183px] top-[59px]', delay: '0.15s' },
  { id: 5, color: 'pink', width: 36, height: 33, className: 'left-[202px] top-[146px]', delay: '0.45s' },
  { id: 6, color: 'pink', width: 24, height: 22, className: 'left-[148px] top-[217px]', delay: '0.75s' },
];

export function HeartParticles() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {HEART_SPOTS.map((heart) => (
        <Image
          key={heart.id}
          src={`/img/step2/heart-${heart.color}.png`}
          alt=""
          width={heart.width}
          height={heart.height}
          className={`absolute animate-heartFloat ${heart.className}`}
          style={{ animationDelay: heart.delay }}
        />
      ))}
    </div>
  );
}
