'use client';

// React/Next.js
import { useEffect } from 'react';

// Store/State management
import {
  REST_PRESETS_MS,
  formatPresetLabel,
  formatRestClock,
  phaseOf,
  remainingMsOf,
  useRestTimerStore,
  type RestPhase,
} from '@/store/rest-timer-store';

// Utils/Helpers
import { haptic } from '@/lib/haptics';

// Icons
import { Minus, Pause, Play, Plus, RotateCcw, Timer, Volume2, VolumeX, Zap } from 'lucide-react';

const RING_SIZE = 168;
const RING_STROKE = 8;
const TRACK_COLOR = 'rgba(255,255,255,0.07)';
const IDLE_COLOR = 'rgba(96,165,250,0.35)';
const RUNNING_COLOR = '#60a5fa';
const URGENT_COLOR = '#fbbf24';
const DONE_COLOR = '#22c55e';
const URGENT_THRESHOLD_MS = 10_000;

const DONE_PULSE_STYLE = {
  '--goal-pulse-color': 'rgba(34,197,94,0.5)',
} as React.CSSProperties;

interface CountdownRingProps {
  /** 0–1 of the rest still remaining. */
  fraction: number;
  color: string;
}

function CountdownRing({ fraction, color }: CountdownRingProps) {
  const radius = (RING_SIZE - RING_STROKE) / 2;
  const circumference = radius * 2 * Math.PI;
  const clamped = Math.min(1, Math.max(0, fraction));
  const center = RING_SIZE / 2;

  return (
    <svg width={RING_SIZE} height={RING_SIZE} className="progress-ring" aria-hidden="true">
      <circle
        stroke={TRACK_COLOR}
        fill="transparent"
        strokeWidth={RING_STROKE}
        r={radius}
        cx={center}
        cy={center}
      />
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={RING_STROKE}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - clamped)}
        r={radius}
        cx={center}
        cy={center}
        className="countdown-ring-circle"
      />
    </svg>
  );
}

function MiniRing({ fraction, color }: CountdownRingProps) {
  const size = 30;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const clamped = Math.min(1, Math.max(0, fraction));

  return (
    <svg width={size} height={size} className="progress-ring flex-shrink-0" aria-hidden="true">
      <circle
        stroke="rgba(255,255,255,0.08)"
        fill="transparent"
        strokeWidth={stroke}
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - clamped)}
        r={radius}
        cx={size / 2}
        cy={size / 2}
        className="countdown-ring-circle"
      />
    </svg>
  );
}

function activeColor(phase: RestPhase, remainingMs: number): string {
  if (phase === 'done') return DONE_COLOR;
  if (phase === 'idle' || phase === 'paused') return IDLE_COLOR;
  return remainingMs <= URGENT_THRESHOLD_MS ? URGENT_COLOR : RUNNING_COLOR;
}

function centerLabel(phase: RestPhase): string {
  if (phase === 'idle') return 'tap to start';
  if (phase === 'running') return 'tap to pause';
  if (phase === 'paused') return 'paused';
  return 'rest done';
}

function primaryActionLabel(phase: RestPhase): string {
  if (phase === 'running') return 'Pause';
  if (phase === 'paused') return 'Resume';
  if (phase === 'done') return 'Rest again';
  return 'Start rest';
}

/** Spoken duration for assistive tech, where "1:30" reads poorly. */
function spokenDuration(durationMs: number): string {
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (minutes > 0) parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
  if (seconds > 0) parts.push(`${seconds} second${seconds === 1 ? '' : 's'}`);
  return parts.join(' ') || '0 seconds';
}

function togglePrimaryAction() {
  const state = useRestTimerStore.getState();
  const phase = phaseOf(state);

  if (phase === 'running') {
    state.pause();
    return;
  }
  if (phase === 'paused') {
    state.resume();
    return;
  }
  state.start();
}

export function RestTimer() {
  const durationMs = useRestTimerStore((state) => state.durationMs);
  const endsAt = useRestTimerStore((state) => state.endsAt);
  const pausedRemainingMs = useRestTimerStore((state) => state.pausedRemainingMs);
  const doneAt = useRestTimerStore((state) => state.doneAt);
  const now = useRestTimerStore((state) => state.now);
  const soundEnabled = useRestTimerStore((state) => state.soundEnabled);
  const autoStart = useRestTimerStore((state) => state.autoStart);

  const start = useRestTimerStore((state) => state.start);
  const reset = useRestTimerStore((state) => state.reset);
  const adjust = useRestTimerStore((state) => state.adjust);
  const toggleSound = useRestTimerStore((state) => state.toggleSound);
  const toggleAutoStart = useRestTimerStore((state) => state.toggleAutoStart);
  const syncNow = useRestTimerStore((state) => state.syncNow);

  const phase = phaseOf({ endsAt, pausedRemainingMs, doneAt });
  const remainingMs = remainingMsOf({ endsAt, pausedRemainingMs, doneAt, durationMs, now });
  const isActive = phase === 'running' || phase === 'paused';
  const fraction = phase === 'done' ? 1 : durationMs > 0 ? remainingMs / durationMs : 0;

  // Pick the clock back up after a reload, and again whenever the tab wakes:
  // background intervals get throttled, so the countdown needs a re-read.
  useEffect(() => {
    syncNow();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') syncNow();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [syncNow]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === 't') {
        event.preventDefault();
        togglePrimaryAction();
        return;
      }

      if (event.key === 'T') {
        event.preventDefault();
        useRestTimerStore.getState().reset();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Timer className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
          <span className="text-xs text-text-secondary uppercase tracking-wider truncate">
            Rest Timer
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              haptic('tap');
              toggleAutoStart();
            }}
            aria-pressed={autoStart}
            title={
              autoStart
                ? 'Auto-start is on: logging reps starts a rest'
                : 'Auto-start is off: start rests yourself'
            }
            className={`inline-flex items-center gap-1 h-9 rounded-full px-3 text-[11px] uppercase tracking-wider ring-1 transition-colors ${
              autoStart
                ? 'bg-blue-500/15 text-blue-300 ring-blue-500/30'
                : 'bg-surface-hover/50 text-text-secondary ring-border hover:text-text-primary'
            }`}
          >
            <Zap className="w-3 h-3" />
            Auto
          </button>
          <button
            type="button"
            onClick={() => {
              haptic('tap');
              toggleSound();
            }}
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? 'Mute the rest chime' : 'Unmute the rest chime'}
            title={soundEnabled ? 'Chime on' : 'Chime muted'}
            className={`h-9 w-9 rounded-full flex items-center justify-center ring-1 ring-border transition-colors ${
              soundEnabled
                ? 'bg-surface-hover/50 text-text-primary hover:bg-surface-hover'
                : 'bg-surface-hover/30 text-text-secondary/70 hover:text-text-primary'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={togglePrimaryAction}
          aria-label={`${primaryActionLabel(phase)}, ${spokenDuration(remainingMs)} left`}
          className={`relative rounded-full transition-transform active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
            phase === 'done' ? 'animate-goal-complete-pulse' : ''
          }`}
          style={DONE_PULSE_STYLE}
        >
          <CountdownRing fraction={fraction} color={activeColor(phase, remainingMs)} />
          <span className="absolute inset-0 flex flex-col items-center justify-center">
            {phase === 'done' ? (
              <span className="font-display text-4xl font-bold tracking-tight text-green-400 animate-pop-in">
                GO
              </span>
            ) : (
              <span
                className={`font-mono text-4xl font-bold tabular-nums ${
                  phase === 'paused' ? 'text-text-secondary' : 'text-text-primary'
                }`}
              >
                {formatRestClock(remainingMs)}
              </span>
            )}
            <span className="mt-1 text-[11px] uppercase tracking-wider text-text-secondary">
              {centerLabel(phase)}
            </span>
          </span>
        </button>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {phase === 'done' ? 'Rest complete. Back to work.' : ''}
      </p>

      <div className="grid grid-cols-4 gap-2 mt-4">
        <button
          type="button"
          onClick={() => {
            haptic('tap');
            adjust(-15_000);
          }}
          aria-label="Take 15 seconds off"
          className="h-12 rounded-xl bg-surface-hover/50 text-text-primary hover:bg-surface-hover active:scale-95 transition-all flex items-center justify-center gap-0.5 text-sm font-semibold font-mono"
        >
          <Minus className="w-3.5 h-3.5" />
          15
        </button>
        <button
          type="button"
          onClick={togglePrimaryAction}
          className="col-span-2 h-12 rounded-xl bg-white text-background font-bold hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {phase === 'running' ? (
            <Pause className="w-4 h-4" />
          ) : phase === 'done' ? (
            <RotateCcw className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {primaryActionLabel(phase)}
        </button>
        <button
          type="button"
          onClick={() => {
            haptic('tap');
            adjust(15_000);
          }}
          aria-label="Add 15 seconds"
          className="h-12 rounded-xl bg-surface-hover/50 text-text-primary hover:bg-surface-hover active:scale-95 transition-all flex items-center justify-center gap-0.5 text-sm font-semibold font-mono"
        >
          <Plus className="w-3.5 h-3.5" />
          15
        </button>
      </div>

      <div className="grid grid-cols-5 gap-1.5 mt-2">
        {REST_PRESETS_MS.map((preset) => {
          const isSelected = preset === durationMs;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => start(preset)}
              aria-label={`Rest for ${spokenDuration(preset)}`}
              className={`h-11 rounded-xl text-xs font-semibold font-mono tabular-nums transition-all active:scale-95 ${
                isSelected
                  ? 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30'
                  : 'bg-surface-hover/50 text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              {formatPresetLabel(preset)}
            </button>
          );
        })}
      </div>

      {/* Fixed height so starting a rest never shifts the cards below. */}
      <div className="flex items-center justify-between gap-2 mt-3 h-11">
        <span className="text-[11px] text-text-secondary min-w-0">
          {isActive
            ? 'Tap a preset to restart at that length'
            : autoStart
            ? 'Starts itself when you log reps'
            : 'Tap a preset to rest'}
        </span>
        {isActive ? (
          <button
            type="button"
            onClick={reset}
            className="h-11 px-4 rounded-xl bg-surface-hover/50 text-text-secondary hover:bg-surface-hover hover:text-red-400 text-xs font-semibold uppercase tracking-wider transition-all active:scale-95 flex-shrink-0"
          >
            Skip rest
          </button>
        ) : (
          <span className="hidden sm:flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-secondary/70 flex-shrink-0">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-hover/50 font-mono">T</kbd>
            start
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Compact countdown for the mobile dock, so a running rest stays visible while
 * you are scrolled away from the card.
 */
export function RestTimerDockRow() {
  const durationMs = useRestTimerStore((state) => state.durationMs);
  const endsAt = useRestTimerStore((state) => state.endsAt);
  const pausedRemainingMs = useRestTimerStore((state) => state.pausedRemainingMs);
  const doneAt = useRestTimerStore((state) => state.doneAt);
  const now = useRestTimerStore((state) => state.now);
  const pause = useRestTimerStore((state) => state.pause);
  const resume = useRestTimerStore((state) => state.resume);
  const reset = useRestTimerStore((state) => state.reset);
  const dismissDone = useRestTimerStore((state) => state.dismissDone);

  const phase = phaseOf({ endsAt, pausedRemainingMs, doneAt });
  if (phase === 'idle') return null;

  const remainingMs = remainingMsOf({ endsAt, pausedRemainingMs, doneAt, durationMs, now });
  const fraction = phase === 'done' ? 1 : durationMs > 0 ? remainingMs / durationMs : 0;
  const isDone = phase === 'done';

  return (
    <div className="flex items-center gap-2.5 pb-2.5 mb-2.5 border-b border-border">
      <MiniRing fraction={fraction} color={activeColor(phase, remainingMs)} />
      <div className="min-w-0 flex-1">
        <div
          className={`font-mono text-lg font-bold leading-none tabular-nums ${
            isDone ? 'text-green-400' : 'text-text-primary'
          }`}
        >
          {isDone ? 'GO' : formatRestClock(remainingMs)}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-text-secondary/70 leading-none mt-1">
          {isDone ? 'Rest done' : phase === 'paused' ? 'Rest paused' : 'Resting'}
        </div>
      </div>

      {isDone ? (
        <button
          type="button"
          onClick={dismissDone}
          className="h-11 px-4 rounded-xl bg-green-500/15 text-green-300 text-xs font-semibold uppercase tracking-wider active:scale-95 transition-all"
        >
          Got it
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={phase === 'running' ? pause : resume}
            aria-label={phase === 'running' ? 'Pause rest' : 'Resume rest'}
            className="h-11 w-11 rounded-xl bg-surface-hover/60 text-text-primary flex items-center justify-center active:scale-95 transition-all"
          >
            {phase === 'running' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={reset}
            aria-label="Skip rest"
            className="h-11 px-4 rounded-xl bg-surface-hover/60 text-text-secondary text-xs font-semibold uppercase tracking-wider active:scale-95 transition-all"
          >
            Skip
          </button>
        </>
      )}
    </div>
  );
}
