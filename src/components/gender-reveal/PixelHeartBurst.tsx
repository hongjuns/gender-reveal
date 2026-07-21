'use client';

import { useMemo } from 'react';
import Image from 'next/image';

const HEART_ASSETS = ['/img/step2/heart-pink.png', '/img/step2/heart-blue.png'];
const PIECE_COUNT = 10;

interface HeartPiece {
  id: number;
  src: string;
  x: string;
  y: string;
  rotate: string;
  delay: string;
  size: number;
}

function createHeartPieces(): HeartPiece[] {
  return Array.from({ length: PIECE_COUNT }, (_, id) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 70 + Math.random() * 90;
    return {
      id,
      src: HEART_ASSETS[id % HEART_ASSETS.length],
      x: `${Math.cos(angle) * distance}px`,
      y: `${Math.sin(angle) * distance - 30}px`,
      rotate: `${360 + Math.random() * 360}deg`,
      delay: `${Math.random() * 0.12}s`,
      size: 18 + Math.random() * 10,
    };
  });
}

export function PixelHeartBurst() {
  const pieces = useMemo(createHeartPieces, []);

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {pieces.map((piece) => (
        <Image
          key={piece.id}
          src={piece.src}
          alt=""
          width={141}
          height={126}
          className="absolute left-1/2 top-[45%] h-auto animate-confettiBurst"
          style={
            {
              width: piece.size,
              animationDelay: piece.delay,
              '--confetti-x': piece.x,
              '--confetti-y': piece.y,
              '--confetti-rotate': piece.rotate,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
