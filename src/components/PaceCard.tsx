'use client';

// React/Next.js
import { useMemo } from 'react';

// External libraries
import { format } from 'date-fns';

// Utils/Helpers
import { computePace, dayPercent, type PaceResult } from '@/lib/pace';

// Types/Interfaces
import type { WorkoutEntry } from '@/types/workout';

// Icons
import {
  ArrowDown,
  ArrowUp,
  CircleCheck,
  Gauge,
  Hourglass,
  Minus,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';

interface PaceCardProps {
  workouts: WorkoutEntry[];
  goalReps: number;
}

const HOUR_TICKS = [6, 12, 18];
const STRIP_MIN_BAR = 5;
const STRIP_MAX_BAR = 30;

interface Verdict {
  icon: LucideIcon;
  iconClass: string;
  headline: string;
  detail: string;
}

function clockOf(timestampMs: number): string {
  return format(new Date(timestampMs), 'HH:mm');
}

function roundedRate(pace: PaceResult): string {
  return Math.round(pace.ratePerHour).toLocaleString();
}

function verdictFor(pace: PaceResult): Verdict {
  switch (pace.status) {
    case 'empty':
      return {
        icon: Gauge,
        iconClass: 'text-text-secondary/70',
        headline: 'Nothing logged yet today',
        detail:
          pace.yesterdayByNow > 0
            ? `Yesterday you were at ${pace.yesterdayByNow.toLocaleString()} reps by now`
            : 'Log a set and the pace clock starts',
      };
    case 'warming':
      return {
        icon: Hourglass,
        iconClass: 'text-text-secondary/70',
        headline: `${pace.repsToday.toLocaleString()} reps in, pace still settling`,
        detail: 'One more set and the projection kicks in',
      };
    case 'cleared':
      return {
        icon: CircleCheck,
        iconClass: 'text-green-400',
        headline: `Goal cleared at ${pace.clearedAtMs ? clockOf(pace.clearedAtMs) : '—'}`,
        detail: `${pace.repsToday.toLocaleString()} reps so far at ${roundedRate(pace)} reps/h`,
      };
    case 'onPace':
      return {
        icon: TrendingUp,
        iconClass: 'text-green-400',
        headline: `On pace — ${pace.goalReps.toLocaleString()} by ${
          pace.etaMs ? clockOf(pace.etaMs) : '—'
        }`,
        detail: `${roundedRate(pace)} reps/h · heading for ${pace.projectedTotal.toLocaleString()} today`,
      };
    case 'behind':
      return {
        icon: TrendingDown,
        iconClass: 'text-amber-400',
        headline: `Behind pace — need ${Math.ceil(
          pace.neededPerHour ?? 0
        ).toLocaleString()} reps/h`,
        detail: `${roundedRate(pace)} reps/h now · heading for ${pace.projectedTotal.toLocaleString()} by midnight`,
      };
    default:
      return {
        icon: Gauge,
        iconClass: 'text-purple-400',
        headline: `${roundedRate(pace)} reps per hour`,
        detail: `Heading for ${pace.projectedTotal.toLocaleString()} by midnight · set a rep goal for an ETA`,
      };
  }
}

interface DeltaProps {
  current: number;
  reference: number;
}

function YesterdayDelta({ current, reference }: DeltaProps) {
  // With nothing logged yet the delta just restates yesterday's number, and the
  // verdict line above already says where you stood.
  if (current === 0) return null;

  const delta = current - reference;

  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] text-text-secondary/70">
        <Minus className="w-3 h-3" />
        dead even
      </span>
    );
  }

  const isUp = delta > 0;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] ${
        isUp ? 'text-green-400/90' : 'text-red-400/90'
      }`}
    >
      {isUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {Math.abs(delta).toLocaleString()}
    </span>
  );
}

export function PaceCard({ workouts, goalReps }: PaceCardProps) {
  const pace = useMemo(() => computePace(workouts, goalReps), [workouts, goalReps]);

  const yesterdayGhosts = useMemo(() => {
    const yesterdayStart = pace.dayStartMs - 24 * 60 * 60 * 1000;
    return workouts
      .filter((workout) => workout.reps > 0)
      .filter(
        (workout) =>
          workout.timestamp >= yesterdayStart && workout.timestamp < pace.dayStartMs
      )
      .map((workout) => ({
        percent: dayPercent(workout.timestamp, yesterdayStart),
        reps: workout.reps,
      }));
  }, [workouts, pace.dayStartMs]);

  const peakReps = Math.max(
    1,
    ...pace.entries.map((entry) => entry.reps),
    ...yesterdayGhosts.map((ghost) => ghost.reps)
  );

  const barHeight = (reps: number) =>
    STRIP_MIN_BAR + (STRIP_MAX_BAR - STRIP_MIN_BAR) * Math.sqrt(Math.min(1, reps / peakReps));

  const verdict = verdictFor(pace);
  const VerdictIcon = verdict.icon;
  const nowPercent = dayPercent(pace.nowMs, pace.dayStartMs);
  const showProjection =
    pace.status === 'onPace' || pace.status === 'behind' || pace.status === 'noGoal';

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Gauge className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
          <span className="text-xs text-text-secondary uppercase tracking-wider truncate">
            Today&apos;s Pace
          </span>
        </div>
        {pace.ratePerHour > 0 && (
          <span className="text-[11px] font-mono text-text-secondary bg-surface-hover/50 ring-1 ring-border rounded-full px-2 py-0.5 flex-shrink-0">
            {roundedRate(pace)}/h
          </span>
        )}
      </div>

      <div className="flex items-start gap-2.5">
        <VerdictIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${verdict.iconClass}`} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary leading-snug">
            {verdict.headline}
          </p>
          <p className="text-[11px] text-text-secondary leading-snug mt-0.5">
            {verdict.detail}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[10px] uppercase tracking-wider text-text-secondary/70">
            Sets across the day
          </span>
          <span className="flex items-center gap-2 text-[10px] text-text-secondary/70">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-sm bg-green-500" />
              today
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-sm bg-white/20" />
              yesterday
            </span>
          </span>
        </div>

        <div className="relative h-11 rounded-xl bg-surface-hover/40 overflow-hidden">
          <span
            className="absolute inset-x-0 bottom-0 h-px bg-white/15"
            aria-hidden="true"
          />
          {HOUR_TICKS.map((hour) => (
            <span
              key={`tick-${hour}`}
              className="absolute bottom-0 w-px h-2 bg-white/40"
              style={{ left: `${(hour / 24) * 100}%` }}
              aria-hidden="true"
            />
          ))}

          {yesterdayGhosts.map((ghost, index) => (
            <span
              key={`ghost-${index}`}
              className="absolute bottom-0 w-[3px] rounded-t-sm bg-white/20"
              style={{
                left: `${ghost.percent}%`,
                height: `${barHeight(ghost.reps)}px`,
                transform: 'translateX(-1.5px)',
              }}
              aria-hidden="true"
            />
          ))}

          {pace.entries.map((entry) => (
            <span
              key={`entry-${entry.timestamp}`}
              className="absolute bottom-0 w-[3px] rounded-t-sm bg-green-500"
              style={{
                left: `${dayPercent(entry.timestamp, pace.dayStartMs)}%`,
                height: `${barHeight(entry.reps)}px`,
                transform: 'translateX(-1.5px)',
              }}
              title={`${clockOf(entry.timestamp)} · ${entry.reps.toLocaleString()} reps`}
            />
          ))}

          {pace.clearedAtMs !== null && (
            <span
              className="absolute top-1 w-1.5 h-1.5 rounded-full bg-yellow-400"
              style={{
                left: `${dayPercent(pace.clearedAtMs, pace.dayStartMs)}%`,
                transform: 'translateX(-3px)',
              }}
              title={`Goal cleared at ${clockOf(pace.clearedAtMs)}`}
            />
          )}

          <span
            className="absolute top-0 bottom-0 w-0.5 -translate-x-[0.5px] bg-white/60"
            style={{ left: `${nowPercent}%` }}
            aria-hidden="true"
          />
        </div>

        <div className="relative h-3 mt-1" aria-hidden="true">
          {HOUR_TICKS.map((hour) => (
            <span
              key={`label-${hour}`}
              className="absolute -translate-x-1/2 text-[10px] font-mono text-text-secondary/70"
              style={{ left: `${(hour / 24) * 100}%` }}
            >
              {String(hour).padStart(2, '0')}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-text-secondary/70">
            Same time yesterday
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-sm font-mono font-semibold text-text-primary">
              {pace.yesterdayByNow.toLocaleString()}
            </span>
            <YesterdayDelta current={pace.repsToday} reference={pace.yesterdayByNow} />
          </div>
        </div>
        <div className="min-w-0 text-right">
          <div className="text-[10px] uppercase tracking-wider text-text-secondary/70">
            Heading for
          </div>
          <div className="text-sm font-mono font-semibold text-text-primary mt-0.5">
            {showProjection ? pace.projectedTotal.toLocaleString() : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}
