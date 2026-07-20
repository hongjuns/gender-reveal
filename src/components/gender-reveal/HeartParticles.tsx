const HEART_PATH =
  'M12 21s-6.7-4.35-9.5-8.28C.5 10.5 1 6.5 4.5 5A5.5 5.5 0 0 1 12 8.5 5.5 5.5 0 0 1 19.5 5c3.5 1.5 4 5.5 2 7.72C18.7 16.65 12 21 12 21z';

interface HeartSpot {
  id: number;
  colorClassName: string;
  positionClassName: string;
}

const HEART_SPOTS: HeartSpot[] = [
  { id: 1, colorClassName: 'fill-heart-pink', positionClassName: 'left-[2%] top-[16%]' },
  { id: 2, colorClassName: 'fill-heart-blue', positionClassName: 'right-[2%] top-[16%]' },
  { id: 3, colorClassName: 'fill-heart-blue', positionClassName: 'left-[-6%] top-[46%]' },
  { id: 4, colorClassName: 'fill-heart-pink', positionClassName: 'right-[-6%] top-[46%]' },
  { id: 5, colorClassName: 'fill-heart-pink', positionClassName: 'left-[2%] top-[74%]' },
  { id: 6, colorClassName: 'fill-heart-blue', positionClassName: 'right-[2%] top-[74%]' },
];

export function HeartParticles() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {HEART_SPOTS.map((heart) => (
        <svg
          key={heart.id}
          viewBox="0 0 24 24"
          className={`absolute h-5 w-5 ${heart.colorClassName} ${heart.positionClassName}`}
        >
          <path d={HEART_PATH} />
        </svg>
      ))}
    </div>
  );
}
