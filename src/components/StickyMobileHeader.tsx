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
}

export function StickyMobileHeader({
  name,
  initials,
  profileImage,
  level,
  todayReps,
  todayKcal,
}: StickyMobileHeaderProps) {
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
      <div className="glass rounded-2xl px-3 py-2 flex items-center gap-3 shadow-xl shadow-black/40 ring-1 ring-white/5">
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
      </div>
    </div>
  );
}
