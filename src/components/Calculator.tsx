'use client';

// React/Next.js
import { useState, useEffect, useCallback } from 'react';

// External libraries
import { formatDistanceToNowStrict } from 'date-fns';

// Icons
import { Clock, Delete, Dumbbell, Plus, RotateCcw } from 'lucide-react';

interface CalculatorProps {
  onSubmit: (reps: number) => void;
  label?: string;
  lastEntry?: { reps: number; timestamp: number } | null;
}

type Mode = 'manual' | 'quick';

const REP_CHIPS = [1, 5, 10, 25, 50, 100];
const MODE_STORAGE_KEY = 'calculator_reps_mode';
const MAX_VALUE = 999999;

export function Calculator({ onSubmit, label = 'COUNT REPS', lastEntry }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [chipHistory, setChipHistory] = useState<number[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mode, setMode] = useState<Mode>('manual');
  const [, setNowTick] = useState(0);

  useEffect(() => {
    if (!lastEntry) return;
    const interval = window.setInterval(() => setNowTick((value) => value + 1), 30_000);
    return () => window.clearInterval(interval);
  }, [lastEntry]);

  const lastEntryAgeMs = lastEntry ? Date.now() - lastEntry.timestamp : null;
  const showLastEntry = lastEntry && lastEntryAgeMs !== null && lastEntryAgeMs < 30 * 60 * 1000;

  useEffect(() => {
    const saved = localStorage.getItem(MODE_STORAGE_KEY);
    if (saved === 'manual' || saved === 'quick') setMode(saved);
  }, []);

  const switchMode = useCallback((next: Mode) => {
    setMode(next);
    localStorage.setItem(MODE_STORAGE_KEY, next);
    setDisplay('0');
    setChipHistory([]);
  }, []);

  const handleNumber = useCallback((num: string) => {
    setDisplay((prev) => {
      if (prev === '0') return num;
      if (prev.length >= 6) return prev;
      return prev + num;
    });
  }, []);

  const handleChip = useCallback((amount: number) => {
    setDisplay((prev) => {
      const next = (parseInt(prev, 10) || 0) + amount;
      return String(Math.min(next, MAX_VALUE));
    });
    setChipHistory((prev) => [...prev, amount]);
  }, []);

  const handleClear = useCallback(() => {
    setDisplay('0');
    setChipHistory([]);
  }, []);

  const handleBackspace = useCallback(() => {
    if (mode === 'quick') {
      if (chipHistory.length === 0) return;
      const last = chipHistory[chipHistory.length - 1];
      setChipHistory((prev) => prev.slice(0, -1));
      setDisplay((prev) => String(Math.max(0, (parseInt(prev, 10) || 0) - last)));
      return;
    }
    setDisplay((prev) => {
      if (prev.length === 1) return '0';
      return prev.slice(0, -1);
    });
  }, [mode, chipHistory]);

  const handleAdd = useCallback(() => {
    const value = parseInt(display, 10);
    if (value > 0) {
      setIsAnimating(true);
      onSubmit(value);
      setTimeout(() => {
        setDisplay('0');
        setChipHistory([]);
        setIsAnimating(false);
      }, 300);
    }
  }, [display, onSubmit]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        handleAdd();
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        handleClear();
        return;
      }

      if (event.key === 'Backspace') {
        event.preventDefault();
        handleBackspace();
        return;
      }

      // Numeric keys only meaningful in manual mode
      if (mode === 'manual' && /^[0-9]$/.test(event.key)) {
        event.preventDefault();
        handleNumber(event.key);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAdd, handleClear, handleBackspace, handleNumber, mode]);

  const numpadButtons = [
    '7', '8', '9',
    '4', '5', '6',
    '1', '2', '3',
    'C', '0', '⌫',
  ];

  return (
    <div className="glass rounded-2xl p-6">
      {/* Header with mode toggle */}
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
          <span className="text-xs text-text-secondary uppercase tracking-wider truncate">
            {label}
          </span>
        </div>
        <div className="flex gap-1 bg-surface-hover/50 rounded-lg p-1 flex-shrink-0">
          {(['manual', 'quick'] as Mode[]).map((option) => (
            <button
              key={option}
              onClick={() => switchMode(option)}
              className={`px-2 py-1 text-xs rounded-md transition-all ${
                mode === option
                  ? 'bg-white/10 text-white'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              {option === 'manual' ? 'Manual' : 'Quick +'}
            </button>
          ))}
        </div>
      </div>

      {/* Last entry hint */}
      {showLastEntry && lastEntry && (
        <div className="flex items-center justify-end gap-1.5 text-[11px] text-text-secondary/70 mb-1 -mt-1">
          <Clock className="w-3 h-3" />
          <span>
            Last: <span className="text-text-primary/80 font-mono">+{lastEntry.reps.toLocaleString()}</span>
          </span>
          <span className="opacity-50">·</span>
          <span>{formatDistanceToNowStrict(lastEntry.timestamp, { addSuffix: true })}</span>
        </div>
      )}

      {/* Display */}
      <div
        className={`
          text-5xl font-bold text-text-primary text-right font-mono
          transition-all duration-300 mb-4
          ${isAnimating ? 'scale-110 text-primary' : ''}
        `}
      >
        {parseInt(display, 10).toLocaleString()}
      </div>

      {mode === 'manual' ? (
        <div className="grid grid-cols-3 gap-2 sm:gap-2">
          {numpadButtons.map((btn) => (
            <button
              key={btn}
              onClick={() => {
                if (btn === 'C') handleClear();
                else if (btn === '⌫') handleBackspace();
                else handleNumber(btn);
              }}
              className={`
                h-12 sm:h-14 rounded-xl font-semibold text-lg sm:text-xl
                transition-all duration-150 active:scale-95
                ${
                  btn === 'C'
                    ? 'bg-surface-hover/50 text-danger hover:bg-surface-hover'
                    : 'bg-surface-hover/50 text-text-primary hover:bg-surface-hover'
                }
              `}
            >
              {btn === 'C' ? (
                <RotateCcw className="w-5 h-5 mx-auto" />
              ) : btn === '⌫' ? (
                <Delete className="w-5 h-5 mx-auto" />
              ) : (
                btn
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {REP_CHIPS.map((amount) => (
              <button
                key={amount}
                onClick={() => handleChip(amount)}
                className="
                  h-12 sm:h-14 rounded-xl font-semibold text-base sm:text-lg
                  bg-surface-hover/50 text-text-primary hover:bg-surface-hover
                  transition-all duration-150 active:scale-95
                "
              >
                +{amount}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleClear}
              disabled={display === '0'}
              className={`
                h-12 sm:h-14 rounded-xl font-semibold
                transition-all duration-150 active:scale-95
                flex items-center justify-center
                ${
                  display === '0'
                    ? 'bg-surface-hover/30 text-muted cursor-not-allowed'
                    : 'bg-surface-hover/50 text-danger hover:bg-surface-hover'
                }
              `}
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={handleBackspace}
              disabled={chipHistory.length === 0}
              className={`
                h-12 sm:h-14 rounded-xl font-semibold
                transition-all duration-150 active:scale-95
                flex items-center justify-center
                ${
                  chipHistory.length === 0
                    ? 'bg-surface-hover/30 text-muted cursor-not-allowed'
                    : 'bg-surface-hover/50 text-text-primary hover:bg-surface-hover'
                }
              `}
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleAdd}
        disabled={display === '0'}
        className={`
          w-full mt-4 h-12 sm:h-14 rounded-xl font-bold text-base sm:text-lg
          flex items-center justify-center gap-2
          transition-all duration-200
          ${
            display === '0'
              ? 'bg-surface-hover/30 text-muted cursor-not-allowed'
              : 'bg-white text-background font-bold hover:bg-white/90 active:scale-[0.98]'
          }
        `}
      >
        <Plus className="w-5 h-5" />
        ADD COUNT
      </button>

      <div className="hidden sm:flex items-center justify-center gap-2 mt-3 text-[10px] uppercase tracking-wider text-text-secondary/60">
        {mode === 'manual' && (
          <>
            <kbd className="px-1.5 py-0.5 rounded bg-surface-hover/50 font-mono">0-9</kbd>
            <span>type</span>
            <span className="opacity-50">·</span>
          </>
        )}
        <kbd className="px-1.5 py-0.5 rounded bg-surface-hover/50 font-mono">Enter</kbd>
        <span>add</span>
        <span className="opacity-50">·</span>
        <kbd className="px-1.5 py-0.5 rounded bg-surface-hover/50 font-mono">Esc</kbd>
        <span>clear</span>
      </div>
    </div>
  );
}
