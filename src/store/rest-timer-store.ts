import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { playCountdownTick, playRestOverChime, primeAudio } from '@/lib/chime';
import { haptic } from '@/lib/haptics';

export type RestPhase = 'idle' | 'running' | 'paused' | 'done';

export const REST_PRESETS_MS = [30_000, 45_000, 60_000, 90_000, 120_000];

const MIN_DURATION_MS = 15_000;
const MAX_DURATION_MS = 30 * 60_000;
const DEFAULT_DURATION_MS = 90_000;

/** A finish detected later than this means the tab was asleep — don't chime late. */
const STALE_FINISH_MS = 1_500;
/** How long the "go" state stays up before the card returns to ready. */
const DONE_LINGER_MS = 12_000;
const TICK_MS = 200;

interface RestTimerState {
  /** Selected rest length, reused by presets and auto-start. */
  durationMs: number;
  /** Epoch ms the current rest ends at, or null when not running. */
  endsAt: number | null;
  /** Remaining ms while paused, or null. */
  pausedRemainingMs: number | null;
  /** Epoch ms the rest hit zero, or null. */
  doneAt: number | null;
  soundEnabled: boolean;
  autoStart: boolean;
  /** Bumped by the ticker so subscribers re-render; never persisted. */
  now: number;

  start: (durationMs?: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  adjust: (deltaMs: number) => void;
  autoStartAfterLog: () => void;
  toggleSound: () => void;
  toggleAutoStart: () => void;
  dismissDone: () => void;
  /** Re-check the clock after a reload or after the tab wakes up. */
  syncNow: () => void;
}

let tickHandle: number | null = null;
let lastSpokenSecond: number | null = null;

function clampDuration(durationMs: number): number {
  return Math.min(MAX_DURATION_MS, Math.max(MIN_DURATION_MS, durationMs));
}

export function remainingMsOf(state: {
  endsAt: number | null;
  pausedRemainingMs: number | null;
  doneAt: number | null;
  durationMs: number;
  now: number;
}): number {
  // `now` is 0 until the first tick (or straight after a rehydrate), so fall
  // back to the wall clock rather than rendering a nonsense countdown.
  const now = state.now || Date.now();
  if (state.endsAt !== null) return Math.max(0, state.endsAt - now);
  if (state.pausedRemainingMs !== null) return state.pausedRemainingMs;
  if (state.doneAt !== null) return 0;
  return state.durationMs;
}

export function phaseOf(state: {
  endsAt: number | null;
  pausedRemainingMs: number | null;
  doneAt: number | null;
}): RestPhase {
  if (state.endsAt !== null) return 'running';
  if (state.pausedRemainingMs !== null) return 'paused';
  if (state.doneAt !== null) return 'done';
  return 'idle';
}

export const useRestTimerStore = create<RestTimerState>()(
  persist(
    (set, get) => {
      function stopTicker() {
        if (tickHandle !== null) {
          window.clearInterval(tickHandle);
          tickHandle = null;
        }
      }

      function finish(overdueMs: number) {
        const { soundEnabled } = get();
        stopTicker();
        set({ endsAt: null, pausedRemainingMs: null, doneAt: Date.now(), now: Date.now() });

        // A tab that was asleep wakes up past zero; a chime then is noise.
        if (overdueMs <= STALE_FINISH_MS) {
          if (soundEnabled) playRestOverChime();
          haptic('alert');
        }

        startTicker();
      }

      function tick() {
        const state = get();
        const now = Date.now();

        if (state.endsAt !== null) {
          if (now >= state.endsAt) {
            finish(now - state.endsAt);
            return;
          }

          const secondsLeft = Math.ceil((state.endsAt - now) / 1000);
          if (
            state.soundEnabled &&
            secondsLeft <= 3 &&
            secondsLeft > 0 &&
            secondsLeft !== lastSpokenSecond
          ) {
            lastSpokenSecond = secondsLeft;
            playCountdownTick();
          }

          set({ now });
          return;
        }

        if (state.doneAt !== null) {
          if (now - state.doneAt >= DONE_LINGER_MS) {
            stopTicker();
            set({ doneAt: null, now });
            return;
          }
          set({ now });
          return;
        }

        stopTicker();
      }

      function startTicker() {
        if (typeof window === 'undefined') return;
        stopTicker();
        tickHandle = window.setInterval(tick, TICK_MS);
      }

      return {
        durationMs: DEFAULT_DURATION_MS,
        endsAt: null,
        pausedRemainingMs: null,
        doneAt: null,
        soundEnabled: true,
        autoStart: true,
        now: 0,

        start: (durationMs) => {
          const duration = clampDuration(durationMs ?? get().durationMs);
          const now = Date.now();

          primeAudio();
          lastSpokenSecond = null;
          set({
            durationMs: duration,
            endsAt: now + duration,
            pausedRemainingMs: null,
            doneAt: null,
            now,
          });
          haptic('confirm');
          startTicker();
        },

        pause: () => {
          const { endsAt } = get();
          if (endsAt === null) return;
          stopTicker();
          set({
            endsAt: null,
            pausedRemainingMs: Math.max(0, endsAt - Date.now()),
            now: Date.now(),
          });
        },

        resume: () => {
          const { pausedRemainingMs } = get();
          if (pausedRemainingMs === null) return;
          const now = Date.now();
          lastSpokenSecond = null;
          set({ endsAt: now + pausedRemainingMs, pausedRemainingMs: null, now });
          startTicker();
        },

        reset: () => {
          stopTicker();
          lastSpokenSecond = null;
          set({ endsAt: null, pausedRemainingMs: null, doneAt: null, now: Date.now() });
        },

        adjust: (deltaMs) => {
          const { endsAt, pausedRemainingMs, durationMs } = get();
          const now = Date.now();

          if (endsAt !== null) {
            const nextRemaining = clampDuration(endsAt - now + deltaMs);
            lastSpokenSecond = null;
            set({ endsAt: now + nextRemaining, now });
            return;
          }

          if (pausedRemainingMs !== null) {
            set({ pausedRemainingMs: clampDuration(pausedRemainingMs + deltaMs), now });
            return;
          }

          set({ durationMs: clampDuration(durationMs + deltaMs), doneAt: null });
        },

        autoStartAfterLog: () => {
          if (!get().autoStart) return;
          get().start();
        },

        toggleSound: () => {
          const soundEnabled = !get().soundEnabled;
          if (soundEnabled) primeAudio();
          set({ soundEnabled });
        },

        toggleAutoStart: () => {
          set({ autoStart: !get().autoStart });
        },

        dismissDone: () => {
          const { doneAt } = get();
          if (doneAt === null) return;
          stopTicker();
          set({ doneAt: null, now: Date.now() });
        },

        syncNow: () => {
          const { endsAt, doneAt } = get();
          const now = Date.now();

          if (endsAt !== null) {
            // A rest that expired while the page was away is stale: clear it
            // quietly instead of firing a cue nobody is waiting for.
            if (endsAt <= now) {
              stopTicker();
              set({ endsAt: null, pausedRemainingMs: null, doneAt: null, now });
              return;
            }
            set({ now });
            startTicker();
            return;
          }

          if (doneAt !== null) {
            if (now - doneAt >= DONE_LINGER_MS) {
              stopTicker();
              set({ doneAt: null, now });
              return;
            }
            set({ now });
            startTicker();
            return;
          }

          set({ now });
        },
      };
    },
    {
      name: 'rest-timer-storage',
      partialize: (state) => ({
        durationMs: state.durationMs,
        soundEnabled: state.soundEnabled,
        autoStart: state.autoStart,
        endsAt: state.endsAt,
        pausedRemainingMs: state.pausedRemainingMs,
      }),
    }
  )
);

export function formatRestClock(remainingMs: number): string {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** Presets read as clock values so the row lines up in one monospace rhythm. */
export function formatPresetLabel(durationMs: number): string {
  return formatRestClock(durationMs);
}
