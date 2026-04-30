// External libraries
import { format, subDays, startOfDay } from 'date-fns';

// Types/Interfaces
import type { WorkoutEntry } from '@/types/workout';

export interface HeatmapCell {
  date: string;
  reps: number;
  kcal: number;
  intensity: 0 | 1 | 2 | 3 | 4;
  isToday: boolean;
  isPadding: boolean;
}

interface DailyTotals {
  reps: number;
  kcal: number;
}

function dailyTotalsByDate(workouts: WorkoutEntry[]): Map<string, DailyTotals> {
  const byDate = new Map<string, WorkoutEntry[]>();

  for (const workout of workouts) {
    const list = byDate.get(workout.date) ?? [];
    list.push(workout);
    byDate.set(workout.date, list);
  }

  const totals = new Map<string, DailyTotals>();

  Array.from(byDate.entries()).forEach(([date, dayWorkouts]) => {
    const reps = dayWorkouts.reduce((sum: number, workout) => sum + workout.reps, 0);
    const sortedDescending = [...dayWorkouts].sort((a, b) => b.timestamp - a.timestamp);
    const latestActive = sortedDescending.find((workout) => workout.activeKcal > 0)?.activeKcal ?? 0;
    const latestTotal = sortedDescending.find((workout) => workout.totalKcal > 0)?.totalKcal ?? 0;
    const kcal = Math.max(latestActive, latestTotal);

    totals.set(date, { reps, kcal });
  });

  return totals;
}

function activityScore(totals: DailyTotals): number {
  return totals.reps + totals.kcal * 2;
}

function quantileBoundaries(values: number[]): [number, number, number, number] {
  if (values.length === 0) {
    return [1, 2, 3, 4];
  }

  const sorted = [...values].sort((a, b) => a - b);
  const pick = (q: number) => {
    const index = Math.min(sorted.length - 1, Math.max(0, Math.floor(q * sorted.length)));
    return sorted[index];
  };

  return [pick(0.25), pick(0.5), pick(0.75), pick(0.95)];
}

function bucket(score: number, boundaries: [number, number, number, number]): 0 | 1 | 2 | 3 | 4 {
  if (score <= 0) return 0;
  if (score <= boundaries[0]) return 1;
  if (score <= boundaries[1]) return 2;
  if (score <= boundaries[2]) return 3;
  return 4;
}

export function buildHeatmapData(
  workouts: WorkoutEntry[],
  weekCount: number,
  today: Date = new Date()
): HeatmapCell[][] {
  const totals = dailyTotalsByDate(workouts);
  const nonZeroScores = Array.from(totals.values())
    .map(activityScore)
    .filter((score) => score > 0);
  const boundaries = quantileBoundaries(nonZeroScores);

  const todayStart = startOfDay(today);
  const todayKey = format(todayStart, 'yyyy-MM-dd');
  const todayWeekday = todayStart.getDay();

  const grid: HeatmapCell[][] = [];

  for (let weekIndex = 0; weekIndex < weekCount; weekIndex++) {
    const column: HeatmapCell[] = [];
    const weeksBack = weekCount - 1 - weekIndex;

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const daysBack = weeksBack * 7 + (todayWeekday - dayIndex);

      if (daysBack < 0) {
        column.push({
          date: '',
          reps: 0,
          kcal: 0,
          intensity: 0,
          isToday: false,
          isPadding: true,
        });
        continue;
      }

      const cellDate = subDays(todayStart, daysBack);
      const dateKey = format(cellDate, 'yyyy-MM-dd');
      const dayTotals = totals.get(dateKey) ?? { reps: 0, kcal: 0 };

      column.push({
        date: dateKey,
        reps: dayTotals.reps,
        kcal: dayTotals.kcal,
        intensity: bucket(activityScore(dayTotals), boundaries),
        isToday: dateKey === todayKey,
        isPadding: false,
      });
    }

    grid.push(column);
  }

  return grid;
}
