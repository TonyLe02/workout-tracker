'use client';

// React/Next.js
import { useState, useCallback } from 'react';

// Icons
import { Delete, Plus, RotateCcw } from 'lucide-react';

interface CalculatorProps {
  onSubmit: (reps: number) => void;
  label?: string;
}

export function Calculator({ onSubmit, label = 'REPS' }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [isAnimating, setIsAnimating] = useState(false);

  const handleNumber = useCallback((num: string) => {
    setDisplay((prev) => {
      if (prev === '0') return num;
      if (prev.length >= 6) return prev; // Max 6 digits
      return prev + num;
    });
  }, []);

  const handleClear = useCallback(() => {
    setDisplay('0');
  }, []);

  const handleBackspace = useCallback(() => {
    setDisplay((prev) => {
      if (prev.length === 1) return '0';
      return prev.slice(0, -1);
    });
  }, []);

  const handleAdd = useCallback(() => {
    const value = parseInt(display, 10);
    if (value > 0) {
      setIsAnimating(true);
      onSubmit(value);
      setTimeout(() => {
        setDisplay('0');
        setIsAnimating(false);
      }, 300);
    }
  }, [display, onSubmit]);

  const buttons = [
    '7', '8', '9',
    '4', '5', '6',
    '1', '2', '3',
    'C', '0', '⌫',
  ];

  return (
    <div className="glass rounded-2xl p-6">
      {/* Display */}
      <div className="mb-4">
        <div className="text-xs text-text-secondary uppercase tracking-wider mb-1">
          {label}
        </div>
        <div
          className={`
            text-5xl font-bold text-text-primary text-right font-mono
            transition-all duration-300
            ${isAnimating ? 'scale-110 text-primary' : ''}
          `}
        >
          {parseInt(display, 10).toLocaleString()}
        </div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2">
        {buttons.map((btn) => (
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
                  ? 'bg-danger/20 text-danger hover:bg-danger/30'
                  : btn === '⌫'
                  ? 'bg-warning/20 text-warning hover:bg-warning/30'
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

      {/* Add Button */}
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
        ADD REPS
      </button>
    </div>
  );
}
