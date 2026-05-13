'use client';

import { ArrowDown, Dumbbell, Sparkles } from 'lucide-react';

interface EmptyStateHeroProps {
  name?: string;
}

export function EmptyStateHero({ name }: EmptyStateHeroProps) {
  return (
    <div className="glass rounded-2xl p-6 sm:p-8 mb-6 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gradient-to-br from-green-500/20 to-transparent blur-2xl"
      />
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-surface-hover/60 ring-1 ring-border flex items-center justify-center flex-shrink-0">
          <Dumbbell className="w-6 h-6 text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-text-secondary mb-1">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            Let&apos;s get started
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-text-primary leading-tight">
            {name ? `Welcome, ${name}.` : 'Welcome.'} Add your first reps to begin.
          </h2>
          <p className="text-sm text-text-secondary mt-1.5 leading-snug">
            Every entry earns XP, fills your daily rings, and inches you closer to
            the next achievement. Tap the calculator below to log your first set.
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5 text-xs text-text-secondary/70 px-3 py-1.5 rounded-full bg-surface-hover/60 ring-1 ring-border animate-pulse">
          <ArrowDown className="w-3.5 h-3.5 text-green-400" />
          Start here
        </div>
      </div>
    </div>
  );
}
