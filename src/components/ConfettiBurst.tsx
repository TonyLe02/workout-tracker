'use client';

import { useEffect, useMemo, useState } from 'react';

const DEFAULT_COLORS = [
  '#fbbf24',
  '#f97316',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#ef4444',
];

interface ConfettiParticle {
  id: number;
  color: string;
  left: number;
  tx: number;
  ty: number;
  tr: number;
  delay: number;
  size: number;
}

interface ConfettiBurstProps {
  /** When this value changes to a truthy value, fire a new burst. */
  trigger: boolean | number | string;
  count?: number;
  colors?: string[];
  /** Radius of fan-out in pixels. */
  spread?: number;
  className?: string;
}

function generateParticles(count: number, colors: string[], spread: number): ConfettiParticle[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (Math.PI / count) * index - Math.PI / 2;
    const distance = spread * 0.7 + Math.random() * spread * 0.5;
    return {
      id: index,
      color: colors[index % colors.length],
      left: 50 + (Math.random() * 16 - 8),
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance - spread * 0.15,
      tr: (Math.random() - 0.5) * 1080,
      delay: Math.random() * 120,
      size: 5 + Math.random() * 4,
    };
  });
}

export function ConfettiBurst({
  trigger,
  count = 18,
  colors = DEFAULT_COLORS,
  spread = 140,
  className = '',
}: ConfettiBurstProps) {
  const [burstId, setBurstId] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    setBurstId((value) => value + 1);
    const timer = window.setTimeout(() => setBurstId(0), 1300);
    return () => window.clearTimeout(timer);
  }, [trigger]);

  const particles = useMemo<ConfettiParticle[]>(
    () => (burstId > 0 ? generateParticles(count, colors, spread) : []),
    [burstId, count, colors, spread]
  );

  if (particles.length === 0) return null;

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-10 ${className}`}
    >
      {particles.map((particle) => (
        <span
          key={`${burstId}-${particle.id}`}
          className="absolute animate-confetti"
          style={{
            top: '20%',
            left: `${particle.left}%`,
            width: `${particle.size}px`,
            height: `${particle.size * 1.6}px`,
            backgroundColor: particle.color,
            borderRadius: '2px',
            animationDelay: `${particle.delay}ms`,
            ['--tx' as string]: `${particle.tx}px`,
            ['--ty' as string]: `${particle.ty}px`,
            ['--tr' as string]: `${particle.tr}deg`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
