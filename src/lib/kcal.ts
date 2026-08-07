import type { WorkoutEntry } from '@/types/workout';

/**
 * Calories accumulate across log entries for a given day, the same way reps do
 * (e.g. logging +100 then +100 should total 200, not stay at 100).
 *
 * Active and total kcal are summed independently, then the larger of the two
 * sums is used as the day's calorie total — "total" calories from a fitness
 * tracker typically already includes "active" calories, so summing both
 * together would double-count them.
 */
export function sumKcalForDay(
  entries: Pick<WorkoutEntry, 'activeKcal' | 'totalKcal'>[]
): number {
  const activeSum = entries.reduce((sum, entry) => sum + entry.activeKcal, 0);
  const totalSum = entries.reduce((sum, entry) => sum + entry.totalKcal, 0);
  return Math.max(activeSum, totalSum);
}
