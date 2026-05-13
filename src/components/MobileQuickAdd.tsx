'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

import { Plus } from 'lucide-react';

interface MobileQuickAddProps {
  target: RefObject<HTMLElement>;
  onAdd: (reps: number) => void;
}

const CHIPS = [1, 5, 10, 25];

export function MobileQuickAdd({ target, onAdd }: MobileQuickAddProps) {
  const [hidden, setHidden] = useState(true);
  const [pressedChip, setPressedChip] = useState<number | null>(null);
  const pressTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const node = target.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHidden(entry.isIntersecting);
      },
      { rootMargin: '-40px 0px 0px 0px', threshold: 0 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [target]);

  useEffect(() => {
    return () => {
      if (pressTimerRef.current !== null) {
        window.clearTimeout(pressTimerRef.current);
      }
    };
  }, []);

  const handleTap = (amount: number) => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(15);
    }
    onAdd(amount);
    setPressedChip(amount);
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
    }
    pressTimerRef.current = window.setTimeout(() => setPressedChip(null), 250);
  };

  return (
    <div
      aria-hidden={hidden}
      className={`sm:hidden fixed bottom-0 inset-x-0 z-40 px-3 pb-3 pt-2 transition-transform duration-300 ${
        hidden ? 'translate-y-full pointer-events-none' : 'translate-y-0'
      }`}
    >
      <div className="glass rounded-2xl px-3 py-2.5 flex items-center gap-2 shadow-xl shadow-black/40">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-text-secondary/80 flex-shrink-0 pl-1">
          <Plus className="w-3.5 h-3.5 text-green-500" />
          Quick reps
        </div>
        <div className="flex-1 grid grid-cols-4 gap-1.5">
          {CHIPS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => handleTap(amount)}
              className={`h-11 rounded-xl font-bold text-sm bg-surface-hover/60 text-text-primary active:scale-95 transition-all ${
                pressedChip === amount ? 'bg-green-500/20 text-green-300' : ''
              }`}
            >
              +{amount}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
