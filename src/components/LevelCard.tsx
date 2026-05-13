'use client';

import { useEffect, useMemo, useState } from 'react';

// Components
import { CountUp } from './CountUp';

// Utils/Helpers
import { getLevelTier, hexWithAlpha } from '@/lib/tiers';

// Types/Interfaces
import { getLevelTitle, getXPForNextLevel, getCurrentLevelXP } from '@/types/workout';

// Icons
import { BicepsFlexed, Star } from 'lucide-react';

interface LevelCardProps {
  level: number;
  totalXP: number;
  isLevelUp?: boolean;
}

const CONFETTI_COLORS = ['#fbbf24', '#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ef4444'];

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

function generateConfetti(): ConfettiParticle[] {
  return Array.from({ length: 18 }, (_, index) => {
    const angle = (Math.PI / 18) * index - Math.PI / 2;
    const distance = 90 + Math.random() * 70;
    return {
      id: index,
      color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
      left: 50 + (Math.random() * 20 - 10),
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance - 20,
      tr: (Math.random() - 0.5) * 1080,
      delay: Math.random() * 120,
      size: 6 + Math.random() * 4,
    };
  });
}

export function LevelCard({ level, totalXP, isLevelUp = false }: LevelCardProps) {
  const [confettiBurst, setConfettiBurst] = useState(0);
  const particles = useMemo<ConfettiParticle[]>(
    () => (confettiBurst > 0 ? generateConfetti() : []),
    [confettiBurst]
  );

  useEffect(() => {
    if (!isLevelUp) return;
    setConfettiBurst((value) => value + 1);
    const timer = window.setTimeout(() => setConfettiBurst(0), 1300);
    return () => window.clearTimeout(timer);
  }, [isLevelUp]);

  const title = getLevelTitle(level);
  const xpForNext = getXPForNextLevel(level);
  const currentXP = getCurrentLevelXP(totalXP, level);
  const progress = (currentXP / xpForNext) * 100;
  const tier = getLevelTier(level);
  const tierGradient = `linear-gradient(to right, ${tier.fromHex}, ${tier.toHex})`;
  const tierBorder = hexWithAlpha(tier.toHex, 0.4);

  return (
    <div
      className={`
        glass rounded-2xl p-6 relative overflow-hidden
        ${isLevelUp ? 'animate-level-up' : ''}
      `}
    >
      {particles.length > 0 && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10"
        >
          {particles.map((particle) => (
            <span
              key={`${confettiBurst}-${particle.id}`}
              className="absolute top-6 animate-confetti"
              style={{
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
      )}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center"
              style={{ border: `1px solid ${tierBorder}` }}
            >
              <span className="text-2xl font-bold text-white">{level}</span>
            </div>
            {isLevelUp && (
              <div className="absolute -top-1 -right-1">
                <Star className="w-6 h-6 text-yellow-400 animate-float" fill="currentColor" />
              </div>
            )}
          </div>
          <div>
            <div className="text-sm text-text-secondary">Level</div>
            <div className="text-xl font-bold text-text-primary">{title}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-text-secondary text-sm">
            <BicepsFlexed className="w-4 h-4" />
            Total XP
          </div>
          <div
            className="text-2xl font-bold text-transparent bg-clip-text font-mono"
            style={{ backgroundImage: tierGradient }}
          >
            <CountUp value={totalXP} />
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div>
        <div className="flex justify-between text-xs text-text-secondary mb-2">
          <span>Progress to Level {level + 1}</span>
          <span>{currentXP.toLocaleString()} / {xpForNext.toLocaleString()} XP</span>
        </div>
        <div className="h-3 bg-surface-hover rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
