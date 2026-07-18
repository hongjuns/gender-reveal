'use client';

import { useMemo } from 'react';

const CONFETTI_COLORS = ['#f472b6', '#2dd4bf', '#fbbf24', '#60a5fa', '#f87171'];
const PARTICLE_COUNT = 24;

interface ConfettiPiece {
  id: number;
  color: string;
  x: string;
  y: string;
  rotate: string;
  delay: string;
  size: number;
}

function createConfettiPieces(): ConfettiPiece[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, id) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 100;
    return {
      id,
      color: CONFETTI_COLORS[id % CONFETTI_COLORS.length],
      x: `${Math.cos(angle) * distance}px`,
      y: `${Math.sin(angle) * distance - 40}px`,
      rotate: `${360 + Math.random() * 360}deg`,
      delay: `${Math.random() * 0.15}s`,
      size: 6 + Math.random() * 6,
    };
  });
}

export function ConfettiBurst() {
  const pieces = useMemo(createConfettiPieces, []);

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="absolute left-1/2 top-[45%] animate-confettiBurst rounded-sm"
          style={
            {
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
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
