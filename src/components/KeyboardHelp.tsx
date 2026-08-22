'use client';

import { useEffect } from 'react';
import { create } from 'zustand';

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
    section: 'Rest Timer',
    rows: [
      { keys: ['T'], description: 'Start or pause the rest' },
      { keys: ['Shift', 'T'], description: 'Skip the rest' },
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

interface KeyboardHelpStore {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const useKeyboardHelpStore = create<KeyboardHelpStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((state) => ({ open: !state.open })),
}));

export function showKeyboardHelp() {
  useKeyboardHelpStore.getState().setOpen(true);
}

export function KeyboardHelp() {
  const open = useKeyboardHelpStore((state) => state.open);
  const setOpen = useKeyboardHelpStore((state) => state.setOpen);
  const toggle = useKeyboardHelpStore((state) => state.toggle);

  useEffect(() => {
    function handleHelpShortcut(event: KeyboardEvent) {
      if (event.key !== '?') return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      toggle();
    }

    window.addEventListener('keydown', handleHelpShortcut);
    return () => window.removeEventListener('keydown', handleHelpShortcut);
  }, [toggle]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={() => setOpen(false)}
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
            onClick={() => setOpen(false)}
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
