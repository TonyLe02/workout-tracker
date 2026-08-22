// External libraries
import { format, startOfDay, subDays } from 'date-fns';

// Types/Interfaces
import type { WorkoutEntry } from '@/types/workout';

export type PaceStatus = 'empty' | 'warming' | 'onPace' | 'behind' | 'cleared' | 'noGoal';

export interface PaceEntry {
  timestamp: number;
  reps: number;
}

export interface PaceResult {
  status: PaceStatus;
  repsToday: number;
  goalReps: number;
  /** Reps per hour since the first set of the day. */
  ratePerHour: number;
  /** Where today lands at this rate. */
  projectedTotal: number;
  /** When the goal is projected to land, or null. */
  etaMs: number | null;
  /** When the goal was actually crossed, or null. */
  clearedAtMs: number | null;
  /** Rate needed to still finish before midnight, or null. */
  neededPerHour: number | null;
  hoursLeft: number;
  firstEntryMs: number | null;
  entries: PaceEntry[];
  /** Reps logged by this time of day yesterday. */
  yesterdayByNow: number;
  yesterdayTotal: number;
  dayStartMs: number;
  nowMs: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
/** Below this, a rate is an artefact of one quick set rather than a pace. */
const MIN_ELAPSED_MS = 15 * 60 * 1000;

function repEntriesForDate(workouts: WorkoutEntry[], dateKey: string): PaceEntry[] {
  return workouts
    .filter((workout) => workout.date === dateKey && workout.reps > 0)
    .map((workout) => ({ timestamp: workout.timestamp, reps: workout.reps }))
    .sort((left, right) => left.timestamp - right.timestamp);
}

/**
 * Today's logging rate, where it lands, and how it compares with the same point
 * yesterday.
 */
export function computePace(
  workouts: WorkoutEntry[],
  goalReps: number,
  now: Date = new Date()
): PaceResult {
  const nowMs = now.getTime();
  const dayStartMs = startOfDay(now).getTime();
  const dayEndMs = dayStartMs + DAY_MS;
  const msIntoDay = nowMs - dayStartMs;

  const entries = repEntriesForDate(workouts, format(now, 'yyyy-MM-dd'));
  const repsToday = entries.reduce((sum, entry) => sum + entry.reps, 0);

  const yesterday = subDays(now, 1);
  const yesterdayStartMs = startOfDay(yesterday).getTime();
  const yesterdayEntries = repEntriesForDate(workouts, format(yesterday, 'yyyy-MM-dd'));
  const yesterdayTotal = yesterdayEntries.reduce((sum, entry) => sum + entry.reps, 0);
  const yesterdayByNow = yesterdayEntries
    .filter((entry) => Math.max(0, entry.timestamp - yesterdayStartMs) <= msIntoDay)
    .reduce((sum, entry) => sum + entry.reps, 0);

  const firstEntryMs = entries.length > 0 ? entries[0].timestamp : null;
  const elapsedMs = firstEntryMs !== null ? Math.max(0, nowMs - firstEntryMs) : 0;
  const ratePerHour = elapsedMs > 0 ? repsToday / (elapsedMs / HOUR_MS) : 0;
  const hoursLeft = Math.max(0, (dayEndMs - nowMs) / HOUR_MS);
  const projectedTotal = Math.round(repsToday + ratePerHour * hoursLeft);

  let clearedAtMs: number | null = null;
  if (goalReps > 0 && repsToday >= goalReps) {
    let running = 0;
    for (const entry of entries) {
      running += entry.reps;
      if (running >= goalReps) {
        clearedAtMs = entry.timestamp;
        break;
      }
    }
  }

  const remaining = Math.max(0, goalReps - repsToday);
  const etaMs =
    clearedAtMs === null && remaining > 0 && ratePerHour > 0
      ? nowMs + (remaining / ratePerHour) * HOUR_MS
      : null;
  const neededPerHour =
    clearedAtMs === null && remaining > 0 && hoursLeft > 0 ? remaining / hoursLeft : null;

  let status: PaceStatus;
  if (entries.length === 0) {
    status = 'empty';
  } else if (goalReps <= 0) {
    status = 'noGoal';
  } else if (clearedAtMs !== null) {
    status = 'cleared';
  } else if (entries.length < 2 || elapsedMs < MIN_ELAPSED_MS) {
    status = 'warming';
  } else {
    status = etaMs !== null && etaMs <= dayEndMs ? 'onPace' : 'behind';
  }

  return {
    status,
    repsToday,
    goalReps,
    ratePerHour,
    projectedTotal,
    etaMs,
    clearedAtMs,
    neededPerHour,
    hoursLeft,
    firstEntryMs,
    entries,
    yesterdayByNow,
    yesterdayTotal,
    dayStartMs,
    nowMs,
  };
}

/** Position of a moment within its day, as a 0–100 percentage. */
export function dayPercent(timestampMs: number, dayStartMs: number): number {
  const offset = timestampMs - dayStartMs;
  return Math.min(100, Math.max(0, (offset / DAY_MS) * 100));
}
