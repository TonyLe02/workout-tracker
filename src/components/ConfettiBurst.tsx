'use client';

import { useEffect, useMemo, useState } from 'react';

export type ConfettiTheme = 'rainbow' | 'green' | 'orange' | 'gold';

const THEMES: Record<ConfettiTheme, string[]> = {
  rainbow: ['#fbbf24', '#f97316', '#22c55e', '#3b82f6', '#a855f7'],
  green: ['#22c55e', '#16a34a', '#4ade80', '#86efac'],
  orange: ['#f97316', '#fb923c', '#fdba74', '#eab308'],
  gold: ['#facc15', '#fbbf24', '#f59e0b', '#fde68a'],
};

interface ConfettiParticle {
  id: number;
  color: string;
  left: number;
  tx: number;
  peakY: number;
  fallY: number;
  tr: number;
  delay: number;
  size: number;
  shape: 'square' | 'circle' | 'streamer';
}

interface ConfettiBurstProps {
  /** When this value changes to a truthy value, fire a new burst. */
  trigger: boolean | number | string;
  count?: number;
  theme?: ConfettiTheme;
  colors?: string[];
  /** How far particles spread horizontally, in px. */
  spread?: number;
  /** How high they rise before gravity pulls them back, in px. */
  rise?: number;
  className?: string;
}

function pickShape(): ConfettiParticle['shape'] {
  const roll = Math.random();
  if (roll < 0.55) return 'square';
  if (roll < 0.85) return 'circle';
  return 'streamer';
}

function generateParticles(
  count: number,
  colors: string[],
  spread: number,
  rise: number
): ConfettiParticle[] {
  return Array.from({ length: count }, (_, index) => {
    // Spread particles across the horizontal range, slight jitter to feel organic.
    const positionT = count === 1 ? 0.5 : index / (count - 1); // 0..1
    const directionalX = (positionT - 0.5) * 2 * spread; // -spread..+spread
    const jitterX = (Math.random() - 0.5) * spread * 0.25;

    const peakHeight = -(rise * 0.6 + Math.random() * rise * 0.7); // up
    const fallDistance = rise * 0.4 + Math.random() * rise * 0.6; // below origin

    return {
      id: index,
      color: colors[index % colors.length],
      left: 50, // emitted from a single point; horizontal motion handled via tx
      tx: directionalX + jitterX,
      peakY: peakHeight,
      fallY: fallDistance,
      tr: (Math.random() - 0.5) * 720,
      delay: Math.random() * 140,
      size: 4 + Math.random() * 5,
      shape: pickShape(),
    };
  });
}

export function ConfettiBurst({
  trigger,
  count = 14,
  theme = 'rainbow',
  colors,
  spread = 140,
  rise = 110,
  className = '',
}: ConfettiBurstProps) {
  const [burstId, setBurstId] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    setBurstId((value) => value + 1);
    const timer = window.setTimeout(() => setBurstId(0), 1600);
    return () => window.clearTimeout(timer);
  }, [trigger]);

  const palette = colors ?? THEMES[theme];

  const particles = useMemo<ConfettiParticle[]>(
    () => (burstId > 0 ? generateParticles(count, palette, spread, rise) : []),
    [burstId, count, palette, spread, rise]
  );

  if (particles.length === 0) return null;

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-10 overflow-hidden ${className}`}
    >
      {particles.map((particle) => {
        const isCircle = particle.shape === 'circle';
        const isStreamer = particle.shape === 'streamer';
        const width = isStreamer ? particle.size * 0.6 : particle.size;
        const height = isStreamer ? particle.size * 2.4 : particle.size;

        return (
          <span
            key={`${burstId}-${particle.id}`}
            className="absolute animate-confetti"
            style={{
              top: '40%',
              left: `${particle.left}%`,
              width: `${width}px`,
              height: `${height}px`,
              backgroundColor: particle.color,
              borderRadius: isCircle ? '50%' : '1.5px',
              animationDelay: `${particle.delay}ms`,
              ['--tx' as string]: `${particle.tx}px`,
              ['--peak-y' as string]: `${particle.peakY}px`,
              ['--fall-y' as string]: `${particle.fallY}px`,
              ['--tr' as string]: `${particle.tr}deg`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}
