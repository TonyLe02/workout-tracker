'use client';

import { useEffect, useRef } from 'react';
import { create } from 'zustand';

import { CheckCircle2, Trophy, Undo2, X } from 'lucide-react';

export type ToastTone = 'success' | 'celebrate' | 'info';

export interface Toast {
  id: string;
  message: string;
  detail?: string;
  tone: ToastTone;
  durationMs: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastInput {
  message: string;
  detail?: string;
  tone?: ToastTone;
  durationMs?: number;
  action?: Toast['action'];
}

interface ToastStore {
  toasts: Toast[];
  push: (toast: ToastInput) => string;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = crypto.randomUUID();
    const next: Toast = {
      id,
      message: toast.message,
      detail: toast.detail,
      tone: toast.tone ?? 'success',
      durationMs: toast.durationMs ?? 4500,
      action: toast.action,
    };
    set((state) => ({ toasts: [...state.toasts, next] }));
    return id;
  },
  dismiss: (id) => {
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
  },
}));

export function showToast(input: ToastInput) {
  return useToastStore.getState().push(input);
}

const TONE_STYLES: Record<ToastTone, { ring: string; iconColor: string; icon: typeof CheckCircle2 }> = {
  success: {
    ring: 'ring-1 ring-white/10',
    iconColor: 'text-green-400',
    icon: CheckCircle2,
  },
  celebrate: {
    ring: 'ring-1 ring-yellow-500/40',
    iconColor: 'text-yellow-400',
    icon: Trophy,
  },
  info: {
    ring: 'ring-1 ring-blue-500/30',
    iconColor: 'text-blue-400',
    icon: CheckCircle2,
  },
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((state) => state.dismiss);
  const dismissedRef = useRef(false);
  const Icon = TONE_STYLES[toast.tone].icon;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!dismissedRef.current) {
        dismiss(toast.id);
      }
    }, toast.durationMs);
    return () => window.clearTimeout(timer);
  }, [dismiss, toast.id, toast.durationMs]);

  const handleAction = () => {
    if (!toast.action) return;
    dismissedRef.current = true;
    toast.action.onClick();
    dismiss(toast.id);
  };

  const handleDismiss = () => {
    dismissedRef.current = true;
    dismiss(toast.id);
  };

  const styles = TONE_STYLES[toast.tone];

  return (
    <div
      role="status"
      className={`glass ${styles.ring} rounded-xl shadow-lg shadow-black/40 px-4 py-3 flex items-center gap-3 min-w-[260px] max-w-[360px] animate-pop-in`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${styles.iconColor}`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary truncate">
          {toast.message}
        </div>
        {toast.detail && (
          <div className="text-xs text-text-secondary mt-0.5 truncate">
            {toast.detail}
          </div>
        )}
      </div>
      {toast.action && (
        <button
          onClick={handleAction}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white uppercase tracking-wider transition-colors"
        >
          <Undo2 className="w-3.5 h-3.5" />
          {toast.action.label}
        </button>
      )}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="flex-shrink-0 p-1 rounded-lg text-text-secondary/60 hover:text-text-primary hover:bg-white/5 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );
}
