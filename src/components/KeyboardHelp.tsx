'use client';

import { useEffect } from 'react';

import { Keyboard, X } from 'lucide-react';

interface ShortcutRow {
  keys: string[];
  description: string;
}

const SHORTCUTS: { section: string; rows: ShortcutRow[] }[] = [
  {
    section: 'Rep Calculator',
    rows: [
      { keys: ['0', '–', '9'], description: 'Type a number (manual mode)' },
      { keys: ['Enter'], description: 'Add the current count' },
      { keys: ['Backspace'], description: 'Delete last digit / undo chip' },
      { keys: ['Esc'], description: 'Clear the display' },
    ],
  },
  {
    section: 'App',
    rows: [
      { keys: ['?'], description: 'Show this shortcuts panel' },
      { keys: ['Esc'], description: 'Close this panel' },
    ],
  },
];

interface KeyboardHelpProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardHelp({ open, onClose }: KeyboardHelpProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Keyboard shortcuts"
        onClick={(event) => event.stopPropagation()}
        className="glass ring-1 ring-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-black/50 animate-pop-in"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-text-secondary" />
            <span className="text-xs uppercase tracking-wider text-text-secondary">
              Keyboard Shortcuts
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-lg text-text-secondary/70 hover:text-text-primary hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5">
          {SHORTCUTS.map((section) => (
            <div key={section.section}>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary/70 mb-2">
                {section.section}
              </div>
              <div className="space-y-1.5">
                {section.rows.map((row) => (
                  <div
                    key={row.description}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-text-primary">{row.description}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {row.keys.map((key, index) => (
                        <span
                          key={`${row.description}-${index}`}
                          className={
                            key === '–'
                              ? 'text-text-secondary/60 text-xs'
                              : 'px-1.5 py-0.5 rounded bg-surface-hover/70 border border-border text-[11px] font-mono text-text-primary'
                          }
                        >
                          {key}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
