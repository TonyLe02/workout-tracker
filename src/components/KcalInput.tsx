'use client';

// React/Next.js
import { useState, useEffect, useCallback } from 'react';

// Utils/Helpers
import { haptic } from '@/lib/haptics';

// Icons
import { Delete, Flame, Heart, RotateCcw, Zap } from 'lucide-react';

interface KcalInputProps {
  onSubmit: (activeKcal: number, totalKcal: number) => void;
}

type Mode = 'manual' | 'quick';
type Field = 'active' | 'total';

const ACTIVE_CHIPS = [10, 25, 50, 100, 250, 500];
const TOTAL_CHIPS = [50, 100, 250, 500, 1000, 2500];
const MODE_STORAGE_KEY = 'kcal_input_mode';
const MAX_VALUE = 999999;

interface FieldTabProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  selected: boolean;
  onClick: () => void;
}

function FieldTab({ icon, label, value, selected, onClick }: FieldTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg transition-all
        ${
          selected
            ? 'bg-white/10 ring-1 ring-white/20'
            : 'bg-surface-hover/50 hover:bg-surface-hover'
        }
      `}
    >
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-text-secondary">
        {icon}
        {label}
      </div>
      <div
        className={`text-sm font-mono ${
          value > 0 ? 'text-white' : 'text-text-secondary/60'
        }`}
      >
        {value.toLocaleString()}
      </div>
    </button>
  );
}

export function KcalInput({ onSubmit }: KcalInputProps) {
  const [mode, setMode] = useState<Mode>('manual');
  const [selectedField, setSelectedField] = useState<Field>('active');
  const [activeDisplay, setActiveDisplay] = useState('0');
  const [activeHistory, setActiveHistory] = useState<number[]>([]);
  const [totalDisplay, setTotalDisplay] = useState('0');
  const [totalHistory, setTotalHistory] = useState<number[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(MODE_STORAGE_KEY);
    if (saved === 'manual' || saved === 'quick') setMode(saved);
  }, []);

  const updateField = useCallback(
    (
      updater: (
        display: string,
        history: number[]
      ) => { display: string; history: number[] }
    ) => {
      if (selectedField === 'active') {
        const next = updater(activeDisplay, activeHistory);
        setActiveDisplay(next.display);
        setActiveHistory(next.history);
      } else {
        const next = updater(totalDisplay, totalHistory);
        setTotalDisplay(next.display);
        setTotalHistory(next.history);
      }
    },
    [selectedField, activeDisplay, activeHistory, totalDisplay, totalHistory]
  );

  const handleNumber = useCallback(
    (num: string) => {
      updateField((display, history) => ({
        history,
        display:
          display === '0'
            ? num
            : display.length >= 6
            ? display
            : display + num,
      }));
    },
    [updateField]
  );

  const handleChip = useCallback(
    (amount: number) => {
      updateField((display, history) => {
        const next = (parseInt(display, 10) || 0) + amount;
        return {
          display: String(Math.min(next, MAX_VALUE)),
          history: [...history, amount],
        };
      });
    },
    [updateField]
  );

  const handleClear = useCallback(() => {
    updateField(() => ({ display: '0', history: [] }));
  }, [updateField]);

  const handleBackspace = useCallback(() => {
    updateField((display, history) => {
      if (mode === 'quick') {
        if (history.length === 0) return { display, history };
        const last = history[history.length - 1];
        const newValue = Math.max(0, (parseInt(display, 10) || 0) - last);
        return { display: String(newValue), history: history.slice(0, -1) };
      }
      return {
        display: display.length === 1 ? '0' : display.slice(0, -1),
        history,
      };
    });
  }, [updateField, mode]);

  const switchMode = useCallback((next: Mode) => {
    setMode(next);
    localStorage.setItem(MODE_STORAGE_KEY, next);
    setActiveDisplay('0');
    setActiveHistory([]);
    setTotalDisplay('0');
    setTotalHistory([]);
  }, []);

  const activeValue = parseInt(activeDisplay, 10) || 0;
  const totalValue = parseInt(totalDisplay, 10) || 0;
  const display = selectedField === 'active' ? activeDisplay : totalDisplay;
  const history = selectedField === 'active' ? activeHistory : totalHistory;
  const chips = selectedField === 'active' ? ACTIVE_CHIPS : TOTAL_CHIPS;

  const handleSubmit = () => {
    haptic('confirm');
    if (activeValue > 0 || totalValue > 0) {
      setIsAnimating(true);
      onSubmit(activeValue, totalValue);
      setTimeout(() => {
        setActiveDisplay('0');
        setActiveHistory([]);
        setTotalDisplay('0');
        setTotalHistory([]);
        setIsAnimating(false);
      }, 300);
    }
  };

  const isValid = activeValue > 0 || totalValue > 0;

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
          <Heart
            className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0"
            fill="currentColor"
          />
          <span className="text-xs text-text-secondary uppercase tracking-wider truncate">
            HR Calories
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

      {/* Field tabs */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <FieldTab
          icon={<Zap className="w-3.5 h-3.5 text-yellow-500" />}
          label="Active"
          value={activeValue}
          selected={selectedField === 'active'}
          onClick={() => setSelectedField('active')}
        />
        <FieldTab
          icon={<Flame className="w-3.5 h-3.5 text-orange-500" />}
          label="Total"
          value={totalValue}
          selected={selectedField === 'total'}
          onClick={() => setSelectedField('total')}
        />
      </div>

      {/* Display */}
      <div
        className={`
          text-5xl font-bold text-text-primary text-right font-mono
          transition-all duration-300 mb-4
          ${isAnimating ? 'scale-110 text-primary' : ''}
        `}
      >
        {(parseInt(display, 10) || 0).toLocaleString()}
      </div>

      {mode === 'manual' ? (
        <div className="grid grid-cols-3 gap-2">
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
            {chips.map((amount) => (
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
              disabled={history.length === 0}
              className={`
                h-12 sm:h-14 rounded-xl font-semibold
                transition-all duration-150 active:scale-95
                flex items-center justify-center
                ${
                  history.length === 0
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
        onClick={handleSubmit}
        disabled={!isValid}
        className={`
          w-full mt-4 h-12 sm:h-14 rounded-xl font-bold text-base sm:text-lg
          flex items-center justify-center gap-2
          transition-all duration-200
          ${
            !isValid
              ? 'bg-surface-hover/30 text-muted cursor-not-allowed'
              : 'bg-red-500 text-white hover:opacity-90 active:scale-[0.98]'
          }
        `}
      >
        <Heart className="w-5 h-5" />
        LOG CALORIES
      </button>
    </div>
  );
}
