import Image from 'next/image';

interface HeartSpot {
  id: number;
  src: string;
  positionClassName: string;
  sizeClassName: string;
}

const HEART_SPOTS: HeartSpot[] = [
  {
    id: 1,
    src: '/img/step2/heart-pink.png',
    positionClassName: 'left-[-30%] top-[9%]',
    sizeClassName: 'w-[23%]',
  },
  {
    id: 2,
    src: '/img/step2/heart-blue.png',
    positionClassName: 'left-[-52%] top-[39%]',
    sizeClassName: 'w-[23%]',
  },
  {
    id: 3,
    src: '/img/step2/heart-pink.png',
    positionClassName: 'left-[-34%] top-[75%]',
    sizeClassName: 'w-[23%]',
  },
  {
    id: 4,
    src: '/img/step2/heart-blue.png',
    positionClassName: 'left-[114%] top-[27%]',
    sizeClassName: 'w-[23%]',
  },
  {
    id: 5,
    src: '/img/step2/heart-pink.png',
    positionClassName: 'left-[126%] top-[67%]',
    sizeClassName: 'w-[23%]',
  },
  {
    id: 6,
    src: '/img/step2/heart-pink.png',
    positionClassName: 'left-[93%] top-[100%]',
    sizeClassName: 'w-[15%]',
  },
];

export function HeartParticles() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {HEART_SPOTS.map((heart) => (
        <Image
          key={heart.id}
          src={heart.src}
          alt=""
          width={141}
          height={126}
          className={`absolute h-auto ${heart.sizeClassName} ${heart.positionClassName}`}
        />
      ))}
    </div>
  );
}
