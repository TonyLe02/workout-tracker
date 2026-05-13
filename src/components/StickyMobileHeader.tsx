'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

import { Dumbbell, Flame } from 'lucide-react';

interface StickyMobileHeaderProps {
  name: string;
  initials: string;
  profileImage: string | null;
  level: number;
  todayReps: number;
  todayKcal: number;
  goalReps: number;
  goalKcal: number;
}

interface ProgressRingProps {
  percent: number;
  size?: number;
  stroke?: number;
}

function MiniRing({ percent, size = 32, stroke = 3 }: ProgressRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, percent / 100));
  const isComplete = percent >= 100;

  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={isComplete ? '#22c55e' : '#facc15'}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 400ms ease-out' }}
      />
      <text
        x="50%"
        y="50%"
        dy=".3em"
        textAnchor="middle"
        fontSize="10"
        fontWeight={600}
        fill={isComplete ? '#22c55e' : '#ffffff'}
        fontFamily="ui-monospace, SFMono-Regular, monospace"
      >
        {Math.min(99, Math.round(percent))}
      </text>
    </svg>
  );
}

export function StickyMobileHeader({
  name,
  initials,
  profileImage,
  level,
  todayReps,
  todayKcal,
  goalReps,
  goalKcal,
}: StickyMobileHeaderProps) {
  const repsProgress = goalReps > 0 ? (todayReps / goalReps) * 100 : 0;
  const kcalProgress = goalKcal > 0 ? (todayKcal / goalKcal) * 100 : 0;
  const combinedProgress =
    goalReps > 0 && goalKcal > 0
      ? (repsProgress + kcalProgress) / 2
      : Math.max(repsProgress, kcalProgress);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        setVisible(window.scrollY > 220);
        ticking = false;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`sm:hidden fixed top-0 inset-x-0 z-40 px-3 pt-2 transition-transform duration-300 ${
        visible ? 'translate-y-0' : '-translate-y-full pointer-events-none'
      }`}
    >
      <div className="glass rounded-2xl px-3 py-2 flex items-center gap-3 shadow-md shadow-black/20 ring-1 ring-white/5">
        <div className="relative w-8 h-8 rounded-full border border-border overflow-hidden flex-shrink-0">
          {profileImage ? (
            <Image
              src={profileImage}
              alt="Profile"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-surface-hover/60 flex items-center justify-center text-text-primary text-[11px] font-semibold">
              {initials}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-text-primary truncate leading-tight">
            {name || 'You'}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-text-secondary leading-tight mt-0.5">
            <span>Lv {level}</span>
            {(todayReps > 0 || todayKcal > 0) && <span className="opacity-50">·</span>}
            {todayReps > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Dumbbell className="w-2.5 h-2.5 text-green-500" />
                <span className="font-mono">{todayReps.toLocaleString()}</span>
              </span>
            )}
            {todayKcal > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5 text-orange-500" />
                <span className="font-mono">{todayKcal.toLocaleString()}</span>
              </span>
            )}
          </div>
        </div>
        {combinedProgress > 0 && <MiniRing percent={combinedProgress} />}
      </div>
    </div>
  );
}
